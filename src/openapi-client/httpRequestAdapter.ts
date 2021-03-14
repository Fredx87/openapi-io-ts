export type RequestMethod = "get" | "post" | "put" | "delete";

export interface HttpRequestArgs {
  url: string;
  method: RequestMethod;
  body?: unknown;
  headers: Record<string, string>;
}

export interface HttpResponse {
  code: number;
  data: string;
}

export type HttpRequestAdapter = (
  args: HttpRequestArgs
) => Promise<HttpResponse>;
