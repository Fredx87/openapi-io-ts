import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { GenRTE } from "../environment";
import { ParserOutput } from "../parser/parserOutput";
import { createDir } from "./common";
import { generateComponents } from "./components";
import { generateOperations } from "./operation";

export function codegen(parserOutput: ParserOutput): GenRTE<void> {
  return pipe(
    createDirs(),
    RTE.chain(() => generateComponents(parserOutput.components)),
    RTE.chain(() => generateOperations(parserOutput.operations))
  );
}

function createDirs(): GenRTE<void> {
  return pipe(
    createDir("components/schemas"),
    RTE.chain(() => createDir("components/parameters")),
    RTE.chain(() => createDir("operations"))
  );
}
