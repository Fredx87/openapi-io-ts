import { pipe } from "fp-ts/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as R from "fp-ts/Record";
import * as gen from "io-ts-codegen";
import { capitalize } from "../utils";
import { BodyItemOrRef } from "../parser/body";
import { ParsedOperation } from "../parser/operation";
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
import { generateOperationParameter } from "./parameter";
import { ParameterItemOrRef } from "../parser/parameter";
import { generateOperationResponses } from "./response";
import { ParsedJsonResponse, ResponseItemOrRef } from "../parser/response";
import {
  generateOperationBody,
  generateOperationBodySchema,
  getBodyOrRefStaticType,
} from "./body";
import {
  FORM_ENCODED_MEDIA_TYPE,
  JSON_MEDIA_TYPE,
  TEXT_PLAIN_MEDIA_TYPE,
} from "@openapi-io-ts/core";
import { ParsedItem } from "../parser/common";

export function generateOperations(): CodegenRTE<void> {
  return pipe(
    RTE.asks((context: CodegenContext) => context.parserOutput.operations),
    RTE.bindTo("operations"),
    RTE.chainFirst(({ operations }) =>
      R.traverseWithIndex(RTE.ApplicativeSeq)(generateOperation)(operations)
    ),
    RTE.map(() => void 0)
  );
}

export function requestBuilderName(operationId: string): string {
  return `${capitalize(operationId, "camel")}Builder`;
}

export function requestFunctionName(operationId: string): string {
  return `${capitalize(operationId, "pascal")}RequestFunction`;
}

export function operationName(operationId: string): string {
  return `${capitalize(operationId, "camel")}Operation`;
}

interface GeneratedOperationParameters {
  schemas: string;
  definition: string;
  requestMap: string;
}

interface GeneratedBody {
  operationBody: string;
  requestBody: string;
  schema?: string;
}

interface GeneratedResponses {
  schemas: string;
  operationResponses: string;
}

interface GeneratedItems {
  parameters?: GeneratedOperationParameters;
  body?: GeneratedBody;
  responses: GeneratedResponses;
  defaultHeaders: string;
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
    RTE.bind("responses", () => generateResponses(operation.responses)),
    RTE.bind("returnType", () => getReturnType(operation.responses)),
    RTE.bind("defaultHeaders", () => getDefaultHeaders(operation))
  );
}

