import * as gen from "io-ts-codegen";

export interface ParsedEmptyResponse {
  _tag: "ParsedEmptyResponse";
}

export interface ParsedFileResponse {
  _tag: "ParsedFileResponse";
}

export interface ParsedJsonResponse {
  _tag: "ParsedJsonResponse";
  type: gen.TypeDeclaration | gen.TypeReference;
}

export type ParsedResponse =
  | ParsedEmptyResponse
  | ParsedFileResponse
  | ParsedJsonResponse;
