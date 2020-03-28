import * as STE from "fp-ts-contrib/lib/StateTaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as R from "fp-ts/lib/Record";
import * as TE from "fp-ts/lib/TaskEither";
import * as fs from "fs";
import * as gen from "io-ts-codegen";
import * as prettier from "prettier";
import * as util from "util";
import { ParserContext } from "./parser-context";
import { ParserSTE } from "./utils";

function getModelFileName(name: string): string {
  return `models/${name}.ts`;
}

function getIoTsTypesImportString(name: string): string {
  return `import { ${name} } from "io-ts-types/lib/${name}";`;
}

function getModelImportString(name: string, path: string): string {
  return `import { ${name} } from "${path}/${name}";`;
}

function getModelImports(deps: string[], modelsPath: string): string {
  const ioTsTypes = ["DateFromISOString"];
  const ioTsTypesImports = deps
    .filter(d => ioTsTypes.includes(d))
    .map(getIoTsTypesImportString)
    .join("\n");
  const otherImports = deps
    .filter(d => !ioTsTypes.includes(d))
    .map(d => getModelImportString(d, modelsPath))
    .join("\n");
  return `import * as t from "io-ts";
    ${ioTsTypesImports}
    ${otherImports}`;
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

function writeFormatted(name: string, content: string): ParserSTE {
  const formatted = prettier.format(content, { parser: "typescript" });
  return writeFile(name, formatted);
}

function writeModel(name: string, model: gen.TypeDeclaration): ParserSTE {
  const fileName = getModelFileName(name);
  const content = `${getModelImports(gen.getNodeDependencies(model), ".")}

    ${gen.printRuntime(model)}
    
    export type ${name} = t.TypeOf<typeof ${name}>;`;

  return writeFormatted(fileName, content);
}

function createModelsDir(): ParserSTE {
  return pipe(
    STE.gets<ParserContext, string>(context => context.outputDir),
    STE.chain(outDir =>
      STE.fromTaskEither(
        TE.tryCatch(
          () =>
            util.promisify(fs.mkdir)(`${outDir}/models`, { recursive: true }),
          (e: any) => String(e)
        )
      )
    )
  );
}

function writeModelIndex(models: string[]): ParserSTE {
  let content =
    'export { DateFromISOString } from "io-ts-types/lib/DateFromISOString"; ';
  content += models.map(m => `export * from './${m}';`).join("\n");
  return writeFormatted("models/index.ts", content);
}

export function writeModels(): ParserSTE {
  return pipe(
    createModelsDir(),
    STE.chain<ParserContext, string, void, Record<string, gen.TypeDeclaration>>(
      () => STE.gets(context => context.generatedModels.namesMap)
    ),
    STE.chain(models =>
      pipe(
        R.record.traverseWithIndex(STE.stateTaskEither)(models, (name, model) =>
          writeModel(name, model)
        ),
        STE.chain(() => writeModelIndex(Object.keys(models)))
      )
    ),
    STE.map(() => undefined)
  );
}
