import * as schemas from "../components/schemas";
import * as parameters from "../components/parameters";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type UpdateUserRequestParameters = {
  username: string;
};

export type UpdateUserRequestBody = schemas.User;

export const updateUserRequestDefinition: RequestDefinition<string> = {
  path: "/user/{username}",
  method: "put",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: { username: parameters.username },
  bodyType: "json",
};

export const updateUser = (requestAdapter: HttpRequestAdapter) => (
  params: UpdateUserRequestParameters,
  body: UpdateUserRequestBody
): TaskEither<ApiError, string> =>
  request(updateUserRequestDefinition, params, body, requestAdapter);
