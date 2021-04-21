import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { parseAllComponents } from "./components";
import { ParserRTE, readParserOutput } from "./context";
import { parseAllPaths } from "./operation";
import { ParserOutput } from "./parserOutput";
import { parseAllServers } from "./server";

export function main(): ParserRTE<ParserOutput> {
  return pipe(
    parseAllComponents(),
    RTE.chain(() => parseAllPaths()),
    RTE.chain(() => parseAllServers()),
    RTE.chain(() => readParserOutput())
  );
}
