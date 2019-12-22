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

export interface GeneratedModels {
  namesMap: Record<string, gen.TypeDeclaration>;
  refNameMap: Record<string, string>;
}

export interface ParserContext {
  document: OpenAPIV3.Document;
  generatedModels: GeneratedModels;
  apis: Record<string, Api[]>;
  inputFile: string;
  outputDir: string;
}

const emptyDocument: OpenAPIV3.Document = {
  info: { title: "", version: "" },
  openapi: "3",
  paths: {}
};

export function parserContext(
  inputFile: string,
  outputDir: string
): ParserContext {
  return {
    document: emptyDocument,
    generatedModels: {
      namesMap: {},
      refNameMap: {}
    },
    apis: {},
    inputFile,
    outputDir
  };
}
