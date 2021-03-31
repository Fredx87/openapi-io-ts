import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { Environment, ProgramRTE } from "../environment";
import { ParserOutput } from "../parser/parserOutput";
import { CodegenContext } from "./context";
import { createDir, writeFormattedFile } from "./fs";
import { main } from "./main";

export function codegen(parserOutput: ParserOutput): ProgramRTE<void> {
  return pipe(
    main(),
    RTE.local(
      (env: Environment): CodegenContext => ({
        ...env,
        writeFile: writeFormattedFile,
        createDir,
        parserOutput,
      })
    )
  );
}
