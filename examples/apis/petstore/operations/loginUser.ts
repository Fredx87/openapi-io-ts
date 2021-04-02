import * as t from "io-ts";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type LoginUserRequestParameters = {
  username: string;
  password: string;
};

export const loginUserRequestDefinition: RequestDefinition<string> = {
  path: "/user/login",
  method: "get",
  successfulResponse: { _tag: "JsonResponse", decoder: t.string },
  parametersDefinitions: {
    username: {
      in: "query",
    },
    password: {
      in: "query",
    },
  },
};

export const loginUser = (requestAdapter: HttpRequestAdapter) => (
  params: LoginUserRequestParameters
): TaskEither<ApiError, string> =>
  request(loginUserRequestDefinition, params, undefined, requestAdapter);
