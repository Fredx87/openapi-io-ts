import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";
import * as t from "io-ts";
import * as schemas from "../components/schemas";

export type FindPetsByStatusRequestParameters = {
  status?: "available" | "pending" | "sold";
};

export const findPetsByStatusOperation = {
  path: "/pet/findByStatus",
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
      name: "status",
    },
  ],
  requestDefaultHeaders: { Accept: "application/json" },
} as const;

export type FindPetsByStatusOperationRequestFunction = (args: {
  params: FindPetsByStatusRequestParameters;
}) => TaskEither<ApiError, ApiResponse<Array<schemas.Pet>>>;
