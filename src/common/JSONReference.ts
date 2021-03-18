import { ReadonlyNonEmptyArray, concat } from "fp-ts/lib/ReadonlyNonEmptyArray";
import * as t from "io-ts";

export class JsonPointer {
  constructor(private tokens: ReadonlyNonEmptyArray<string>) {}

  concat(tokens: ReadonlyNonEmptyArray<string>): JsonPointer {
    return new JsonPointer(concat(this.tokens, tokens));
  }

  toString(): string {
    return this.tokens.map(jsonPointerTokenEncode).join("/");
  }
}

export const JsonReference = t.type({
  $ref: t.string,
});

function jsonPointerTokenEncode(path: string): string {
  return path.replace(/~/g, "~0").replace(/\//g, "~1");
}
