import { pipe } from "fp-ts/function";
import * as R from "fp-ts/Reader";
import { Environment, ProgramRTE } from "../environment";
import { ParserOutput } from "../parser/parserOutput";
import { CodegenContext } from "./context";
import { createDir, writeFile } from "./fs";
import { main } from "./main";

export function codegen(parserOutput: ParserOutput): ProgramRTE<void> {
  return pipe(
    main(),
    R.local(
      (env: Environment): CodegenContext => ({
        ...env,
        writeFile,
        createDir,
        parserOutput,
      })
    )
  );
}
