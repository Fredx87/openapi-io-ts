import * as schemas from "../components/schemas";
import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type PlaceOrderRequestBodySchema = schemas.Order;

export const placeOrderOperation: Operation = {
  path: "/store/order",
  method: "post",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.Order },
    "400": { _tag: "EmptyResponse" },
  },
  parameters: [],
  requestDefaultHeaders: {},
  body: {
    _tag: "JsonBody",
  },
};

export const placeOrder = (requestAdapter: HttpRequestAdapter) => (
  body: PlaceOrderRequestBodySchema
): TaskEither<ApiError, ApiResponse<schemas.Order>> =>
  request(placeOrderOperation, {}, body, requestAdapter);
