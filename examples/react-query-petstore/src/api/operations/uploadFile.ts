import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export type UploadFileRequestParameters = {
  petId: number;
  additionalMetadata?: string;
};

export const uploadFileOperation = {
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
} as const;

export type UploadFileOperationRequestFunction = (args: {
  params: UploadFileRequestParameters;
  body: Blob;
}) => TaskEither<ApiError, ApiResponse<schemas.ApiResponse>>;
