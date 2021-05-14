import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type DeleteOrderRequestParameters = {
  orderId: number;
};

export const deleteOrderOperation: Operation = {
  path: "/store/order/{orderId}",
  method: "delete",
  responses: {
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
  requestDefaultHeaders: {},
};

export const deleteOrderBuilder = (requestAdapter: HttpRequestAdapter) => (
  params: DeleteOrderRequestParameters
): TaskEither<ApiError, ApiResponse<void>> =>
  request(deleteOrderOperation, params, undefined, requestAdapter);
