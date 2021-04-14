import * as schemas from "../components/schemas";
import * as requestBodies from "../components/requestBodies";
import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export const createUsersWithArrayInputOperation: Operation = {
  path: "/user/createWithArray",
  method: "post",
  responses: { default: { _tag: "EmptyResponse" } },
  parameters: [],
  requestDefaultHeaders: { "Content-Type": "application/json" },
  body: requestBodies.UserArray,
};

export const createUsersWithArrayInput = (
  requestAdapter: HttpRequestAdapter
) => (body: Array<schemas.User>): TaskEither<ApiError, ApiResponse<void>> =>
  request(createUsersWithArrayInputOperation, {}, body, requestAdapter);
