import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";

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

export interface GeneratedModels {
  namesMap: Record<string, gen.TypeDeclaration>;
  refNameMap: Record<string, string>;
}

export interface ParserContext {
  document: OpenAPIV3.Document;
  generatedModels: GeneratedModels;
  apis: Record<string, Api[]>;
}

const emptyDocument: OpenAPIV3.Document = {
  info: { title: "", version: "" },
  openapi: "3",
  paths: {}
};

export function parserContext(): ParserContext {
  return {
    document: emptyDocument,
    generatedModels: {
      namesMap: {},
      refNameMap: {}
    },
    apis: {}
  };
}
