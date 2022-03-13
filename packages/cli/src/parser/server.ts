import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { OpenAPIV3 } from "openapi-types";
import { modifyParserState, ParserContext, ParserRTE } from "./context";

export interface ParsedServer {
  url: string;
}

export function parseAllServers(): ParserRTE<void> {
  return pipe(
    RTE.asks((context: ParserContext) => context.document.servers ?? []),
    RTE.map((servers) => servers.map(parseServer)),
    RTE.chain((parsedServers) =>
      modifyParserState((draft) => {
        draft.servers = parsedServers;
      })
    )
  );
}

function parseServer(server: OpenAPIV3.ServerObject): ParsedServer {
  return { url: server.url };
}
