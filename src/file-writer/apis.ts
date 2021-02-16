import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as R from "fp-ts/Record";
import { GenRTE } from "../environment";
import { ParserState } from "../parser/parserState";
import { generateAxiosApiTemplate } from "../templates/axios";
import { createDir, writeFormatted } from "./common";

export function writeApis({ apis }: ParserState): GenRTE<void> {
  return pipe(
    createDir("apis"),
    RTE.chain(() =>
      R.record.traverseWithIndex(RTE.readerTaskEither)(apis, (tag, apiGroup) =>
        writeFormatted(`apis/${tag}.ts`, generateAxiosApiTemplate(apiGroup))
      )
    ),
    RTE.map(() => undefined)
  );
}
