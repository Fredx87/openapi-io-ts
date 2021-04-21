import { Decoder } from "io-ts";

export interface EmptyResponse {
  _tag: "EmptyResponse";
}

export interface FileResponse {
  _tag: "FileResponse";
}

export interface JsonResponse {
  _tag: "JsonResponse";
  decoder: Decoder<unknown, unknown>;
}

export type OperationResponse = EmptyResponse | FileResponse | JsonResponse;

export type OperationResponses = Record<string, OperationResponse>;
