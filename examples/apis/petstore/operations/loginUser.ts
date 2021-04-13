import * as t from "io-ts";
import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type LoginUserRequestParameters = {
  username: string;
  password: string;
};

export const loginUserOperation: Operation = {
  path: "/user/login",
  method: "get",
  responses: {
    "200": { _tag: "JsonResponse", decoder: t.string },
    "400": { _tag: "EmptyResponse" },
  },
  parameters: [
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "username",
    },
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "password",
    },
  ],
  requestDefaultHeaders: { Accept: "application/json" },
};

export const loginUser = (requestAdapter: HttpRequestAdapter) => (
  params: LoginUserRequestParameters
): TaskEither<ApiError, ApiResponse<string>> =>
  request(loginUserOperation, params, undefined, requestAdapter);
