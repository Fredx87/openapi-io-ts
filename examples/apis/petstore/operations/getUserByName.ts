import { TaskEither } from "fp-ts/TaskEither";
import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "openapi-io-ts/dist/runtime";
import * as parameters from "../components/parameters";
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
  parameters: [parameters.username],
  requestDefaultHeaders: { Accept: "application/json" },
};

export const getUserByName = (requestAdapter: HttpRequestAdapter) => (
  params: GetUserByNameRequestParameters
): TaskEither<ApiError, ApiResponse<schemas.User>> =>
  request(getUserByNameOperation, params, undefined, requestAdapter);
