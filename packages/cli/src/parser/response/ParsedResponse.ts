import { ParsedItemSchema } from "../parsedItem";

export interface ParsedEmptyResponse {
  _tag: "ParsedEmptyResponse";
}

export interface ParsedFileResponse {
  _tag: "ParsedFileResponse";
}

export interface ParsedJsonResponse {
  _tag: "ParsedJsonResponse";
  schema: ParsedItemSchema;
}

export type ParsedResponse =
  | ParsedEmptyResponse
  | ParsedFileResponse
  | ParsedJsonResponse;
