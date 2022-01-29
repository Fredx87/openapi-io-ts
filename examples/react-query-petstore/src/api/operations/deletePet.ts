import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";

export type DeletePetRequestParameters = {
  api_key?: string;
  petId: number;
};

export const deletePetOperation = {
  path: "/pet/{petId}",
  method: "delete",
  responses: { "400": { _tag: "EmptyResponse" } },
  parameters: [
    {
      _tag: "FormParameter",
      explode: false,
      in: "header",
      name: "api_key",
    },
    {
      _tag: "FormParameter",
      explode: false,
      in: "path",
      name: "petId",
    },
  ],
  requestDefaultHeaders: {},
} as const;

export type DeletePetOperationRequestFunction = (args: {
  params: DeletePetRequestParameters;
}) => TaskEither<ApiError, ApiResponse<void>>;
