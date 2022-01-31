import type { RequestFunction } from "@openapi-io-ts/runtime";
import * as t from "io-ts";

export const getInventoryOperation = {
  path: "/store/inventory",
  method: "get",
  responses: { "200": { _tag: "JsonResponse", decoder: t.UnknownRecord } },
  parameters: [],
  requestDefaultHeaders: { Accept: "application/json" },
} as const;

export type GetInventoryRequestFunction = RequestFunction<
  undefined,
  Record<string, unknown>
>;
