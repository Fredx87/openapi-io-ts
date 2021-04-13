import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
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

export const deleteOrder = (requestAdapter: HttpRequestAdapter) => (
  params: DeleteOrderRequestParameters
): TaskEither<ApiError, ApiResponse<void>> =>
  request(deleteOrderOperation, params, undefined, requestAdapter);
