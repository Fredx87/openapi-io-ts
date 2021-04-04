import { pipe } from "fp-ts/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as R from "fp-ts/Record";
import * as gen from "io-ts-codegen";
import { capitalize } from "../common/utils";
import { BodyItemOrRef } from "../parser/body";
import { OperationResponses, ParsedOperation } from "../parser/operation";
import { generateBodyType, generateRequestBody } from "./body";
import {
  generateSchemaIfDeclaration,
  getParsedItem,
  isParsedItem,
  OPERATIONS_PATH,
  PARAMETERS_PATH,
  RUNTIME_PACKAGE,
  SCHEMAS_PATH,
  writeGeneratedFile,
  getItemOrRefPrefix,
  REQUEST_BODIES_PATH,
  RESPONSES_PATH,
} from "./common";
import { CodegenContext, CodegenRTE } from "./context";
import { generateParameterDefinition } from "./parameter";
import { ParameterItemOrRef } from "../parser/parameter";
import { generateResponseDefinition } from "./response";

export function generateOperations(): CodegenRTE<void> {
  return pipe(
    RTE.asks((context: CodegenContext) => context.parserOutput.operations),
    RTE.chain((operations) =>
      R.traverseWithIndex(RTE.readerTaskEitherSeq)(generateOperation)(
        operations
      )
    ),
    RTE.map(() => void 0)
  );
}

interface GeneratedOperationParameters {
  schemas: string;
  definition: string;
  requestMap: string;
}

interface GeneratedBody {
  bodyType: string;
  requestBody?: string;
  requestBodyName: string;
}

interface GeneratedItems {
  parameters?: GeneratedOperationParameters;
  body?: GeneratedBody;
  successfulResponse: string;
  returnType: string;
}

function generateOperation(
  operationId: string,
  operation: ParsedOperation
): CodegenRTE<void> {
  return pipe(
    generateItems(operationId, operation),
    RTE.chain((items) => generateFileContent(operationId, operation, items)),
    RTE.chain((content) =>
      writeGeneratedFile(OPERATIONS_PATH, `${operationId}.ts`, content)
    )
  );
}

function generateItems(
  operationId: string,
  operation: ParsedOperation
): CodegenRTE<GeneratedItems> {
  return pipe(
    RTE.Do,
    RTE.bind("parameters", () =>
      generateOperationParameters(operationId, operation.parameters)
    ),
    RTE.bind("body", () => generateBody(operation.body)),
    RTE.bind("successfulResponse", () =>
      generateResponseDefinition(operation.responses.success)
    ),
    RTE.bind("returnType", () => getReturnType(operation.responses))
  );
}

function generateFileContent(
  operationId: string,
  operation: ParsedOperation,
  items: GeneratedItems
): CodegenRTE<string> {
  const content = `import * as t from "io-ts";
  import * as schemas from "../${SCHEMAS_PATH}";
  import * as parameters from "../${PARAMETERS_PATH}";
  import * as responses from "../${RESPONSES_PATH}";
  import * as requestBodies from "../${REQUEST_BODIES_PATH}";
  import { RequestDefinition, ParametersDefinitions, HttpRequestAdapter, ApiError, request } from "${RUNTIME_PACKAGE}";
  import { TaskEither } from "fp-ts/TaskEither";

  ${
    items.parameters
      ? `${items.parameters.schemas}
  ${items.parameters.requestMap}`
      : ""
  }

  ${items.body?.requestBody ?? ""}

  ${generateRequestDefinition(operationId, operation, items)}

  ${generateRequest(operationId, items)}
  `;

  return RTE.right(content);
}

function generateOperationParameters(
  operationId: string,
  parameters: ParameterItemOrRef[]
): CodegenRTE<GeneratedOperationParameters | undefined> {
  if (parameters.length === 0) {
    return RTE.right(undefined);
  }

  return pipe(
    RTE.Do,
    RTE.bind("schemas", () => generateOperationParametersSchemas(parameters)),
    RTE.bind("definition", () =>
      generateOperationParametersDefinition(parameters)
    ),
    RTE.bind("requestMap", () =>
      generateRequestParametersMap(operationId, parameters)
    )
  );
}

function generateOperationParametersSchemas(
  parameters: ParameterItemOrRef[]
): CodegenRTE<string> {
  const schemas = pipe(
    parameters,
    A.filter(isParsedItem),
    A.map((parameter) => generateSchemaIfDeclaration(parameter.item.type))
  );

  return RTE.right(schemas.join("\n"));
}

