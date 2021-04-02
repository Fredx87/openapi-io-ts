import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export const logoutUserRequestDefinition: RequestDefinition<string> = {
  path: "/user/logout",
  method: "get",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: {},
};

export const logoutUser = (
  requestAdapter: HttpRequestAdapter
) => (): TaskEither<ApiError, string> =>
  request(logoutUserRequestDefinition, {}, undefined, requestAdapter);
