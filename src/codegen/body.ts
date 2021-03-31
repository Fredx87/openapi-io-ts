import { printRuntime, printStatic } from "io-ts-codegen";
import { ParsedBody, ParsedJsonBody } from "../parser/body";

export function generateBodySchema(body: ParsedJsonBody): string {
  return `${printRuntime(body.type)}
    ${printStatic(body.type)}`;
}

export function generateBodyType(body: ParsedBody): string {
  return body._tag === "JsonBody" ? `"json"` : `"text"`;
}
