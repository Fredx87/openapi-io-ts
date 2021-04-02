import * as schemas from "../components/schemas";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type UpdatePetRequestBody = schemas.Pet;

export const updatePetRequestDefinition: RequestDefinition<string> = {
  path: "/pet",
  method: "put",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: {},
  bodyType: "json",
};

export const updatePet = (requestAdapter: HttpRequestAdapter) => (
  body: UpdatePetRequestBody
): TaskEither<ApiError, string> =>
  request(updatePetRequestDefinition, {}, body, requestAdapter);
