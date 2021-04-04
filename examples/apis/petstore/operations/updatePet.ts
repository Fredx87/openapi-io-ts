import * as requestBodies from "../components/requestBodies";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export const updatePetRequestDefinition: RequestDefinition<string> = {
  path: "/pet",
  method: "put",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: {},
  bodyType: "json",
};

export const updatePet = (requestAdapter: HttpRequestAdapter) => (
  body: requestBodies.Pet
): TaskEither<ApiError, string> =>
  request(updatePetRequestDefinition, {}, body, requestAdapter);
