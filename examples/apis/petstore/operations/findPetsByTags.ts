import * as t from "io-ts";
import * as schemas from "../components/schemas";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type FindPetsByTagsRequestParameters = {
  tags: Array<string>;
};

export const findPetsByTagsRequestDefinition: RequestDefinition<
  Array<schemas.Pet>
> = {
  path: "/pet/findByTags",
  method: "get",
  successfulResponse: { _tag: "JsonResponse", decoder: t.array(schemas.Pet) },
  parametersDefinitions: {
    tags: {
      in: "query",
    },
  },
};

export const findPetsByTags = (requestAdapter: HttpRequestAdapter) => (
  params: FindPetsByTagsRequestParameters
): TaskEither<ApiError, Array<schemas.Pet>> =>
  request(findPetsByTagsRequestDefinition, params, undefined, requestAdapter);
