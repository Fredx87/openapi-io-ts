import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import {
  SCHEMAS_PATH,
  PARAMETERS_PATH,
  OPERATIONS_PATH,
  SERVICES_PATH,
  RESPONSES_PATH,
  REQUEST_BODIES_PATH,
} from "./common";
import { generateComponents } from "./components";
import { CodegenRTE, CodegenContext } from "./context";
import { generateOperations } from "./operations";
import { generateServers } from "./servers";
import { generateOperationsIndex } from "./operationsIndex";

export function main(): CodegenRTE<void> {
  return pipe(
    createDirs(),
    RTE.chain(() => generateComponents()),
    RTE.chain(() => generateOperations()),
    RTE.chain(() => generateOperationsIndex()),
    RTE.chain(() => generateServers())
  );
}

function createDirs(): CodegenRTE<void> {
  const paths = [
    SCHEMAS_PATH,
    PARAMETERS_PATH,
    RESPONSES_PATH,
    REQUEST_BODIES_PATH,
    OPERATIONS_PATH,
    SERVICES_PATH,
  ];

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
