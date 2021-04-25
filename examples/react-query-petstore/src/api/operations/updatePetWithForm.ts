import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type UpdatePetWithFormRequestParameters = {
  petId: number;
  name?: string;
  status?: string;
};

export const updatePetWithFormOperation: Operation = {
  path: "/pet/{petId}",
  method: "post",
  responses: { "405": { _tag: "EmptyResponse" } },
  parameters: [
    {
      _tag: "FormParameter",
      explode: false,
      in: "path",
      name: "petId",
    },
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "name",
    },
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "status",
    },
  ],
  requestDefaultHeaders: {},
};

export const updatePetWithForm = (requestAdapter: HttpRequestAdapter) => (
  params: UpdatePetWithFormRequestParameters
): TaskEither<ApiError, ApiResponse<void>> =>
  request(updatePetWithFormOperation, params, undefined, requestAdapter);
