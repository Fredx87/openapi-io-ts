import * as schemas from "../components/schemas";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type CreateUserRequestBody = schemas.User;

export const createUserRequestDefinition: RequestDefinition<string> = {
  path: "/user",
  method: "post",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: {},
  bodyType: "json",
};

export const createUser = (requestAdapter: HttpRequestAdapter) => (
  body: CreateUserRequestBody
): TaskEither<ApiError, string> =>
  request(createUserRequestDefinition, {}, body, requestAdapter);
