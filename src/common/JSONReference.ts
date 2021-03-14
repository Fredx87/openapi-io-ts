import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";
import * as t from "io-ts";

function jsonPointerTokenEncode(path: string): string {
  return path.replace(/~/g, "~0").replace(/\//g, "~1");
}

export function jsonPointer(tokens: NonEmptyArray<string>): string {
  const encodedTokens = tokens.map((t) => jsonPointerTokenEncode(t)).join("/");
  return `#/${encodedTokens}`;
}

export const JsonReference = t.type({
  $ref: t.string,
});
