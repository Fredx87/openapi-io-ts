import assert from "assert";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as t from "io-ts";
import { get } from "lodash";
import { OpenAPIV3 } from "openapi-types";

export function pascalCase(input: string): string {
  const charArray = input.split("");
  const copy = [...charArray];
  copy[0] = copy[0].toUpperCase();
  return copy.join("");
}

export function convertRefToPath(ref: string): O.Option<string> {
  return pipe(
    ref.split("/"),
    A.map(el => el.replace(/~1/g, "/").replace(/~0/g, "~")),
    A.tail,
    O.map(chunks => chunks.join("."))
  );
}

export function getObjectByRef(
  ref: string,
  document: OpenAPIV3.Document
): unknown | undefined {
  return pipe(
    convertRefToPath(ref),
    O.map(path => get(document, path)),
    O.getOrElse(() => undefined)
  );
}

export const jsonSchemaRef = t.exact(t.type({ $ref: t.string }));

export function getOrResolveRef<T>(
  obj: OpenAPIV3.ReferenceObject | T,
  document: OpenAPIV3.Document
): T {
  return jsonSchemaRef.is(obj)
    ? (getObjectByRef(obj.$ref, document) as T)
    : obj;
}

export function assertIsRight<E, A>(
  input: E.Either<E, A>
): asserts input is E.Right<A> {
  assert(E.isRight(input));
}
