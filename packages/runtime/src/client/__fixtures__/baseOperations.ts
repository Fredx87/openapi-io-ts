import { Operation } from "../../model";

export const getUserOperationBase: Operation = {
  path: "/users/{username}",
  method: "get",
  responses: {},
  parameters: [],
  requestDefaultHeaders: { Accept: "application/json" },
} as const;
