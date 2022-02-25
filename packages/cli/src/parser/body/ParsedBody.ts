import { ParsedItemSchema } from "../parsedItem";

interface BaseParsedBody {
  required: boolean;
}

export interface ParsedBinaryBody extends BaseParsedBody {
  _tag: "ParsedBinaryBody";
  mediaType: string;
}

export interface ParsedFormBody extends BaseParsedBody {
  _tag: "ParsedFormBody";
  schema: ParsedItemSchema;
}

export interface ParsedMultipartBody extends BaseParsedBody {
  _tag: "ParsedMultipartBody";
  schema: ParsedItemSchema;
}

export interface ParsedJsonBody extends BaseParsedBody {
  _tag: "ParsedJsonBody";
  schema: ParsedItemSchema;
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
