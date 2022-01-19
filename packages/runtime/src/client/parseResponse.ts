import { OperationResponse, OperationResponses } from "../model";
import {
  ApiError,
  decodeError,
  DecodeError,
  httpError,
  contentParseError,
  ContentParseError,
} from "./apiError";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as t from "io-ts";
import { ApiResponse } from "./apiResponse";

export function parseResponse<ReturnType>(
  response: Response,
  responses: OperationResponses
): TE.TaskEither<ApiError, ApiResponse<ReturnType>> {
  if (response.ok) {
    return parseSuccessfulResponse(response, responses);
  }

  return parseFailedResponse(response);
}

function parseSuccessfulResponse<ReturnType>(
  response: Response,
  responses: OperationResponses
): TE.TaskEither<ApiError, ApiResponse<ReturnType>> {
  const operationResponse = getOperationResponseByCode(
    response.status,
    responses
  );

  if (operationResponse == null) {
    return TE.right({ data: undefined as unknown as ReturnType, response });
  }

  switch (operationResponse._tag) {
    case "EmptyResponse": {
      return TE.right({ data: undefined as unknown as ReturnType, response });
    }
    case "FileResponse": {
      return parseBlobResponse(response);
    }
    case "JsonResponse": {
      const decoder = operationResponse.decoder as t.Decoder<
        unknown,
        ReturnType
      >;
      return parseJsonResponse(response, decoder);
    }
  }
}

function parseFailedResponse(
  response: Response
): TE.TaskEither<ApiError, never> {
  return TE.left(httpError(response));
}

function getOperationResponseByCode(
  code: number,
  responses: OperationResponses
): OperationResponse | undefined {
  const exactResponse = responses[code.toString()];
  if (exactResponse != null) {
    return exactResponse;
  }

  const rangeResponse = responses[`${code.toString()[0]}XX`];
  if (rangeResponse != null) {
    return rangeResponse;
  }

  const defaultResponse = responses["default"];
  if (defaultResponse != null) {
    return defaultResponse;
  }

  return undefined;
}

function parseJsonResponse<ReturnType>(
  response: Response,
  decoder: t.Decoder<unknown, ReturnType>
): TE.TaskEither<DecodeError | ContentParseError, ApiResponse<ReturnType>> {
  return pipe(
    parseJson(response),
    TE.chainW((json) =>
      pipe(decoder.decode(json), TE.fromEither, TE.mapLeft(decodeError))
    ),
    TE.map((data) => ({
      data,
      response,
    }))
  );
}

function parseJson(
  response: Response
): TE.TaskEither<ContentParseError, unknown> {
  return TE.tryCatch(
    () => response.json(),
    (e) => contentParseError(E.toError(e))
  );
}

function parseBlobResponse<ReturnType>(
  response: Response
): TE.TaskEither<ContentParseError, ApiResponse<ReturnType>> {
  return pipe(
    TE.tryCatch(
      () => response.blob(),
      (e) => contentParseError(E.toError(e))
    ),
    TE.map((blob) => ({
      data: blob as unknown as ReturnType,
      response,
    }))
  );
}
