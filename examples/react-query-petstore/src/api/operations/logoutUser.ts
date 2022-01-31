import type { RequestFunction } from "@openapi-io-ts/runtime";

export const logoutUserOperation = {
  path: "/user/logout",
  method: "get",
  responses: { default: { _tag: "EmptyResponse" } },
  parameters: [],
  requestDefaultHeaders: {},
} as const;

export type LogoutUserRequestFunction = RequestFunction<undefined, void>;
