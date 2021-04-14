import * as schemas from "../components/schemas";
import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type UpdatePetWithFormRequestParameters = {
  petId: number;
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
  ],
  requestDefaultHeaders: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: {
    _tag: "FormBody",
  },
};

export const updatePetWithForm = (requestAdapter: HttpRequestAdapter) => (
  params: UpdatePetWithFormRequestParameters,
  body: schemas.Body
): TaskEither<ApiError, ApiResponse<void>> =>
  request(updatePetWithFormOperation, params, body, requestAdapter);
