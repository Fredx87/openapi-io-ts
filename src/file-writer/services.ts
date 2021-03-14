import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { camelCase } from "lodash";
import { GenRTE } from "../environment";
import {
  ApiParameter,
  ApiResponse,
  ParsedOperation,
  ParserOutput,
} from "../parser/parserOutput";
import { createDir, writeFormatted } from "./common";

export function writeServices({ apis }: ParserOutput): GenRTE<void> {
  const tasks = Object.entries(apis).map(([tag, apis]) =>
    writeFormatted(`services/${tag}.ts`, generateService(tag, apis))
  );

  return pipe(
    createDir("services"),
    RTE.chain(() => RTE.sequenceSeqArray(tasks)),
    RTE.map(() => {})
  );
}

function generateService(tag: string, apis: ParsedOperation[]): string {
  const generatedApis = apis.map(generateApi).join("");
  const imports = `import * as t from "io-ts";
  import * as models from "../models";
  import { ApiDefinition } from "../openapi-client/apiDefinition";
  import { HttpRequestHandler } from "../openapi-client/httpRequestHandler";
  import { request } from "../openapi-client/request";`;

  const res = `${imports}
  
  ${generatedApis}
    
    export const ${tag}ServiceBuilder = (requestHandler: HttpRequestHandler) => ({
        ${apis
          .map(
            (api) => `${api.operationId}: ${api.operationId}(requestHandler)`
          )
          .join(",\n")}
      });`;

  return res;
}

function generateApi(api: ParsedOperation): string {
  const requestParams = generateApiRequestParams(api);
  const apiDefinition = generateApiDefinition(api);
  const callFunction = generateCallFunction(
    api,
    apiDefinition.name,
    requestParams?.name
  );

  const res = `${requestParams?.content ?? ``}
  
  ${apiDefinition.content}
  
  ${callFunction}`;

  return res;
}

interface GeneratedItem {
  name: string;
  content: string;
}

function generateApiRequestParams(
  api: ParsedOperation
): GeneratedItem | undefined {
  if (api.params.length === 0) {
    return undefined;
  }

  const name = `${camelCase(api.operationId)}RequestParameters`;
  const content = `type ${name} = { ${api.params
    .map(generateApiRequestParam)
    .join("\n")} }`;

  return { name, content };
}

function generateApiRequestParam(param: ApiParameter): string {
  const { name, type, required } = param;

  return `${name}: ${gen.printStatic(type)} ${!required ? `| undefined` : ""};`;
}

function generateApiDefinition(api: ParsedOperation): GeneratedItem {
  const { path, operationId: apiName, method, params, responses } = api;

  const returnType = getReturnType(responses);

  const name = `${apiName}ApiDefinition`;
  const content = `const ${name}: ApiDefinition<${
    returnType ? gen.printStatic(returnType) : "void"
  }> = {
        path: "${path}",
        method: "${method}",
        params: {
            ${params.map(generateApiDefinitionParam).join(",\n")}
        },
        ${returnType ? `responseDecoder: ${gen.printRuntime(returnType)},` : ""}
    };
    `;

  return { name, content };
}

function getReturnType(
  responses: ApiResponse[]
): gen.TypeReference | undefined {
  for (const response of responses) {
    if (
      parseInt(response.code) >= 200 &&
      parseInt(response.code) < 300 &&
      response.mediaType === "application/json"
    ) {
      return response.type;
    }
  }

  return undefined;
}

function generateApiDefinitionParam(param: ApiParameter): string {
  const { name, in: paramIn, defaultValue } = param;
  return `${name}: {
        in: "${paramIn}",
        ${defaultValue ? `defaultValue: ${defaultValue}` : ""}
    }`;
}

function generateCallFunction(
  api: ParsedOperation,
  apiDefinitionName: string,
  requestParamsName?: string
): string {
  const params = getCallFunctionParameters(api, requestParamsName);

  const paramsKeysValues = Object.entries(params)
    .map(([key, value]) => `${key}: ${value}`)
    .join(`,`);

  return `export const ${
    api.operationId
  } = (requestHandler: HttpRequestHandler) => (${paramsKeysValues}) =>
  request(${apiDefinitionName}, ${params.params ? "params" : "undefined"}, ${
    params.body ? "body" : "undefined"
  }, requestHandler);`;
}

interface CallFunctionParameters {
  params?: string;
  body?: string;
}

function getCallFunctionParameters(
  api: ParsedOperation,
  requestParamsName?: string
): CallFunctionParameters {
  const res: CallFunctionParameters = {};

  if (requestParamsName) {
    res.params = requestParamsName;
  }

  if (O.isSome(api.body)) {
    res.body = gen.printStatic(api.body.value.type);
  }

  return res;
}
