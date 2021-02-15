import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import * as fs from "fs";
import * as prettier from "prettier";
import * as util from "util";
import { GenRTE } from "../environment";

function writeFile(name: string, content: string): GenRTE<void> {
  return (env) =>
    pipe(
      TE.taskify(fs.writeFile)(`${env.outputDir}/${name}`, content),
      TE.fold(
        () => TE.left(`Cannot save file ${env.outputDir}/${name}`),
        () => TE.right(undefined)
      )
    );
}

export function writeFormatted(name: string, content: string): GenRTE<void> {
  const formatted = prettier.format(content, { parser: "typescript" });
  return writeFile(name, formatted);
}

export function createDir(dir: string): GenRTE<void> {
  return (env) =>
    pipe(
      TE.tryCatch(
        () =>
          util.promisify(fs.mkdir)(`${env.outputDir}/${dir}`, {
            recursive: true,
          }),
        (e: any) => String(e)
      )
    );
}
