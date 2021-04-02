import * as schemas from "../components/schemas";
import * as parameters from "../components/parameters";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type GetUserByNameRequestParameters = {
  username: string;
};

export const getUserByNameRequestDefinition: RequestDefinition<schemas.User> = {
  path: "/user/{username}",
  method: "get",
  successfulResponse: { _tag: "JsonResponse", decoder: schemas.User },
  parametersDefinitions: { username: parameters.username },
};

export const getUserByName = (requestAdapter: HttpRequestAdapter) => (
  params: GetUserByNameRequestParameters
): TaskEither<ApiError, schemas.User> =>
  request(getUserByNameRequestDefinition, params, undefined, requestAdapter);
