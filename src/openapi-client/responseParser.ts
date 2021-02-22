import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as t from "io-ts";
import { HttpResponse } from "./httpRequestHandler";
import { DecoderError, HttpError, JsonParseError } from "./request";

export function parseResponse<ReturnType>(
  response: HttpResponse,
  decoder?: t.Decoder<unknown, ReturnType>
): E.Either<HttpError | DecoderError | JsonParseError, ReturnType> {
  if (response.code >= 200 && response.code < 300) {
    if (decoder) {
      return parseSuccessfulResponse(response.data, decoder);
    } else {
      return parseJson(response.data) as E.Either<
        HttpError | DecoderError | JsonParseError,
        ReturnType
      >;
    }
  }

  return E.left(parseFailedResponse(response));
}

function parseSuccessfulResponse<ReturnType>(
  data: string,
  decoder: t.Decoder<unknown, ReturnType>
): E.Either<DecoderError | JsonParseError, ReturnType> {
  return pipe(
    parseJson(data),
    E.chainW((parsed) =>
      pipe(
        decoder.decode(parsed),
        E.mapLeft((errors): DecoderError => ({ type: "DecoderError", errors }))
      )
    )
  );
}

function parseJson(data: string): E.Either<JsonParseError, unknown> {
  return E.parseJSON(
    data,
    (e): JsonParseError => ({ type: "JsonParseError", error: E.toError(e) })
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
