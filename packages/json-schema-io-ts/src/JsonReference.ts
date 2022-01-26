import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import * as t from "io-ts";
import get from "lodash/get";
import { dirname, resolve } from "path";
import { UriDocumentMap } from "./ParseSchemaContext";

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
    createPointerTokensFromString(pointer),
    E.fromOption(
      () => new Error(`Cannot create JsonPointer for pointer "${pointer}"`)
    ),
    E.map((tokens) => {
      const decoded = RNEA.map(jsonPointerTokenDecode)(tokens);

      return new JsonPointer(decoded);
    })
  );
}

function createPointerTokensFromString(
  pointer: string
): O.Option<RNEA.ReadonlyNonEmptyArray<string>> {
  return pipe(
    pointer.split("/"),
    (tokens) => {
      /*
      If the pointer starts with `./${string}` it means that it is a reference to a local file.
      This changes the splitted array to have `./${string}` as first token

      TODO: Do the same for URL or absolute references
      */
      const [first, second, ...rest] = tokens;
      if (first === "." && second != null) {
        return [`./${second}`, ...rest];
      }
      return tokens;
    },
    RNEA.fromArray
  );
}

export function resolvePointer<T>(
  uriDocumentMap: UriDocumentMap,
  jsonPointer: JsonPointer
): O.Option<T> {
  return pipe(get(uriDocumentMap, jsonPointer.tokens) as T, O.fromNullable);
}

export function getAbsoluteFileName(
  currentDocumentUri: string,
  relativeFileName: string
): string {
  const rootDir = dirname(currentDocumentUri);
  return resolve(rootDir, relativeFileName);
}

function jsonPointerTokenEncode(token: string): string {
  return token.replace(/~/g, "~0").replace(/\//g, "~1");
}

function jsonPointerTokenDecode(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}
