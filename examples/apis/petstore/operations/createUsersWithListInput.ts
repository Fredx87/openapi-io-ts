import { TaskEither } from "fp-ts/TaskEither";
import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "openapi-io-ts/dist/runtime";
import * as requestBodies from "../components/requestBodies";
import * as schemas from "../components/schemas";

export const createUsersWithListInputOperation: Operation = {
  path: "/user/createWithList",
  method: "post",
  responses: { default: { _tag: "EmptyResponse" } },
  parameters: [],
  requestDefaultHeaders: { "Content-Type": "application/json" },
  body: requestBodies.UserArray,
};

export const createUsersWithListInput = (
  requestAdapter: HttpRequestAdapter
) => (body: Array<schemas.User>): TaskEither<ApiError, ApiResponse<void>> =>
  request(createUsersWithListInputOperation, {}, body, requestAdapter);
