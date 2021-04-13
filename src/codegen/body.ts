import { ParsedBody } from "../parser/body";
import { ParsedItem } from "../parser/common";
import * as gen from "io-ts-codegen";

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

export function generateOperationBodySchema(
  name: string,
  body: ParsedBody
): string {
  if (body._tag === "ParsedTextBody") {
    return `export type ${name}Schema = string;`;
  }

  if (body._tag === "ParsedBinaryBody") {
    return `export type ${name}Schema = Blob;`;
  }

  return `export type ${name}Schema = ${getBodyStaticType(body)};`;
}

function getBodyStaticType(body: ParsedBody): string {
  switch (body._tag) {
    case "ParsedBinaryBody": {
      return "Blob";
    }
    case "ParsedFormBody":
    case "ParsedMultipartBody":
    case "ParsedJsonBody": {
      return gen.printStatic(body.type);
    }
    case "ParsedTextBody": {
      return "string";
    }
  }
}
