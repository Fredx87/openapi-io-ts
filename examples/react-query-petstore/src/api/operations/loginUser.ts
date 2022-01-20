import type { OperationTypes } from "@openapi-io-ts/runtime";
import * as t from "io-ts";

export type LoginUserRequestParameters = {
  username?: string;
  password?: string;
};

export const loginUserOperation = {
  path: "/user/login",
  method: "get",
  responses: {
    "200": { _tag: "JsonResponse", decoder: t.string },
    "400": { _tag: "EmptyResponse" },
  },
  parameters: [
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "username",
    },
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "password",
    },
  ],
  requestDefaultHeaders: { Accept: "application/json" },
} as const;

export type LoginUserOperationTypes = OperationTypes<
  LoginUserRequestParameters,
  undefined,
  string
>;
