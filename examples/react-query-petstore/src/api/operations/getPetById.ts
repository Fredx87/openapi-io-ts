import type { RequestFunction } from "@openapi-io-ts/runtime";
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

export type GetPetByIdRequestFunction = RequestFunction<
  { params: GetPetByIdRequestParameters },
  schemas.Pet
>;
