import type { OperationTypes } from "@openapi-io-ts/runtime";
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

export type UploadFileOperationTypes = OperationTypes<
  UploadFileRequestParameters,
  Blob,
  schemas.ApiResponse
>;
