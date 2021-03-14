import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as R from "fp-ts/Record";
import * as gen from "io-ts-codegen";
import { GenRTE } from "../environment";
import { ParsedBody } from "../parser/body";
import { OperationResponses, ParsedOperation } from "../parser/operation";
import { ParsedParameter } from "../parser/parameter";
import { ParsedResponse } from "../parser/response";
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
    RTE.map(() => {})
  );
}

function generateOperation(
  operationId: string,
  operation: ParsedOperation
): GenRTE<void> {
  const content = `import * as t from "io-ts";
  import * as schemas from "../components/schemas";
  import * as parameters from "../components/parameters";
  import { RequestDefinition } from "../openapi-client/requestDefinition";
  import { ParametersDefinitions } from "../openapi-client/parameter";
  import { HttpRequestAdapter } from "../openapi-client/httpRequestAdapter";
  import { request } from "../openapi-client/request";
  
  ${generateOperationParametersDefinitions(operation.parameters)}

  ${generateRequestParametersMap(operationId, operation.parameters)}

  ${generateSuccessfulResponse(operation.responses.success)}

  ${generateBody(operation.body)}

  ${generateRequestDefinition(operationId, operation)}

  ${generateRequest(operationId)}
  `;

  return writeFormatted(`operations/${operationId}.ts`, content);
}

function generateOperationParametersDefinitions(
  parameters: ParsedParameter[]
): string {
  const schemas: string[] = [];
  const definitions: string[] = [];

  parameters.forEach((p) => {
    const [schema, definition] = generateOperationParameterDefinition(p);
    schemas.push(schema);
    definitions.push(definition);
  });

  return `${schemas.join("\n")}
    
    const parametersDefinitions: ParametersDefinitions = {
        ${definitions.join("\n")}
    }`;
}

function generateOperationParameterDefinition(
  parameter: ParsedParameter
): [string, string] {
  if (parameter._tag === "ComponentRef") {
    return [
      "",
      `${parameter.component.name}: parameters.${parameter.component.name}`,
    ];
  }

  return [
    generateSchemaIfDeclaration(parameter.value.type),
    `${parameter.value.name}: ${generateParameterDefinition(parameter.value)}`,
  ];
}

function generateRequestParametersMap(
  operationId: string,
  parameters: ParsedParameter[]
): string {
  if (parameters.length === 0) {
    return `type ${operationId}RequestParameters = undefined;`;
  }

  return `interface ${operationId}RequestParameters {
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
  const name = "successfulResponse";
  const responseObject =
    response._tag === "ComponentRef"
      ? response.component.object
      : response.value;

  if (responseObject._tag === "TextResponse") {
    return `const ${name} = { _tag: "TextResponse"} as const; `;
  }

  const typePrefix = response._tag === "ComponentRef" ? "responses." : "";

  const { type } = responseObject;

  const runtimeType =
    type.kind === "TypeDeclaration"
      ? `${typePrefix}${type.name}`
      : gen.printRuntime(type);

  return `${name} = { _tag: "JsonResponse", decoder: ${runtimeType}}; `;
}

function generateRequestDefinition(
  operationId: string,
  operation: ParsedOperation
): string {
  const { path, method, responses } = operation;

  const returnType = getReturnType(responses);

  return `const ${operationId}RequestDefinition: RequestDefinition<${returnType}> = {
      path: "${path}",
      method: "${method}",
      parametersDefinitions,
      successfulResponse,
      body
  }`;
}

function generateBody(body: O.Option<ParsedBody>): string {
  if (O.isNone(body)) {
    return `const body = undefined; const requestBody = undefined; `;
  }

  const bodyObject =
    body.value._tag === "ComponentRef"
      ? body.value.component.object
      : body.value.value;

  let res = `const body = ${generateBodyType(bodyObject)}; `;

  if (bodyObject._tag === "JsonBody") {
    if (bodyObject.type.kind === "TypeDeclaration") {
      res += `${gen.printStatic(bodyObject.type)}`;
    }

    res += `type RequestBody = ${
      bodyObject.type.kind === "TypeDeclaration"
        ? bodyObject.type.name
        : gen.printStatic(bodyObject.type)
    }`;
  } else {
    res += `type RequestBody = string`;
  }

  return res;
}

function generateRequest(operationId: string): string {
  return `export const ${operationId} = (requestAdapter: HttpRequestAdapter) => (params: ${operationId}RequestParameters, body: RequestBody) =>
      request(${operationId}RequestDefinition, params, body, requestAdapter);`;
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
