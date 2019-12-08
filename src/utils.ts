import { OpenAPIV3 } from "openapi-types";
import { get } from "lodash";

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
