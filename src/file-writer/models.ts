import * as STE from "fp-ts-contrib/lib/StateTaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as R from "fp-ts/lib/Record";
import * as gen from "io-ts-codegen";
import { ParserContext } from "../parser-context";
import { ParserSTE } from "../utils";
import { getIoTsTypesImportString, writeFormatted, createDir } from "./common";

function getModelFileName(name: string): string {
  return `models/${name}.ts`;
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

function writeModel(name: string, model: gen.TypeDeclaration): ParserSTE {
  const fileName = getModelFileName(name);
  const content = `${getModelImports(gen.getNodeDependencies(model), ".")}

    ${gen.printRuntime(model)}
    
    export type ${name} = t.TypeOf<typeof ${name}>;`;

  return writeFormatted(fileName, content);
}

function writeModelIndex(models: string[]): ParserSTE {
  let content =
    'export { DateFromISOString } from "io-ts-types/lib/DateFromISOString"; ';
  content += models.map(m => `export * from './${m}';`).join("\n");
  return writeFormatted("models/index.ts", content);
}

export function writeModels(): ParserSTE {
  return pipe(
    createDir("models"),
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
