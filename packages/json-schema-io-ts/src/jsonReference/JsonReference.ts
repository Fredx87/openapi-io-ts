import { pipe } from "fp-ts/function";
import { split, isEmpty } from "fp-ts/string";
import * as O from "fp-ts/Option";
import { not } from "fp-ts/Predicate";
import * as RA from "fp-ts/ReadonlyArray";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import * as t from "io-ts";
import get from "lodash/get";
import { dirname, resolve } from "path";
import { UriDocumentMap } from "../ParseSchemaContext";

export const JsonSchemaRef = t.type({
  $ref: t.string,
});

export interface JsonReference {
  readonly uri: string;
  readonly jsonPointer: readonly string[];
}

export function createJsonReference(
  stringReference: string,
  currentDocumentUri: string
): JsonReference {
  const splitted = pipe(stringReference, split("#"));

  const uri = pipe(splitted, RNEA.head);

  const jsonPointer = pipe(splitted, RNEA.tail, (stringPointer) =>
    pipe(
      stringPointer[0] ?? "",
      split("/"),
      RA.filter(not(isEmpty)),
      RA.map(jsonPointerTokenDecode)
    )
  );

  return {
    uri: getAbsoluteUri(uri, currentDocumentUri),
    jsonPointer,
  };
}

export function jsonReferenceToString({
  uri,
  jsonPointer,
}: JsonReference): string {
  const encodedTokens = pipe(jsonPointer, RA.map(jsonPointerTokenEncode));

  const fragment =
    encodedTokens.length > 0 ? `#/${encodedTokens.join("/")}` : "";

  return `${uri}${fragment}`;
}

export function resolveReference<T>(
  uriDocumentMap: UriDocumentMap,
  { uri, jsonPointer }: JsonReference
): O.Option<T> {
  return pipe(get(uriDocumentMap, [uri, ...jsonPointer]) as T, O.fromNullable);
}

function getAbsoluteUri(uri: string, currentDocumentUri: string): string {
  if (uri === "") {
    return currentDocumentUri;
  }

  if (uri.startsWith("./")) {
    return convertToAbsoluteUri(uri, currentDocumentUri);
  }

  return uri;
}

function convertToAbsoluteUri(
  relativeUri: string,
  currentDocumentUri: string
): string {
  const rootDir = dirname(currentDocumentUri);
  return resolve(rootDir, relativeUri);
}

function jsonPointerTokenEncode(token: string): string {
  return token.replace(/~/g, "~0").replace(/\//g, "~1");
}

function jsonPointerTokenDecode(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}
