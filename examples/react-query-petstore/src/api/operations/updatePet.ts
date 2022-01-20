import type { OperationTypes } from "@openapi-io-ts/runtime";
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

export type UpdatePetOperationTypes = OperationTypes<
  undefined,
  schemas.Pet,
  schemas.Pet
>;
