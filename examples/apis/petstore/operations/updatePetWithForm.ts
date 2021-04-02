import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type UpdatePetWithFormRequestParameters = {
  petId: number;
};

export type UpdatePetWithFormRequestBody = string;

export const updatePetWithFormRequestDefinition: RequestDefinition<string> = {
  path: "/pet/{petId}",
  method: "post",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: {
    petId: {
      in: "path",
    },
  },
  bodyType: "text",
};

export const updatePetWithForm = (requestAdapter: HttpRequestAdapter) => (
  params: UpdatePetWithFormRequestParameters,
  body: UpdatePetWithFormRequestBody
): TaskEither<ApiError, string> =>
  request(updatePetWithFormRequestDefinition, params, body, requestAdapter);
