import * as schemas from "../components/schemas";
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
  requestDefaultHeaders: { "Content-Type": "application/json" },
  body: requestBodies.Pet,
};

export const addPet = (requestAdapter: HttpRequestAdapter) => (
  body: schemas.Pet
): TaskEither<ApiError, ApiResponse<void>> =>
  request(addPetOperation, {}, body, requestAdapter);
