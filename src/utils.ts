import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { get } from "lodash";
import { OpenAPIV3 } from "openapi-types";
import { JSONPointerToken, JSONReference } from "./common/JSONReference";

export function pascalCase(input: string): string {
  const charArray = input.split("");
  const copy = [...charArray];
  copy[0] = copy[0].toUpperCase();
  return copy.join("");
}

export function pointerToPath(pointer: string): E.Either<string, string[]> {
  const tokens = pointer.split("/");

  return pipe(
    E.fromOption(() => `Not enought tokens in pointer`)(A.tail(tokens)),
    E.chain(tail =>
      A.array.traverse(E.either)(tail, t =>
        pipe(
          JSONPointerToken.decode(t),
          E.mapLeft(() => `Cannot decode pointer token`)
        )
      )
    )
  );
}

export function getObjectByRef(
  ref: string,
  document: OpenAPIV3.Document
): unknown | undefined {
  return pipe(
    pointerToPath(ref),
    E.map(path => get(document, path)),
    E.getOrElse(() => undefined)
  );
}

export function getOrResolveRef<T>(
  obj: OpenAPIV3.ReferenceObject | T,
  document: OpenAPIV3.Document
): T {
  return JSONReference.is(obj)
    ? (getObjectByRef(obj.$ref, document) as T)
    : obj;
}
