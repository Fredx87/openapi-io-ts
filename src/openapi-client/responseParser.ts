import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as t from "io-ts";
import { HttpResponse } from "./httpRequestHandler";
import { DecoderError, HttpError, JsonParseError } from "./request";

export function parseResponse<ReturnType>(
  response: HttpResponse,
  decoder: t.Decoder<unknown, ReturnType>
): E.Either<HttpError | DecoderError | JsonParseError, ReturnType> {
  if (response.code >= 200 && response.code < 300) {
    return parseSuccessfulResponse(response, decoder);
  }

  return E.left(parseFailedResponse(response));
}

function parseSuccessfulResponse<ReturnType>(
  response: HttpResponse,
  decoder: t.Decoder<unknown, ReturnType>
): E.Either<DecoderError | JsonParseError, ReturnType> {
  return pipe(
    E.parseJSON(
      response.data,
      (e): JsonParseError => ({ type: "JsonParseError", error: E.toError(e) })
    ),
    E.chainW((parsed) =>
      pipe(
        decoder.decode(parsed),
        E.mapLeft((errors): DecoderError => ({ type: "DecoderError", errors }))
      )
    )
  );
}

function parseFailedResponse(response: HttpResponse): HttpError {
  const { code, data } = response;
  return {
    type: "HttpError",
    code,
    data,
  };
}
