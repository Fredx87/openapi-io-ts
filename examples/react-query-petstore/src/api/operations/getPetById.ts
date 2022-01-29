import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export type GetPetByIdRequestParameters = {
  petId: number;
};

export const getPetByIdOperation = {
  path: "/pet/{petId}",
  method: "get",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.Pet },
    "400": { _tag: "EmptyResponse" },
    "404": { _tag: "EmptyResponse" },
  },
  parameters: [
    {
      _tag: "FormParameter",
      explode: false,
      in: "path",
      name: "petId",
    },
  ],
  requestDefaultHeaders: { Accept: "application/json" },
} as const;

export type GetPetByIdOperationRequestFunction = (args: {
  params: GetPetByIdRequestParameters;
}) => TaskEither<ApiError, ApiResponse<schemas.Pet>>;
