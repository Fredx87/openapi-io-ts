import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";
import * as t from "io-ts";
import * as schemas from "../components/schemas";

export type FindPetsByTagsRequestParameters = {
  tags?: Array<string>;
};

export const findPetsByTagsOperation = {
  path: "/pet/findByTags",
  method: "get",
  responses: {
    "200": { _tag: "JsonResponse", decoder: t.array(schemas.Pet) },
    "400": { _tag: "EmptyResponse" },
  },
  parameters: [
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "tags",
    },
  ],
  requestDefaultHeaders: { Accept: "application/json" },
} as const;

export type FindPetsByTagsOperationRequestFunction = (args: {
  params: FindPetsByTagsRequestParameters;
}) => TaskEither<ApiError, ApiResponse<Array<schemas.Pet>>>;
