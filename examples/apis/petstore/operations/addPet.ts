import * as requestBodies from "../components/requestBodies";
import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export const addPetOperation: Operation = {
  path: "/pet",
  method: "post",
  responses: { "405": { _tag: "EmptyResponse" } },
  parameters: [],
  requestDefaultHeaders: {},
  body: requestBodies.Pet,
};

export const addPet = (requestAdapter: HttpRequestAdapter) => (
  body: requestBodies.PetSchema
): TaskEither<ApiError, ApiResponse<void>> =>
  request(addPetOperation, {}, body, requestAdapter);
