import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import * as fs from "fs";
import { TypeDeclaration, TypeReference } from "io-ts-codegen";
import * as util from "util";
import { GenRTE } from "../environment";
import { generateSchema } from "./schema";
import * as ts from "typescript";

function writeFile(name: string, content: string): GenRTE<void> {
  return (env) =>
    pipe(
      TE.taskify(fs.writeFile)(`${env.outputDir}/${name}`, content),
      TE.fold(
        () => TE.left(new Error(`Cannot save file ${env.outputDir}/${name}`)),
        () => TE.right(undefined)
      )
    );
}

export function writeFormatted(name: string, content: string): GenRTE<void> {
  const source = ts.createSourceFile(name, content, ts.ScriptTarget.Latest);
  const printer = ts.createPrinter();
  const formatted = printer.printFile(source);
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
        (e) => new Error(String(e))
      )
    );
}

export function getImports(): string {
  return `import * as t from "io-ts";
    import * as schemas from "./";
    import { DateFromISOString } from "io-ts-types/DateFromISOString";
    `;
}

export function generateSchemaIfDeclaration(
  type: TypeDeclaration | TypeReference
): string {
  return type.kind === "TypeDeclaration" ? generateSchema(type) : "";
}
