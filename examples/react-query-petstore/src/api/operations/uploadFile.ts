import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export type UploadFileRequestParameters = {
  petId: number;
  additionalMetadata?: string;
};

export const uploadFileOperation: Operation = {
  path: "/pet/{petId}/uploadImage",
  method: "post",
  responses: { "200": { _tag: "JsonResponse", decoder: schemas.ApiResponse } },
  parameters: [
    {
      _tag: "FormParameter",
      explode: false,
      in: "path",
      name: "petId",
    },
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "additionalMetadata",
    },
  ],
  requestDefaultHeaders: { Accept: "application/json" },
  body: {
    _tag: "BinaryBody",
    mediaType: "application/octet-stream",
  },
};

export const uploadFile = (requestAdapter: HttpRequestAdapter) => (
  params: UploadFileRequestParameters,
  body: Blob
): TaskEither<ApiError, ApiResponse<schemas.ApiResponse>> =>
  request(uploadFileOperation, params, body, requestAdapter);
