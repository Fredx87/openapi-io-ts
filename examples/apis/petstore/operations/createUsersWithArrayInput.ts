import * as requestBodies from "../components/requestBodies";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export const createUsersWithArrayInputRequestDefinition: RequestDefinition<string> = {
  path: "/user/createWithArray",
  method: "post",
  successfulResponse: { _tag: "TextResponse" },
  parametersDefinitions: {},
  bodyType: "json",
};

export const createUsersWithArrayInput = (
  requestAdapter: HttpRequestAdapter
) => (body: requestBodies.UserArray): TaskEither<ApiError, string> =>
  request(createUsersWithArrayInputRequestDefinition, {}, body, requestAdapter);
