import * as TE from "fp-ts/TaskEither";
import ts from "typescript";
import * as fs from "fs";
import { pipe } from "fp-ts/function";
import * as util from "util";

export function writeFormattedFile(
  path: string,
  fileName: string,
  content: string
): TE.TaskEither<Error, void> {
  const source = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest);
  const printer = ts.createPrinter();
  const formatted = printer.printFile(source);
  return writeFileToDisk(path, fileName, formatted);
}

export function createDir(path: string): TE.TaskEither<Error, void> {
  return pipe(
    TE.tryCatch(
      () => util.promisify(fs.mkdir)(path, { recursive: true }),
      (e) => new Error(`Cannot create directory "${path}". Error: ${String(e)}`)
    )
  );
}

function writeFileToDisk(
  path: string,
  name: string,
  content: string
): TE.TaskEither<Error, void> {
  return pipe(
    TE.tryCatch(
      () => util.promisify(fs.writeFile)(`${path}/${name}`, content),
      (e) =>
        new Error(`Cannot save file "${path}/${name}". Error: ${String(e)}`)
    )
  );
}