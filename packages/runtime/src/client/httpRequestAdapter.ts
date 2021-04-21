export type HttpRequestAdapter = (
  url: string,
  req: RequestInit
) => Promise<Response>;
