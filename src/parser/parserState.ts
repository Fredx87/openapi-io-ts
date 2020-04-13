import * as O from "fp-ts/lib/Option";
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
  type: gen.TypeReference;
  required: boolean;
}

export type ApiMethod = "get" | "post" | "put" | "delete";

export interface ApiResponse {
  code: string;
  mediaType: string;
  type: gen.TypeReference;
}

export interface Api {
  path: string;
  name: string;
  method: ApiMethod;
  params: ApiParameter[];
  body: O.Option<ApiBody>;
  responses: ApiResponse[];
}

export interface ParserState {
  document: OpenAPIV3.Document;
  models: Record<string, gen.TypeDeclaration>;
  apis: Record<string, Api[]>;
}

const emptyDocument: OpenAPIV3.Document = {
  info: { title: "", version: "" },
  openapi: "3",
  paths: {}
};

export function parserState(): ParserState {
  return {
    document: emptyDocument,
    models: {},
    apis: {}
  };
}
