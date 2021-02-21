import * as t from "io-ts";

export type RequestParams = Record<string, unknown>;

export interface ApiParam {
  in: "query" | "header" | "path" | "cookie";
  defaultValue?: unknown;
}

export type ApiParams = Record<string, ApiParam>;

export interface ApiDefinition<ReturnType> {
  path: string;
  method: "get" | "post" | "put" | "delete";
  params: ApiParams;
  responseDecoder: t.Decoder<unknown, ReturnType>;
}
