import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";

export type UpdatePetWithFormRequestParameters = {
  petId: number;
  name?: string;
  status?: string;
};

export const updatePetWithFormOperation = {
  path: "/pet/{petId}",
  method: "post",
  responses: { "405": { _tag: "EmptyResponse" } },
  parameters: [
    {
      _tag: "FormParameter",
      explode: false,
      in: "path",
      name: "petId",
    },
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "name",
    },
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "status",
    },
  ],
  requestDefaultHeaders: {},
} as const;

export type UpdatePetWithFormOperationRequestFunction = (args: {
  params: UpdatePetWithFormRequestParameters;
}) => TaskEither<ApiError, ApiResponse<void>>;
