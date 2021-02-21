import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { GenRTE } from "../environment";
import { ParserState } from "../parser/parserState";
import { generateAxiosApiTemplate } from "../templates/axios";
import { createDir, writeFormatted } from "./common";

export function writeApis({ apis }: ParserState): GenRTE<void> {
  const tasks = Object.entries(apis).map(([tag, apiGroup]) =>
    writeFormatted(`apis/${tag}.ts`, generateAxiosApiTemplate(apiGroup))
  );

  return pipe(
    createDir("apis"),
    RTE.chain(() => RTE.sequenceSeqArray(tasks)),
    RTE.map(() => {})
  );
}
