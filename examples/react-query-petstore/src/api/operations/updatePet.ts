import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export const updatePetOperation: Operation = {
  path: "/pet",
  method: "put",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.Pet },
    "400": { _tag: "EmptyResponse" },
    "404": { _tag: "EmptyResponse" },
    "405": { _tag: "EmptyResponse" },
  },
  parameters: [],
  requestDefaultHeaders: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: {
    _tag: "JsonBody",
  },
};

export const updatePet = (requestAdapter: HttpRequestAdapter) => (
  body: schemas.Pet
): TaskEither<ApiError, ApiResponse<schemas.Pet>> =>
  request(updatePetOperation, {}, body, requestAdapter);
