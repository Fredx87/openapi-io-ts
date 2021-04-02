import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type DeleteOrderRequestParameters = {
  orderId: number;
};

export const deleteOrderRequestDefinition: RequestDefinition<string> = {
  path: "/store/order/{orderId}",
  method: "delete",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: {
    orderId: {
      in: "path",
    },
  },
};

export const deleteOrder = (requestAdapter: HttpRequestAdapter) => (
  params: DeleteOrderRequestParameters
): TaskEither<ApiError, string> =>
  request(deleteOrderRequestDefinition, params, undefined, requestAdapter);
