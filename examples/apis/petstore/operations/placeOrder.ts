import { TaskEither } from "fp-ts/TaskEither";
import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "openapi-io-ts/dist/runtime";
import * as schemas from "../components/schemas";

export const placeOrderOperation: Operation = {
  path: "/store/order",
  method: "post",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.Order },
    "400": { _tag: "EmptyResponse" },
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

export const placeOrder = (requestAdapter: HttpRequestAdapter) => (
  body: schemas.Order
): TaskEither<ApiError, ApiResponse<schemas.Order>> =>
  request(placeOrderOperation, {}, body, requestAdapter);
