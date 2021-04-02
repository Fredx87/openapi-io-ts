import * as t from "io-ts";
import * as schemas from "../components/schemas";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type FindPetsByStatusRequestParameters = {
  status: Array<"available" | "pending" | "sold">;
};

export const findPetsByStatusRequestDefinition: RequestDefinition<
  Array<schemas.Pet>
> = {
  path: "/pet/findByStatus",
  method: "get",
  successfulResponse: { _tag: "JsonResponse", decoder: t.array(schemas.Pet) },
  parametersDefinitions: {
    status: {
      in: "query",
    },
  },
};

export const findPetsByStatus = (requestAdapter: HttpRequestAdapter) => (
  params: FindPetsByStatusRequestParameters
): TaskEither<ApiError, Array<schemas.Pet>> =>
  request(findPetsByStatusRequestDefinition, params, undefined, requestAdapter);
