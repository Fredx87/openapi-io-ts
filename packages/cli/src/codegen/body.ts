import { BodyItemOrRef, ParsedBody } from "../parser/body";
import { ParsedItem } from "../parser/common";
import * as gen from "io-ts-codegen";
import {
  generateSchemaIfDeclaration,
  getItemOrRefPrefix,
  getParsedItem,
  isParsedItem,
} from "./common";
import { CodegenRTE } from "./context";
import * as RTE from "fp-ts/ReaderTaskEither";
import { pipe } from "fp-ts/function";

export function generateOperationBody(body: ParsedItem<ParsedBody>): string {
  switch (body.item._tag) {
    case "ParsedBinaryBody": {
      return `{
        _tag: "BinaryBody",
        mediaType: "${body.item.mediaType}"
      }`;
    }
    case "ParsedFormBody": {
      return `{
        _tag: "FormBody"
      }`;
    }
    case "ParsedMultipartBody": {
      return `{
        _tag: "MultipartBody"
      }`;
    }
    case "ParsedJsonBody": {
      return `{
        _tag: "JsonBody"
      }`;
    }
    case "ParsedTextBody": {
      return `{
        _tag: "TextBody"
      }`;
    }
  }
}

export function generateOperationBodySchema(body: ParsedBody): string {
  if (body._tag === "ParsedBinaryBody" || body._tag === "ParsedTextBody") {
    return "";
  }

  return generateSchemaIfDeclaration(body.type);
}

export function getBodyOrRefStaticType(
  itemOrRef: BodyItemOrRef
): CodegenRTE<string> {
  if (isParsedItem(itemOrRef)) {
    return RTE.right(getBodyStaticType(itemOrRef.item));
  }

  return pipe(
    getParsedItem(itemOrRef),
    RTE.map((body) =>
      getBodyStaticType(body.item, getItemOrRefPrefix(itemOrRef))
    )
  );
}

function getBodyStaticType(body: ParsedBody, prefix = ""): string {
  switch (body._tag) {
    case "ParsedBinaryBody": {
      return "Blob";
    }
    case "ParsedTextBody": {
      return "string";
    }
    case "ParsedFormBody":
    case "ParsedMultipartBody":
    case "ParsedJsonBody": {
      const { type } = body;

      if (type.kind === "TypeDeclaration") {
        return `${prefix}${type.name}`;
      }

      return gen.printStatic(type);
    }
  }
}
