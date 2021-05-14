import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export const placeOrderOperation: Operation = {
  path: "/store/order",
  method: "post",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.Order },
    "405": { _tag: "EmptyResponse" },
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

export const placeOrderBuilder = (requestAdapter: HttpRequestAdapter) => (
  body: schemas.Order
): TaskEither<ApiError, ApiResponse<schemas.Order>> =>
  request(placeOrderOperation, {}, body, requestAdapter);
