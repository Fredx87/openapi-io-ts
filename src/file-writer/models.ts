import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as R from "fp-ts/Record";
import * as gen from "io-ts-codegen";
import { GenRTE } from "../environment";
import { ParserState } from "../parser/parserState";
import { createDir, writeFormatted } from "./common";

function writeModel(model: gen.TypeDeclaration): GenRTE<void> {
  const fileName = `models/${model.name}.ts`;
  const content = `import * as t from "io-ts";
  import * as models from "./";

    ${gen.printRuntime(model)}
    
    export type ${model.name} = t.TypeOf<typeof ${model.name}>;`;

  return writeFormatted(fileName, content);
}

function writeModelIndex(models: string[]): GenRTE<void> {
  let content =
    'export { DateFromISOString } from "io-ts-types/lib/DateFromISOString"; ';
  content += models.map((m) => `export * from './${m}';`).join("\n");
  return writeFormatted("models/index.ts", content);
}

export function writeModels({ models }: ParserState): GenRTE<unknown> {
  return pipe(
    createDir("models"),
    RTE.chain(() =>
      pipe(
        R.record.traverse(RTE.readerTaskEither)(models, (model) =>
          writeModel(model)
        ),
        RTE.chain(() =>
          writeModelIndex(Object.values(models).map((m) => m.name))
        )
      )
    )
  );
}