function generateOperationParametersDefinition(
  parameters: ParameterItemOrRef[]
): CodegenRTE<string> {
  return pipe(
    parameters,
    RTE.traverseSeqArray(generateOperationParameterDefinition),
    RTE.map((defs) => `{ ${defs.join(",")} }`)
  );
}

function generateOperationParameterDefinition(
  parameter: ParameterItemOrRef
): CodegenRTE<string> {
  return pipe(
    getParsedItem(parameter),
    RTE.map((item) => {
      if (parameter._tag === "ComponentRef") {
        return `${item.name}: ${parameter.componentType}.${item.name}`;
      } else {
        return `${item.name}: ${generateParameterDefinition(item.item)}`;
      }
    })
  );
}

function generateRequestParametersMap(
  operationId: string,
  parameters: ParameterItemOrRef[]
): CodegenRTE<string> {
  const mapName = requestParametersMapName(operationId);

  return pipe(
    parameters,
    RTE.traverseSeqArray(generateRequestParameter),
    RTE.map(
      (ps) => `export type ${mapName} = {
      ${ps.join("\n")}
  }`
    )
  );
}

function generateRequestParameter(
  itemOrRef: ParameterItemOrRef
): CodegenRTE<string> {
  return pipe(
    getParsedItem(itemOrRef),
    RTE.map((parameter) => {
      const staticType =
        parameter.item.type.kind === "TypeDeclaration"
          ? `${getItemOrRefPrefix(parameter)}${parameter.name}`
          : gen.printStatic(parameter.item.type);

      return `${parameter.name}: ${staticType} ${
        !parameter.item.required ? `| undefined` : ""
      };`;
    })
  );
}

function generateRequestDefinition(
  operationId: string,
  operation: ParsedOperation,
  generatedItems: GeneratedItems
): string {
  const { path, method } = operation;

  return `export const ${requestDefinitionName(
    operationId
  )}: RequestDefinition<${generatedItems.returnType}> = {
      path: "${path}",
      method: "${method}",
      successfulResponse: ${generatedItems.successfulResponse},
      parametersDefinitions: ${generatedItems.parameters?.definition ?? "{}"},
      ${generatedItems.body ? `bodyType: ${generatedItems.body.bodyType}` : ""}
  }`;
}

function generateBody(
  itemOrRef: O.Option<BodyItemOrRef>
): CodegenRTE<GeneratedBody | undefined> {
  if (O.isNone(itemOrRef)) {
    return RTE.right(undefined);
  }

  return pipe(
    getParsedItem(itemOrRef.value),
    RTE.map((body) => {
      const res: GeneratedBody = {
        bodyType: generateBodyType(body.item),
        requestBody: isParsedItem(itemOrRef.value)
          ? generateRequestBody(body)
          : undefined,
        requestBodyName: `${getItemOrRefPrefix(itemOrRef.value)}${body.name}`,
      };

      return res;
    })
  );
}

function generateRequest(
  operationId: string,
  generatedItems: GeneratedItems
): string {
  const PARAM_ARG_NAME = "params";
  const BODY_ARG_NAME = "body";

  const args: string[] = [];

  if (generatedItems.parameters) {
    args.push(`${PARAM_ARG_NAME}: ${requestParametersMapName(operationId)}`);
  }

  if (generatedItems.body) {
    args.push(`${BODY_ARG_NAME}: ${generatedItems.body.requestBodyName}`);
  }

  return `export const ${operationId} = (requestAdapter: HttpRequestAdapter) => (${args.join(
    ", "
  )}): TaskEither<ApiError, ${generatedItems.returnType}> =>
      request(${requestDefinitionName(operationId)}, ${
    generatedItems.parameters ? PARAM_ARG_NAME : "{}"
  }, ${generatedItems.body ? BODY_ARG_NAME : "undefined"}, requestAdapter);`;
}

function getReturnType(responses: OperationResponses): CodegenRTE<string> {
  const { success } = responses;

  return pipe(
    getParsedItem(success),
    RTE.map((response) => {
      if (response.item._tag === "TextResponse") {
        return "string";
      }

      const { type } = response.item;

      const staticType =
        type.kind === "TypeDeclaration"
          ? `${getItemOrRefPrefix(response)}${type.name}`
          : gen.printStatic(type);

      return staticType;
    })
  );
}

function requestParametersMapName(operationId: string): string {
  return `${capitalize(operationId, "pascal")}RequestParameters`;
}

function requestDefinitionName(operationId: string): string {
  return `${capitalize(operationId, "camel")}RequestDefinition`;
}
