import * as schemas from "../components/schemas";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type UploadFileRequestParameters = {
  petId: number;
};

export type UploadFileRequestBody = string;

export const uploadFileRequestDefinition: RequestDefinition<schemas.ApiResponse> = {
  path: "/pet/{petId}/uploadImage",
  method: "post",
  successfulResponse: { _tag: "JsonResponse", decoder: schemas.ApiResponse },
  parametersDefinitions: {
    petId: {
      in: "path",
    },
  },
  bodyType: "text",
};

export const uploadFile = (requestAdapter: HttpRequestAdapter) => (
  params: UploadFileRequestParameters,
  body: UploadFileRequestBody
): TaskEither<ApiError, schemas.ApiResponse> =>
  request(uploadFileRequestDefinition, params, body, requestAdapter);
