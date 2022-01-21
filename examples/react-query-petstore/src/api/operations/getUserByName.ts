import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export type GetUserByNameRequestParameters = {
  username: string;
};

export const getUserByNameOperation: Operation = {
  path: "/user/{username}",
  method: "get",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.User },
    "400": { _tag: "EmptyResponse" },
    "404": { _tag: "EmptyResponse" },
  },
  parameters: [
    {
      _tag: "FormParameter",
      explode: false,
      in: "path",
      name: "username",
    },
  ],
  requestDefaultHeaders: { Accept: "application/json" },
};

export const getUserByNameBuilder =
  (requestAdapter: HttpRequestAdapter) =>
  (
    params: GetUserByNameRequestParameters
  ): TaskEither<ApiError, ApiResponse<schemas.User>> =>
    request(getUserByNameOperation, params, undefined, requestAdapter);
