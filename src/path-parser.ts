import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { ParserContext } from "./parser";
import { createModel, parseSchema, shouldGenerateModel } from "./schema-parser";
import { getObjectByRef, isReference } from "./utils";

export type ApiParameterIn = "query" | "header" | "path" | "cookie";

export interface ApiParameter {
  name: string;
  type: gen.TypeReference;
  in: ApiParameterIn;
  required: boolean;
  defaultValue?: any;
}

export interface ApiBody {
  name: string;
  type: gen.TypeReference;
}

export type ApiMethod = "get" | "post" | "put" | "delete";

export interface Api {
  path: string;
  name: string;
  method: ApiMethod;
  params: ApiParameter[];
  body?: ApiBody;
  returnType?: gen.TypeReference;
}

function createApiParameter(
  param: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject,
  context: ParserContext
): ApiParameter {
  const resolvedParam = isReference(param)
    ? (getObjectByRef(param, context.document) as OpenAPIV3.ParameterObject)
    : param;
  const schema = resolvedParam.schema
    ? parseSchema(resolvedParam.schema, context)
    : gen.unknownType;
  const type = shouldGenerateModel(schema)
    ? createModel(resolvedParam.name, schema, context)
    : schema;

  return {
    name: resolvedParam.name,
    type,
    in: resolvedParam.in as ApiParameterIn, // wrong type in openapi-types
    required: resolvedParam.required || false
  };
}

export function parseApi(
  path: string,
  method: ApiMethod,
  operation: OpenAPIV3.OperationObject,
  context: ParserContext
): Api {
  const { operationId, parameters, requestBody, responses } = operation;

  let params: ApiParameter[] = [];
  if (parameters) {
    params = parameters.map(p => createApiParameter(p, context));
  }

  return {
    path,
    name: operationId!,
    method,
    params
  };
}
