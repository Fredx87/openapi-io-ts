import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as fs from "fs";
import { pipe } from "fp-ts/function";
import * as util from "util";
import { formatFile } from "./format";

export function createDir(path: string): TE.TaskEither<Error, void> {
  return pipe(
    TE.tryCatch(
      () => util.promisify(fs.mkdir)(path, { recursive: true }),
      (e) => new Error(`Cannot create directory "${path}". Error: ${String(e)}`)
    ),
    TE.map(() => void 0)
  );
}

export function writeFile(
  path: string,
  name: string,
  content: string
): TE.TaskEither<Error, void> {
  const fileName = `${path}/${name}`;

  return pipe(
    formatFile(fileName, content),
    E.getOrElse(() => content),
    TE.right,
    TE.chain((formattedContent) =>
      TE.tryCatch(
        () => util.promisify(fs.writeFile)(fileName, formattedContent),
        (e) => new Error(`Cannot save file "${fileName}". Error: ${String(e)}`)
      )
    )
  );
}
