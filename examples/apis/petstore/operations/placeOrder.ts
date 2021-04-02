import * as schemas from "../components/schemas";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type PlaceOrderRequestBody = schemas.Order;

export const placeOrderRequestDefinition: RequestDefinition<schemas.Order> = {
  path: "/store/order",
  method: "post",
  successfulResponse: { _tag: "JsonResponse", decoder: schemas.Order },
  parametersDefinitions: {},
  bodyType: "json",
};

export const placeOrder = (requestAdapter: HttpRequestAdapter) => (
  body: PlaceOrderRequestBody
): TaskEither<ApiError, schemas.Order> =>
  request(placeOrderRequestDefinition, {}, body, requestAdapter);
