import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type DeleteUserRequestParameters = {
  username: string;
};

export const deleteUserRequestDefinition: RequestDefinition<string> = {
  path: "/user/{username}",
  method: "delete",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: {
    username: {
      in: "path",
    },
  },
};

export const deleteUser = (requestAdapter: HttpRequestAdapter) => (
  params: DeleteUserRequestParameters
): TaskEither<ApiError, string> =>
  request(deleteUserRequestDefinition, params, undefined, requestAdapter);
