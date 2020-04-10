import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as R from "fp-ts/lib/Record";
import * as gen from "io-ts-codegen";
import { GenRTE, readParserState } from "../environment";
import { createDir, writeFormatted } from "./common";

function writeModel(name: string, model: gen.TypeDeclaration): GenRTE<void> {
  const fileName = `models/${name}.ts`;
  const content = `import * as t from "io-ts";
  import * as models from "./";

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
