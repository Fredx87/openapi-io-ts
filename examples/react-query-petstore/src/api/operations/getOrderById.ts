import type { RequestFunction } from "@openapi-io-ts/runtime";
import * as schemas from "../components/schemas";

export type GetOrderByIdRequestParameters = {
  orderId: number;
};

export const getOrderByIdOperation = {
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
} as const;

export type GetOrderByIdRequestFunction = RequestFunction<
  { params: GetOrderByIdRequestParameters },
  schemas.Order
>;
