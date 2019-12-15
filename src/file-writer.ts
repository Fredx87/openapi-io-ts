import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as R from "fp-ts/lib/Record";
import * as SRTE from "fp-ts/lib/StateReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as fs from "fs";
import * as gen from "io-ts-codegen";
import * as prettier from "prettier";
import { ParserConfiguration } from "./parser-configuration";
import { ParserContext } from "./parser-context";
import { ParserRTE, ParserSRTE } from "./utils";

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

function writeFile(name: string, content: string): ParserRTE {
  return pipe(
    RTE.asks((config: ParserConfiguration) => config.outputDir),
    RTE.chain(outDir =>
      RTE.fromTaskEither(
        pipe(
          TE.taskify(fs.writeFile)(`${outDir}/${name}`, content),
          TE.fold(
            () => TE.left(`Cannot save file ${outDir}/${name}`),
            () => TE.right(void 0)
          )
        )
      )
    )
  );
}

function writeModel(name: string, model: gen.TypeDeclaration): ParserRTE {
  const fileName = getModelFileName(name);
  const content = `${getModelImports(gen.getNodeDependencies(model), ".")}

    ${gen.printRuntime(model)}
    
    export type ${name} = t.TypeOf<typeof ${name}>;`;

  const formatted = prettier.format(content, { parser: "typescript" });
  return writeFile(fileName, formatted);
}

export function writeModels(): ParserSRTE {
  return pipe(
    SRTE.gets((context: ParserContext) => context.generatedModels.namesMap),
    SRTE.chain(models =>
      SRTE.fromReaderTaskEither(
        R.record.traverseWithIndex(RTE.readerTaskEither)(
          models,
          (name, model) => writeModel(name, model)
        )
      )
    ),
    SRTE.map(() => void 0)
  );
}
