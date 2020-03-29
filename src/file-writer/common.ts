import * as STE from "fp-ts-contrib/lib/StateTaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as fs from "fs";
import * as prettier from "prettier";
import * as util from "util";
import { ParserContext } from "../parser-context";
import { ParserSTE } from "../utils";

export function getIoTsTypesImportString(name: string): string {
  return `import { ${name} } from "io-ts-types/lib/${name}";`;
}

function writeFile(name: string, content: string): ParserSTE {
  return pipe(
    STE.gets<ParserContext, string>(context => context.outputDir),
    STE.chain(outDir =>
      STE.fromTaskEither(
        pipe(
          TE.taskify(fs.writeFile)(`${outDir}/${name}`, content),
          TE.fold(
            () => TE.left(`Cannot save file ${outDir}/${name}`),
            () => TE.right(undefined)
          )
        )
      )
    )
  );
}

export function writeFormatted(name: string, content: string): ParserSTE {
  const formatted = prettier.format(content, { parser: "typescript" });
  return writeFile(name, formatted);
}

export function createDir(dir: string): ParserSTE {
  return pipe(
    STE.gets<ParserContext, string>(context => context.outputDir),
    STE.chain(outDir =>
      STE.fromTaskEither(
        TE.tryCatch(
          () =>
            util.promisify(fs.mkdir)(`${outDir}/${dir}`, { recursive: true }),
          (e: any) => String(e)
        )
      )
    )
  );
}
