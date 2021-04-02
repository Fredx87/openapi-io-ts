import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type DeletePetRequestParameters = {
  api_key: string | undefined;
  petId: number;
};

export const deletePetRequestDefinition: RequestDefinition<string> = {
  path: "/pet/{petId}",
  method: "delete",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: {
    api_key: {
      in: "header",
    },
    petId: {
      in: "path",
    },
  },
};

export const deletePet = (requestAdapter: HttpRequestAdapter) => (
  params: DeletePetRequestParameters
): TaskEither<ApiError, string> =>
  request(deletePetRequestDefinition, params, undefined, requestAdapter);
