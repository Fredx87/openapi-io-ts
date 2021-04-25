import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type DeletePetRequestParameters = {
  api_key?: string;
  petId: number;
};

export const deletePetOperation: Operation = {
  path: "/pet/{petId}",
  method: "delete",
  responses: { "400": { _tag: "EmptyResponse" } },
  parameters: [
    {
      _tag: "FormParameter",
      explode: false,
      in: "header",
      name: "api_key",
    },
    {
      _tag: "FormParameter",
      explode: false,
      in: "path",
      name: "petId",
    },
  ],
  requestDefaultHeaders: {},
};

export const deletePet = (requestAdapter: HttpRequestAdapter) => (
  params: DeletePetRequestParameters
): TaskEither<ApiError, ApiResponse<void>> =>
  request(deletePetOperation, params, undefined, requestAdapter);
