import type { RequestFunction } from "@openapi-io-ts/runtime";
import * as schemas from "../components/schemas";

export const createUserOperation = {
  path: "/user",
  method: "post",
  responses: { default: { _tag: "JsonResponse", decoder: schemas.User } },
  parameters: [],
  requestDefaultHeaders: { "Content-Type": "application/json" },
  body: {
    _tag: "JsonBody",
  },
} as const;

export type CreateUserRequestFunction = RequestFunction<
  { body: schemas.User },
  void
>;
