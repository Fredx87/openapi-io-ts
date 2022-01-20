import type { OperationTypes } from "@openapi-io-ts/runtime";
import * as schemas from "../components/schemas";

export const placeOrderOperation = {
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
} as const;

export type PlaceOrderOperationTypes = OperationTypes<
  undefined,
  schemas.Order,
  schemas.Order
>;
