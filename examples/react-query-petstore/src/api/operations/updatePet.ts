import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export const updatePetOperation = {
  path: "/pet",
  method: "put",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.Pet },
    "400": { _tag: "EmptyResponse" },
    "404": { _tag: "EmptyResponse" },
    "405": { _tag: "EmptyResponse" },
  },
  parameters: [],
  requestDefaultHeaders: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: {
    _tag: "JsonBody",
  },
} as const;

export type UpdatePetOperationRequestFunction = (args: {
  body: schemas.Pet;
}) => TaskEither<ApiError, ApiResponse<schemas.Pet>>;
