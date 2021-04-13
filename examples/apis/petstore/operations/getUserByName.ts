import * as schemas from "../components/schemas";
import * as parameters from "../components/parameters";
import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

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
  requestDefaultHeaders: {},
};

export const getUserByName = (requestAdapter: HttpRequestAdapter) => (
  params: GetUserByNameRequestParameters
): TaskEither<ApiError, ApiResponse<schemas.User>> =>
  request(getUserByNameOperation, params, undefined, requestAdapter);
