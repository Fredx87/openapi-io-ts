import * as schemas from "../components/schemas";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type CreateUsersWithListInputRequestBody = Array<schemas.User>;

export const createUsersWithListInputRequestDefinition: RequestDefinition<string> = {
  path: "/user/createWithList",
  method: "post",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: {},
  bodyType: "json",
};

export const createUsersWithListInput = (
  requestAdapter: HttpRequestAdapter
) => (
  body: CreateUsersWithListInputRequestBody
): TaskEither<ApiError, string> =>
  request(createUsersWithListInputRequestDefinition, {}, body, requestAdapter);
