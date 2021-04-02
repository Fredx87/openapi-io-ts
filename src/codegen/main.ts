import { pipe } from "fp-ts/function";
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

export function main(): CodegenRTE<void> {
  return pipe(
    createDirs(),
    RTE.chain(() => generateComponents()),
    RTE.chain(() => generateOperations()),
    RTE.chain(() => generateServices())
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
