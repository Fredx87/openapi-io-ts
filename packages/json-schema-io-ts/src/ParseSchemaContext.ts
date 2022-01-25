import * as IORef from "fp-ts/IORef";
import { JsonPointer } from "./JsonReference";
import { ParseSchemaResult } from "./ParseSchemaResult";
import { OpenApiDocument } from "./types";

export interface ModelGenerationInfo {
  name: string;
  importData?: {
    prefix: string;
    path: string;
  };
}

export interface ParseSchemaContext {
  document: OpenApiDocument;
  resultRef: IORef.IORef<ParseSchemaResult>;
  getModelGenerationInfo: (pointer: JsonPointer) => ModelGenerationInfo;
}
