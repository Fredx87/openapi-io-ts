import { TaskEither } from "fp-ts/TaskEither";
import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "openapi-io-ts/dist/runtime";
import * as schemas from "../components/schemas";

export type UploadFileRequestParameters = {
  petId: number;
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
  ],
  requestDefaultHeaders: {
    "Content-Type": "application/octet-stream",
    Accept: "application/json",
  },
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
