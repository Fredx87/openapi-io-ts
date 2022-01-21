import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export type GetOrderByIdRequestParameters = {
  orderId: number;
};

export const getOrderByIdOperation: Operation = {
  path: "/store/order/{orderId}",
  method: "get",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.Order },
    "400": { _tag: "EmptyResponse" },
    "404": { _tag: "EmptyResponse" },
  },
  parameters: [
    {
      _tag: "FormParameter",
      explode: false,
      in: "path",
      name: "orderId",
    },
  ],
  requestDefaultHeaders: { Accept: "application/json" },
};

export const getOrderByIdBuilder =
  (requestAdapter: HttpRequestAdapter) =>
  (
    params: GetOrderByIdRequestParameters
  ): TaskEither<ApiError, ApiResponse<schemas.Order>> =>
    request(getOrderByIdOperation, params, undefined, requestAdapter);
