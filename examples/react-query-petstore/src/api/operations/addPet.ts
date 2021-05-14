import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export const addPetOperation: Operation = {
  path: "/pet",
  method: "post",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.Pet },
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

export const addPetBuilder = (requestAdapter: HttpRequestAdapter) => (
  body: schemas.Pet
): TaskEither<ApiError, ApiResponse<schemas.Pet>> =>
  request(addPetOperation, {}, body, requestAdapter);
