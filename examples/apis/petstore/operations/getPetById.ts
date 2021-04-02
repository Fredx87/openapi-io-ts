import * as schemas from "../components/schemas";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type GetPetByIdRequestParameters = {
  petId: number;
};

export const getPetByIdRequestDefinition: RequestDefinition<schemas.Pet> = {
  path: "/pet/{petId}",
  method: "get",
  successfulResponse: { _tag: "JsonResponse", decoder: schemas.Pet },
  parametersDefinitions: {
    petId: {
      in: "path",
    },
  },
};

export const getPetById = (requestAdapter: HttpRequestAdapter) => (
  params: GetPetByIdRequestParameters
): TaskEither<ApiError, schemas.Pet> =>
  request(getPetByIdRequestDefinition, params, undefined, requestAdapter);
