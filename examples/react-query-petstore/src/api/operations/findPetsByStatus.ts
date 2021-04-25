import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
import * as t from "io-ts";
import * as schemas from "../components/schemas";

export type FindPetsByStatusRequestParameters = {
  status?: "available" | "pending" | "sold";
};

export const findPetsByStatusOperation: Operation = {
  path: "/pet/findByStatus",
  method: "get",
  responses: {
    "200": { _tag: "JsonResponse", decoder: t.array(schemas.Pet) },
    "400": { _tag: "EmptyResponse" },
  },
  parameters: [
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "status",
    },
  ],
  requestDefaultHeaders: { Accept: "application/json" },
};

export const findPetsByStatus = (requestAdapter: HttpRequestAdapter) => (
  params: FindPetsByStatusRequestParameters
): TaskEither<ApiError, ApiResponse<Array<schemas.Pet>>> =>
  request(findPetsByStatusOperation, params, undefined, requestAdapter);
