import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
import * as t from "io-ts";
import * as schemas from "../components/schemas";

export type FindPetsByTagsRequestParameters = {
  tags?: Array<string>;
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
  requestDefaultHeaders: { Accept: "application/json" },
};

export const findPetsByTagsBuilder =
  (requestAdapter: HttpRequestAdapter) =>
  (
    params: FindPetsByTagsRequestParameters
  ): TaskEither<ApiError, ApiResponse<Array<schemas.Pet>>> =>
    request(findPetsByTagsOperation, params, undefined, requestAdapter);
