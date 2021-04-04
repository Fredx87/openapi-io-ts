import * as requestBodies from "../components/requestBodies";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export const addPetRequestDefinition: RequestDefinition<string> = {
  path: "/pet",
  method: "post",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: {},
  bodyType: "json",
};

export const addPet = (requestAdapter: HttpRequestAdapter) => (
  body: requestBodies.Pet
): TaskEither<ApiError, string> =>
  request(addPetRequestDefinition, {}, body, requestAdapter);
