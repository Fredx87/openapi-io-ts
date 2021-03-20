import { pipe } from "fp-ts/function";
import { ParserOutput } from "../parser/parserOutput";
import {
  SCHEMAS_PATH,
  PARAMETERS_PATH,
  OPERATIONS_PATH,
  SERVICES_PATH,
} from "./common";
import { generateComponents } from "./components";
import { CodegenRTE, CodegenContext } from "./context";
import { generateOperations } from "./operations";
import { generateServices } from "./services";
import * as RTE from "fp-ts/ReaderTaskEither";

export function main(parserOutput: ParserOutput): CodegenRTE<void> {
  const { components, operations, tags } = parserOutput;

  return pipe(
    createDirs(),
    RTE.chain(() => generateComponents(components)),
    RTE.chain(() => generateOperations(operations)),
    RTE.chain(() => generateServices(tags))
  );
}

function createDirs(): CodegenRTE<void> {
  const paths = [SCHEMAS_PATH, PARAMETERS_PATH, OPERATIONS_PATH, SERVICES_PATH];

  return pipe(
    RTE.ask<CodegenContext>(),
    RTE.chain(({ createDir, outputDir }) =>
      pipe(
        paths,
        RTE.traverseSeqArray((path) =>
          RTE.fromTaskEither(createDir(`${outputDir}/${path}`))
        )
      )
    ),
    RTE.map(() => void 0)
  );
}
