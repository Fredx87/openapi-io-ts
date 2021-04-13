import * as requestBodies from "../components/requestBodies";
import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export const createUsersWithListInputOperation: Operation = {
  path: "/user/createWithList",
  method: "post",
  responses: { default: { _tag: "EmptyResponse" } },
  parameters: [],
  requestDefaultHeaders: {},
  body: requestBodies.UserArray,
};

export const createUsersWithListInput = (
  requestAdapter: HttpRequestAdapter
) => (
  body: requestBodies.UserArraySchema
): TaskEither<ApiError, ApiResponse<void>> =>
  request(createUsersWithListInputOperation, {}, body, requestAdapter);
