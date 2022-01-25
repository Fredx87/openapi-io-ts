import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import * as t from "io-ts";
import get from "lodash/get";
import { OpenApiDocument } from "./types";

export class JsonPointer {
  constructor(public tokens: RNEA.ReadonlyNonEmptyArray<string>) {}

  concat(tokens: RNEA.ReadonlyNonEmptyArray<string>): JsonPointer {
    return new JsonPointer(pipe(this.tokens, RNEA.concat(tokens)));
  }

  toString(): string {
    return this.tokens.map(jsonPointerTokenEncode).join("/");
  }
}

export const JsonReference = t.type({
  $ref: t.string,
});

export function createJsonPointer(
  pointer: string
): E.Either<Error, JsonPointer> {
  return pipe(
    RNEA.fromArray(pointer.split("/")),
    E.fromOption(
      () => new Error(`Cannot create JsonPointer for pointer "${pointer}"`)
    ),
    E.map((tokens) => {
      const decoded = RNEA.map(jsonPointerTokenDecode)(tokens);
      return new JsonPointer(decoded);
    })
  );
}

export function resolvePointer<T>(
  document: OpenApiDocument,
  jsonPointer: JsonPointer
): O.Option<T> {
  return pipe(
    jsonPointer.tokens,
    RNEA.tail,
    (path) => get(document, path) as T,
    O.fromNullable
  );
}

function jsonPointerTokenEncode(token: string): string {
  return token.replace(/~/g, "~0").replace(/\//g, "~1");
}

function jsonPointerTokenDecode(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}
