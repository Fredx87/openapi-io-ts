import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { GenRTE } from "../environment";
import { ParserOutput } from "../parser/parserOutput";
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

export function writeModels({
  componentModels: models,
}: ParserOutput): GenRTE<void> {
  const tasks = Object.values(models).map(writeModel);

  return pipe(
    createDir("models"),
    RTE.chain(() =>
      pipe(
        RTE.sequenceSeqArray(tasks),
        RTE.chain(() =>
          writeModelIndex(Object.values(models).map((m) => m.name))
        )
      )
    )
  );
}
