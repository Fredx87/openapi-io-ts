import * as schemas from "../components/schemas";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type GetOrderByIdRequestParameters = {
  orderId: number;
};

export const getOrderByIdRequestDefinition: RequestDefinition<schemas.Order> = {
  path: "/store/order/{orderId}",
  method: "get",
  successfulResponse: { _tag: "JsonResponse", decoder: schemas.Order },
  parametersDefinitions: {
    orderId: {
      in: "path",
    },
  },
};

export const getOrderById = (requestAdapter: HttpRequestAdapter) => (
  params: GetOrderByIdRequestParameters
): TaskEither<ApiError, schemas.Order> =>
  request(getOrderByIdRequestDefinition, params, undefined, requestAdapter);
