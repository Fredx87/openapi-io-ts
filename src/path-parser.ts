import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { pascalCase, getObjectByRef } from "./utils";
import * as prettier from "prettier";
import { printSchema, getComponentParameterName } from "./parser";
import { appendFileSync } from "fs";
import { getReferenceName, parseSchema } from "./schema-parser";

export interface ApiParameter {
  name: string;
  type: gen.TypeReference;
  in: "query" | "type";
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

function extractTypeFromComplexType(
  operationId: string,
  paramName: string,
  type: gen.TypeReference
): gen.TypeReference {
  switch (type.kind) {
    case "InterfaceCombinator":
    case "UnionCombinator": {
      const name = `${pascalCase(operationId)}${pascalCase(paramName)}`;
      const content = prettier.format(printSchema(name, type), {
        parser: "typescript"
      });
      appendFileSync("./out/models.ts", content);
      return gen.identifier(name);
    }
    case "ArrayCombinator": {
      return gen.arrayCombinator(
        extractTypeFromComplexType(operationId, paramName, type.type)
      );
    }
    default:
      return type;
  }
}

function extractParameterType(
  operationId: string,
  param: OpenAPIV3.ParameterObject
): gen.TypeReference {
  const { schema } = param;
  if (schema) {
    const type = parseSchema(schema);
    return extractTypeFromComplexType(operationId, param.name, type);
  }
  // fix me
  return gen.unknownType;
}

function createApiParameter(
  operationId: string,
  param: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject,
  doc: OpenAPIV3.Document
): ApiParameter {
  const resolvedParam =
    "$ref" in param ? getObjectByRef(doc, param.$ref) : param;
  const type =
    "$ref" in param
      ? gen.identifier(getComponentParameterName(resolvedParam.name))
      : extractParameterType(operationId, param);

  return {
    name: resolvedParam.name,
    type,
    in: resolvedParam.in,
    required: resolvedParam.required
  };
}

export function parseApi(
  path: string,
  method: ApiMethod,
  operation: OpenAPIV3.OperationObject,
  doc: OpenAPIV3.Document
): Api {
  const { operationId, parameters, requestBody, responses } = operation;

  let params: ApiParameter[] = [];
  if (parameters && operationId) {
    params = parameters.map(p => createApiParameter(operationId, p, doc));
  }

  return {
    path,
    name: operationId!,
    method,
    params
  };
}
