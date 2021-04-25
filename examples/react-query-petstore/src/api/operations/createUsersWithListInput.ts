import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export const createUsersWithListInputOperation: Operation = {
  path: "/user/createWithList",
  method: "post",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.User },
    default: { _tag: "EmptyResponse" },
  },
  parameters: [],
  requestDefaultHeaders: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: {
    _tag: "JsonBody",
  },
};

export const createUsersWithListInput = (
  requestAdapter: HttpRequestAdapter
) => (
  body: Array<schemas.User>
): TaskEither<ApiError, ApiResponse<schemas.User>> =>
  request(createUsersWithListInputOperation, {}, body, requestAdapter);
