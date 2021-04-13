import * as schemas from "../components/schemas";
import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type CreateUserRequestBodySchema = schemas.User;

export const createUserOperation: Operation = {
  path: "/user",
  method: "post",
  responses: { default: { _tag: "EmptyResponse" } },
  parameters: [],
  requestDefaultHeaders: { "Content-Type": "application/json" },
  body: {
    _tag: "JsonBody",
  },
};

export const createUser = (requestAdapter: HttpRequestAdapter) => (
  body: CreateUserRequestBodySchema
): TaskEither<ApiError, ApiResponse<void>> =>
  request(createUserOperation, {}, body, requestAdapter);