function generateFileContent(
  operationId: string,
  operation: ParsedOperation,
  items: GeneratedItems
): CodegenRTE<string> {
  const content = `import * as t from "io-ts";
  import type { RequestFunction } from "${RUNTIME_PACKAGE}";
  import * as schemas from "../${SCHEMAS_PATH}";
  import * as parameters from "../${PARAMETERS_PATH}";
  import * as responses from "../${RESPONSES_PATH}";
  import * as requestBodies from "../${REQUEST_BODIES_PATH}";

  ${
    items.parameters
      ? `${items.parameters.schemas}
  ${items.parameters.requestMap}`
      : ""
  }

  ${items.body?.schema ?? ""}

  ${items.responses.schemas}

  ${generateOperationObject(operationId, operation, items)}

  ${generateRequestFunctionType(operationId, items)}
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
    RTE.map((defs) => `[ ${defs.join(",")} ]`)
  );
}

function generateOperationParameterDefinition(
  parameter: ParameterItemOrRef
): CodegenRTE<string> {
  return pipe(
    getParsedItem(parameter),
    RTE.map((item) => {
      if (parameter._tag === "ComponentRef") {
        return `${parameter.componentType}.${item.name}`;
      } else {
        return generateOperationParameter(item.item);
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
      const modifier = parameter.item.required ? "" : "?";

      const staticType =
        parameter.item.type.kind === "TypeDeclaration"
          ? `${getItemOrRefPrefix(parameter)}${parameter.name}`
          : gen.printStatic(parameter.item.type);

      return `${parameter.name}${modifier}: ${staticType};`;
    })
  );
}

function generateOperationObject(
  operationId: string,
  operation: ParsedOperation,
  generatedItems: GeneratedItems
): string {
  const { path, method } = operation;

  return `export const ${operationName(operationId)} = {
      path: "${path}",
      method: "${method}",
      responses: ${generatedItems.responses.operationResponses},
      parameters: ${generatedItems.parameters?.definition ?? "[]"},
      requestDefaultHeaders: ${generatedItems.defaultHeaders},
      ${generatedItems.body ? `body: ${generatedItems.body.operationBody}` : ""}
  } as const`;
}

function generateBody(
  itemOrRef: O.Option<BodyItemOrRef>
): CodegenRTE<GeneratedBody | undefined> {
  if (O.isNone(itemOrRef)) {
    return RTE.right(undefined);
  }

  return pipe(
    RTE.Do,
    RTE.bind("body", () => getParsedItem(itemOrRef.value)),
    RTE.bind("requestBody", () => getBodyOrRefStaticType(itemOrRef.value)),
    RTE.map(({ body, requestBody }) => {
      const res: GeneratedBody = {
        operationBody: isParsedItem(itemOrRef.value)
          ? generateOperationBody(body)
          : `${getItemOrRefPrefix(itemOrRef.value)}${body.name}`,
        requestBody,
        schema: isParsedItem(itemOrRef.value)
          ? generateOperationBodySchema(itemOrRef.value.item)
          : undefined,
      };

      return res;
    })
  );
}

function generateResponses(
  responses: Record<string, ResponseItemOrRef>
): CodegenRTE<GeneratedResponses> {
  return pipe(
    RTE.Do,
    RTE.bind("schemas", () => generateResponsesSchemas(responses)),
    RTE.bind("operationResponses", () => generateOperationResponses(responses))
  );
}

function generateResponsesSchemas(
  responses: Record<string, ResponseItemOrRef>
): CodegenRTE<string> {
  return RTE.right(
    Object.values(responses)
      .filter(isParsedJsonResponse)
      .map((r) => generateSchemaIfDeclaration(r.item.type))
      .join("\n")
  );
}

function isParsedJsonResponse(
  response: ResponseItemOrRef
): response is ParsedItem<ParsedJsonResponse> {
  return isParsedItem(response) && response.item._tag === "ParsedJsonResponse";
}

function generateRequestFunctionType(
  operationId: string,
  generatedItems: GeneratedItems
): string {
  const { parameters, body } = generatedItems;

  const argsArray: string[] = [];

  if (parameters != null) {
    argsArray.push(`params: ${requestParametersMapName(operationId)}`);
  }

  if (body != null) {
    argsArray.push(`body: ${body.requestBody}`);
  }

  const args =
    argsArray.length > 0 ? `{ ${argsArray.join("; ")} }` : "undefined";

  return `export type ${requestFunctionName(
    operationId
  )} = RequestFunction<${args}, ${
    generatedItems.responses.operationResponses
  }>`;
}

function getReturnType(
  responses: Record<string, ResponseItemOrRef>
): CodegenRTE<string> {
  const successfulResponse = getSuccessfulResponse(responses);

  if (successfulResponse == null) {
    return RTE.right("void");
  }

  return pipe(
    getParsedItem(successfulResponse),
    RTE.map((response) => {
      if (response.item._tag === "ParsedEmptyResponse") {
        return "void";
      }

      if (response.item._tag === "ParsedFileResponse") {
        return "Blob";
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

function getDefaultHeaders(operation: ParsedOperation): CodegenRTE<string> {
  return pipe(
    RTE.Do,
    RTE.bind("contentType", () => getContentTypeHeader(operation)),
    RTE.bind("accept", () => getAcceptHeader(operation)),
    RTE.map(({ contentType, accept }) => {
      const headers: Record<string, string> = {};

      if (contentType) {
        headers["Content-Type"] = contentType;
      }

      if (accept) {
        headers["Accept"] = accept;
      }

      return JSON.stringify(headers);
    })
  );
}

function getContentTypeHeader(
  operation: ParsedOperation
): CodegenRTE<string | undefined> {
  return pipe(
    operation.body,
    O.fold(
      () => RTE.right(undefined),
      (itemOrRef) =>
        pipe(
          getParsedItem(itemOrRef),
          RTE.map((body) => {
            switch (body.item._tag) {
              case "ParsedBinaryBody": {
                return undefined;
              }
              case "ParsedFormBody": {
                return FORM_ENCODED_MEDIA_TYPE;
              }
              case "ParsedMultipartBody": {
                return undefined;
              }
              case "ParsedJsonBody": {
                return JSON_MEDIA_TYPE;
              }
              case "ParsedTextBody": {
                return TEXT_PLAIN_MEDIA_TYPE;
              }
            }
          })
        )
    )
  );
}

function getAcceptHeader(
  operation: ParsedOperation
): CodegenRTE<string | undefined> {
  const successfulResponse = getSuccessfulResponse(operation.responses);

  if (successfulResponse == null) {
    return RTE.right(undefined);
  }

  return pipe(
    getParsedItem(successfulResponse),
    RTE.map((response) =>
      response.item._tag === "ParsedJsonResponse" ? JSON_MEDIA_TYPE : undefined
    )
  );
}

function getSuccessfulResponse(
  responses: Record<string, ResponseItemOrRef>
): ResponseItemOrRef | undefined {
  const successfulCode = Object.keys(responses).find((c) => c.startsWith("2"));

  return successfulCode ? responses[successfulCode] : undefined;
}

function requestParametersMapName(operationId: string): string {
  return `${capitalize(operationId, "pascal")}RequestParameters`;
}
