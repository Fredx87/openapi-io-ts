import * as E from "fp-ts/Either";
import * as t from "io-ts";

function JSONPointerTokenEncode(path: string): string {
  return path.replace(/~/g, "~0").replace(/\//g, "~1");
}

function JSONPointerTokenDecode(path: string): E.Either<t.Errors, string> {
  return t.success(path.replace(/~1/g, "/").replace(/~0/g, "~"));
}

export const JSONPointerToken = new t.Type<string, string, string>(
  "JSONPointerToken",
  t.string.is,
  JSONPointerTokenDecode,
  JSONPointerTokenEncode
);

export function createPointer(basePointer: string, token: string): string {
  return `${basePointer}/${JSONPointerToken.encode(token)}`;
}

export const JSONReference = t.type({
  $ref: t.string,
});
