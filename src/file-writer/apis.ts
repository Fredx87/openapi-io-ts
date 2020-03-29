import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as R from "fp-ts/lib/Record";
import { GenRTE, readParserState } from "../environment";
import { generateAxiosApiTemplate } from "../templates/axios";
import { createDir, writeFormatted } from "./common";

export function writeApis(): GenRTE<void> {
  return pipe(
    createDir("apis"),
    RTE.chain(() => readParserState()),
    RTE.map(state => state.apis),
    RTE.chain(apis =>
      R.record.traverseWithIndex(RTE.readerTaskEither)(apis, (tag, apiGroup) =>
        writeFormatted(`apis/${tag}.ts`, generateAxiosApiTemplate(apiGroup))
      )
    ),
    RTE.map(() => undefined)
  );
}
