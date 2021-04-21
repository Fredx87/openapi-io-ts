import * as t from "io-ts";

export interface RequestError {
  _tag: "RequestError";
  error: Error;
}

export function requestError(error: Error): RequestError {
  return {
    _tag: "RequestError",
    error,
  };
}

export interface HttpError {
  _tag: "HttpError";
  response: Response;
}

export function httpError(response: Response): HttpError {
  return {
    _tag: "HttpError",
    response,
  };
}

export interface DecodeError {
  _tag: "DecodeError";
  errors: t.Errors;
}

export function decodeError(errors: t.Errors): DecodeError {
  return {
    _tag: "DecodeError",
    errors,
  };
}

export interface ContentParseError {
  _tag: "ContentParseError";
  error: Error;
}

export function contentParseError(error: Error): ContentParseError {
  return {
    _tag: "ContentParseError",
    error,
  };
}

export type ApiError =
  | RequestError
  | HttpError
  | DecodeError
  | ContentParseError;
