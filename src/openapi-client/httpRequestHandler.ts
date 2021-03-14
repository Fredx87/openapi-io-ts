import { ApiMethod } from "../parser/parserOutput";

export interface HttpRequestArgs {
  url: string;
  method: ApiMethod;
  body?: unknown;
}

export interface HttpResponse {
  code: number;
  data: string;
}

export type HttpRequestHandler = (
  args: HttpRequestArgs
) => Promise<HttpResponse>;
