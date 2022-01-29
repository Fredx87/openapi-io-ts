import type { RequestFunction } from "@openapi-io-ts/runtime";

export type UpdatePetWithFormRequestParameters = {
  petId: number;
  name?: string;
  status?: string;
};

export const updatePetWithFormOperation = {
  path: "/pet/{petId}",
  method: "post",
  responses: { "405": { _tag: "EmptyResponse" } },
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
      name: "name",
    },
    {
      _tag: "FormParameter",
      explode: true,
      in: "query",
      name: "status",
    },
  ],
  requestDefaultHeaders: {},
} as const;

export type UpdatePetWithFormRequestFunction = RequestFunction<
  { params: UpdatePetWithFormRequestParameters },
  void
>;
