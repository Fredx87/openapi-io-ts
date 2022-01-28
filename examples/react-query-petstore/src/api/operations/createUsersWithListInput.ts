import type { OperationTypes } from "@openapi-io-ts/runtime";
import * as schemas from "../components/schemas";

export const createUsersWithListInputOperation = {
  path: "/user/createWithList",
  method: "post",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.User },
    default: { _tag: "EmptyResponse" },
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

export type CreateUsersWithListInputOperationTypes = OperationTypes<
  undefined,
  Array<schemas.User>,
  schemas.User
>;
