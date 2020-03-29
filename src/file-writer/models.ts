import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as R from "fp-ts/lib/Record";
import * as gen from "io-ts-codegen";
import { GenRTE, readParserState } from "../environment";
import { createDir, getIoTsTypesImportString, writeFormatted } from "./common";

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

function writeModel(name: string, model: gen.TypeDeclaration): GenRTE<void> {
  const fileName = getModelFileName(name);
  const content = `${getModelImports(gen.getNodeDependencies(model), ".")}

    ${gen.printRuntime(model)}
    
    export type ${name} = t.TypeOf<typeof ${name}>;`;

  return writeFormatted(fileName, content);
}

function writeModelIndex(models: string[]): GenRTE<void> {
  let content =
    'export { DateFromISOString } from "io-ts-types/lib/DateFromISOString"; ';
  content += models.map(m => `export * from './${m}';`).join("\n");
  return writeFormatted("models/index.ts", content);
}

export function writeModels(): GenRTE<void> {
  return pipe(
    createDir("models"),
    RTE.chain(() => readParserState()),
    RTE.map(state => state.generatedModels.namesMap),
    RTE.chain(models =>
      pipe(
        R.record.traverseWithIndex(RTE.readerTaskEither)(
          models,
          (name, model) => writeModel(name, model)
        ),
        RTE.chain(() => writeModelIndex(Object.keys(models)))
      )
    ),
    RTE.map(() => undefined)
  );
}
