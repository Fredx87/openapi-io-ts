import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export const addPetOperation = {
  path: "/pet",
  method: "post",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.Pet },
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

export type AddPetOperationRequestFunction = (args: {
  body: schemas.Pet;
}) => TaskEither<ApiError, ApiResponse<schemas.Pet>>;
