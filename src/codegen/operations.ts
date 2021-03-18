import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as R from "fp-ts/Record";
import * as gen from "io-ts-codegen";
import { GenRTE } from "../environment";
import { ParsedBody, ParsedBodyObject } from "../parser/body";
import { OperationResponses, ParsedOperation } from "../parser/operation";
import { ParsedParameter } from "../parser/parameter";
import { ParsedResponse } from "../parser/response";
import { pascalCase } from "../utils";
import { generateBodyType } from "./body";
import { generateSchemaIfDeclaration, writeFormatted } from "./common";
import { generateParameterDefinition } from "./parameter";

export function generateOperations(
  operations: Record<string, ParsedOperation>
): GenRTE<void> {
  return pipe(
    operations,
    R.mapWithIndex(generateOperation),
    R.sequence(RTE.readerTaskEitherSeq),
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
  requestBody: string;
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
): GenRTE<void> {
  const generatedItems = generateItems(operationId, operation);

  const content = `import * as t from "io-ts";
  import * as schemas from "../components/schemas";
  import * as parameters from "../components/parameters";
  import { RequestDefinition } from "../openapi-client/requestDefinition";
  import { ParametersDefinitions } from "../openapi-client/parameter";
  import { HttpRequestAdapter } from "../openapi-client/httpRequestAdapter";
  import { ApiError, request } from "../openapi-client/request";
  import { TaskEither } from "fp-ts/TaskEither";

  ${
    generatedItems.parameters
      ? `${generatedItems.parameters.schemas}
  ${generatedItems.parameters.requestMap}`
      : ""
  }

  ${generatedItems.body ? generatedItems.body.requestBody : ""}

  ${generateRequestDefinition(operationId, operation, generatedItems)}

  ${generateRequest(operationId, generatedItems)}
  `;

  return writeFormatted(`operations/${operationId}.ts`, content);
}

function generateItems(
  operationId: string,
  operation: ParsedOperation
): GeneratedItems {
  return {
    parameters: generateOperationParameters(operationId, operation.parameters),
    body: generateBody(operationId, operation.body),
    successfulResponse: generateSuccessfulResponse(operation.responses.success),
    returnType: getReturnType(operation.responses),
  };
}

function generateOperationParameters(
  operationId: string,
  parameters: ParsedParameter[]
): GeneratedOperationParameters | undefined {
  if (parameters.length === 0) {
    return undefined;
  }

  const res: GeneratedOperationParameters = {
    schemas: generateOperationParametersSchemas(parameters),
    definition: generateOperationParametersDefinition(parameters),
    requestMap: generateRequestParametersMap(operationId, parameters),
  };

  return res;
}

function generateOperationParametersSchemas(
  parameters: ParsedParameter[]
): string {
  return parameters
    .map((p) =>
      p._tag === "ComponentRef" ? "" : generateSchemaIfDeclaration(p.value.type)
    )
    .join("\n");
}

function generateOperationParametersDefinition(
  parameters: ParsedParameter[]
): string {
  return `{ ${parameters
    .map(generateOperationParameterDefinition)
    .join(",")} }`;
}

function generateOperationParameterDefinition(
  parameter: ParsedParameter
): string {
  if (parameter._tag === "ComponentRef") {
    return `${parameter.component.name}: parameters.${parameter.component.name}`;
  } else {
    return `${parameter.value.name}: ${generateParameterDefinition(
      parameter.value
    )}`;
  }
}

function generateRequestParametersMap(
  operationId: string,
  parameters: ParsedParameter[]
): string {
  return `export type ${requestParametersMapName(operationId)} = {
      ${parameters.map(generateRequestParameter).join("\n")}
  }`;
}

function generateRequestParameter(parameter: ParsedParameter): string {
  const parameterObject =
    parameter._tag === "ComponentRef"
      ? parameter.component.object
      : parameter.value;

  const typePrefix = parameter._tag === "ComponentRef" ? "parameters." : "";

  const { name, type, required } = parameterObject;

  const staticType =
    type.kind === "TypeDeclaration"
      ? `${typePrefix}${type.name}`
      : gen.printStatic(type);

  return `${name}: ${staticType} ${!required ? `| undefined` : ""};`;
}

function generateSuccessfulResponse(response: ParsedResponse): string {
  const responseObject =
    response._tag === "ComponentRef"
      ? response.component.object
      : response.value;

  if (responseObject._tag === "TextResponse") {
    return `{ _tag: "TextResponse"}`;
  }

  const typePrefix = response._tag === "ComponentRef" ? "responses." : "";

  const { type } = responseObject;

  const runtimeType =
    type.kind === "TypeDeclaration"
      ? `${typePrefix}${type.name}`
      : gen.printRuntime(type);

  return `{ _tag: "JsonResponse", decoder: ${runtimeType}}`;
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
  operationId: string,
  body: O.Option<ParsedBody>
): GeneratedBody | undefined {
  if (O.isNone(body)) {
    return undefined;
  }

  const bodyObject =
    body.value._tag === "ComponentRef"
      ? body.value.component.object
      : body.value.value;

  const res: GeneratedBody = {
    bodyType: generateBodyType(bodyObject),
    requestBody: generateRequestBody(operationId, bodyObject),
  };

  return res;
}

function generateRequestBody(
  operationId: string,
  bodyObject: ParsedBodyObject
): string {
  return `export type ${requestBodyName(operationId)} = ${
    bodyObject._tag === "JsonBody" ? gen.printStatic(bodyObject.type) : "string"
  }`;
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
    args.push(`${BODY_ARG_NAME}: ${requestBodyName(operationId)}`);
  }

  return `export const ${operationId} = (requestAdapter: HttpRequestAdapter) => (${args.join(
    ", "
  )}): TaskEither<ApiError, ${generatedItems.returnType}> =>
      request(${operationId}RequestDefinition, ${
    generatedItems.parameters ? PARAM_ARG_NAME : "undefined"
  }, ${generatedItems.body ? BODY_ARG_NAME : "undefined"}, requestAdapter);`;
}

function getReturnType(responses: OperationResponses): string {
  const { success } = responses;

  const responseObject =
    success._tag === "ComponentRef" ? success.component.object : success.value;

  if (responseObject._tag === "TextResponse") {
    return "string";
  }

  const typePrefix = success._tag === "ComponentRef" ? "responses." : "";

  const { type } = responseObject;

  const staticType =
    type.kind === "TypeDeclaration"
      ? `${typePrefix}${type.name}`
      : gen.printStatic(type);

  return staticType;
}

function requestParametersMapName(operationId: string): string {
  return `${pascalCase(operationId)}RequestParameters`;
}

function requestBodyName(operationId: string): string {
  return `${pascalCase(operationId)}RequestBody`;
}

function requestDefinitionName(operationId: string): string {
  return `${operationId}RequestDefinition`;
}
