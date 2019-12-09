import { get } from "lodash";
import { OpenAPIV3 } from "openapi-types";

export function pascalCase(input: string): string {
  const charArray = input.split("");
  const copy = [...charArray];
  copy[0] = copy[0].toUpperCase();
  return copy.join("");
}

export function getObjectByRef(document: OpenAPIV3.Document, ref: string) {
  const chunks = ref.split("/");
  const path = chunks.splice(1, chunks.length).join(".");
  return get(document, path);
}

export function isReference(obj: any): obj is OpenAPIV3.ReferenceObject {
  return "$ref" in obj;
}
