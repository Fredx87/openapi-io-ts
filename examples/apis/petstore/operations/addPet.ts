import * as schemas from "../components/schemas";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type AddPetRequestBody = schemas.Pet;

export const addPetRequestDefinition: RequestDefinition<string> = {
  path: "/pet",
  method: "post",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: {},
  bodyType: "json",
};

export const addPet = (requestAdapter: HttpRequestAdapter) => (
  body: AddPetRequestBody
): TaskEither<ApiError, string> =>
  request(addPetRequestDefinition, {}, body, requestAdapter);
