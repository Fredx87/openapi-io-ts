import * as gen from "io-ts-codegen";

export interface ParsedItemTypeReference {
  _tag: "ParsedItemTypeReference";
  typeReference: gen.BasicType | gen.Combinator | gen.ImportedIdentifier;
}

export interface ParsedItemInternalSchema {
  _tag: "ParsedItemInternalSchema";
  identifier: gen.Identifier;
  typeDeclaration: gen.TypeDeclaration;
}

export type ParsedItemSchema =
  | ParsedItemTypeReference
  | ParsedItemInternalSchema;
