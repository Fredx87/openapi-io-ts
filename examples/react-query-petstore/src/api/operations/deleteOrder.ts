import type { RequestFunction } from "@openapi-io-ts/runtime";

export type DeleteOrderRequestParameters = {
  orderId: number;
};

export const deleteOrderOperation = {
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
} as const;

export type DeleteOrderRequestFunction = RequestFunction<
  { params: DeleteOrderRequestParameters },
  void
>;
