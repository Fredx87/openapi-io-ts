import type { OperationTypes } from "@openapi-io-ts/runtime";

export type DeleteUserRequestParameters = {
  username: string;
};

export const deleteUserOperation = {
  path: "/user/{username}",
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
      name: "username",
    },
  ],
  requestDefaultHeaders: {},
} as const;

export type DeleteUserOperationTypes = OperationTypes<
  DeleteUserRequestParameters,
  undefined,
  void
>;
