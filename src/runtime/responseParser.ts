import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as t from "io-ts";
import { HttpResponse } from "./httpRequestAdapter";
import { DecoderError, HttpError, JsonParseError } from "./request";
import { JsonResponse, TextResponse } from "./response";

export function parseResponse<ReturnType>(
  response: HttpResponse,
  responseDefinition?: TextResponse | JsonResponse<ReturnType>
): E.Either<HttpError | DecoderError | JsonParseError, ReturnType> {
  if (response.code >= 200 && response.code < 300) {
    if (responseDefinition?._tag === "JsonResponse") {
      return parseSuccessfulResponse(response.data, responseDefinition.decoder);
    } else {
      return E.right((response.data as unknown) as ReturnType);
    }
  }

  return E.left(parseFailedResponse(response));
}

function parseSuccessfulResponse<ReturnType = string>(
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
