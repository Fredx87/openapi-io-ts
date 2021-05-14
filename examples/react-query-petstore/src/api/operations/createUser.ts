import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export const createUserOperation: Operation = {
  path: "/user",
  method: "post",
  responses: { default: { _tag: "JsonResponse", decoder: schemas.User } },
  parameters: [],
  requestDefaultHeaders: { "Content-Type": "application/json" },
  body: {
    _tag: "JsonBody",
  },
};

export const createUserBuilder = (requestAdapter: HttpRequestAdapter) => (
  body: schemas.User
): TaskEither<ApiError, ApiResponse<void>> =>
  request(createUserOperation, {}, body, requestAdapter);
