import * as t from "io-ts";

export interface TextResponse {
  _tag: "TextResponse";
}

export interface JsonResponse<ReturnType> {
  _tag: "JsonResponse";
  decoder: t.Decoder<unknown, ReturnType>;
}
