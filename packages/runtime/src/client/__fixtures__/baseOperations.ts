import { Operation } from "../../model";

export const getArticlesOperationBase: Operation = {
  path: "/getArticles",
  method: "get",
  responses: {},
  parameters: [],
  requestDefaultHeaders: {},
} as const;

export const getUserOperationBase: Operation = {
  path: "/users/{username}",
  method: "get",
  responses: {},
  parameters: [
    {
      _tag: "FormParameter",
      explode: false,
      in: "path",
      name: "username",
    },
  ],
  requestDefaultHeaders: { Accept: "application/json" },
} as const;
