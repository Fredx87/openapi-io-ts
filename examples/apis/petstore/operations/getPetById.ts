import * as schemas from "../components/schemas";
import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type GetPetByIdRequestParameters = {
  petId: number;
};

export const getPetByIdOperation: Operation = {
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
  requestDefaultHeaders: {},
};

export const getPetById = (requestAdapter: HttpRequestAdapter) => (
  params: GetPetByIdRequestParameters
): TaskEither<ApiError, ApiResponse<schemas.Pet>> =>
  request(getPetByIdOperation, params, undefined, requestAdapter);
