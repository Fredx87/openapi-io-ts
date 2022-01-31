import type { RequestFunction } from "@openapi-io-ts/runtime";
import * as schemas from "../components/schemas";

export type UpdateUserRequestParameters = {
  username: string;
};

export const updateUserOperation = {
  path: "/user/{username}",
  method: "put",
  responses: { default: { _tag: "EmptyResponse" } },
  parameters: [
    {
      _tag: "FormParameter",
      explode: false,
      in: "path",
      name: "username",
    },
  ],
  requestDefaultHeaders: { "Content-Type": "application/json" },
  body: {
    _tag: "JsonBody",
  },
} as const;

export type UpdateUserRequestFunction = RequestFunction<
  { params: UpdateUserRequestParameters; body: schemas.User },
  void
>;
