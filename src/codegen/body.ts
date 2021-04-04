import { ParsedBody } from "../parser/body";
import { ParsedItem } from "../parser/common";
import * as gen from "io-ts-codegen";

export function generateBodyType(body: ParsedBody): string {
  return body._tag === "JsonBody" ? `"json"` : `"text"`;
}

export function generateRequestBody(body: ParsedItem<ParsedBody>): string {
  return `export type ${body.name} = ${
    body.item._tag === "JsonBody" ? gen.printStatic(body.item.type) : "string"
  }`;
}
