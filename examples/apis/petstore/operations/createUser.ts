import { TaskEither } from "fp-ts/TaskEither";
import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "openapi-io-ts/dist/runtime";
import * as schemas from "../components/schemas";

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
  body: schemas.User
): TaskEither<ApiError, ApiResponse<void>> =>
  request(createUserOperation, {}, body, requestAdapter);
