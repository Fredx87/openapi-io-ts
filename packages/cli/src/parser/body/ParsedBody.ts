import * as gen from "io-ts-codegen";

interface BaseParsedBody {
  required: boolean;
}

export interface ParsedBinaryBody extends BaseParsedBody {
  _tag: "ParsedBinaryBody";
  mediaType: string;
}

export interface ParsedFormBody extends BaseParsedBody {
  _tag: "ParsedFormBody";
  type: gen.TypeDeclaration | gen.TypeReference;
}

export interface ParsedMultipartBody extends BaseParsedBody {
  _tag: "ParsedMultipartBody";
  type: gen.TypeDeclaration | gen.TypeReference;
}

export interface ParsedJsonBody extends BaseParsedBody {
  _tag: "ParsedJsonBody";
  type: gen.TypeDeclaration | gen.TypeReference;
}

export interface ParsedTextBody extends BaseParsedBody {
  _tag: "ParsedTextBody";
}

export type ParsedBody =
  | ParsedBinaryBody
  | ParsedFormBody
  | ParsedMultipartBody
  | ParsedJsonBody
  | ParsedTextBody;
