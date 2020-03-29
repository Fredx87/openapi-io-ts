import * as STE from "fp-ts-contrib/lib/StateTaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as R from "fp-ts/lib/Record";
import { ParserContext, Api } from "../parser-context";
import { ParserSTE } from "../utils";
import { writeFormatted, createDir } from "./common";
import { generateAxiosApiTemplate } from "../templates/axios";

export function writeApis(): ParserSTE {
  return pipe(
    createDir("apis"),
    STE.chain<ParserContext, string, void, Record<string, Api[]>>(() =>
      STE.gets(context => context.apis)
    ),
    STE.chain(apis =>
      R.record.traverseWithIndex(STE.stateTaskEither)(apis, (tag, apiGroup) =>
        writeFormatted(tag, generateAxiosApiTemplate(apiGroup))
      )
    ),
    STE.map(() => undefined)
  );
}
