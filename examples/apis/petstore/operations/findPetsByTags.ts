import * as t from "io-ts";
import * as schemas from "../components/schemas";
import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type FindPetsByTagsRequestParameters = {
  tags: Array<string>;
};

export const findPetsByTagsOperation: Operation = {
  path: "/pet/findByTags",
  method: "get",
  responses: {
    "200": { _tag: "JsonResponse", decoder: t.array(schemas.Pet) },
    "400": { _tag: "EmptyResponse" },
  },
  parameters: [
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "tags",
    },
  ],
  requestDefaultHeaders: {},
};

export const findPetsByTags = (requestAdapter: HttpRequestAdapter) => (
  params: FindPetsByTagsRequestParameters
): TaskEither<ApiError, ApiResponse<Array<schemas.Pet>>> =>
  request(findPetsByTagsOperation, params, undefined, requestAdapter);
