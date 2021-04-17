import { TaskEither } from "fp-ts/TaskEither";
import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "openapi-io-ts/dist/runtime";
import * as requestBodies from "../components/requestBodies";
import * as schemas from "../components/schemas";

export const updatePetOperation: Operation = {
  path: "/pet",
  method: "put",
  responses: {
    "400": { _tag: "EmptyResponse" },
    "404": { _tag: "EmptyResponse" },
    "405": { _tag: "EmptyResponse" },
  },
  parameters: [],
  requestDefaultHeaders: { "Content-Type": "application/json" },
  body: requestBodies.Pet,
};

export const updatePet = (requestAdapter: HttpRequestAdapter) => (
  body: schemas.Pet
): TaskEither<ApiError, ApiResponse<void>> =>
  request(updatePetOperation, {}, body, requestAdapter);
