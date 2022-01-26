import { pipe } from "fp-ts/function";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import * as RTE from "fp-ts/ReaderTaskEither";
import {
  getAbsoluteFileName,
  JsonPointer,
  resolvePointer,
} from "../JsonReference";
import { SchemaOrRef } from "../types";
import { ParseSchemaRTE } from "./ParseSchemaRTE";
import {
  readCurrentDocumentUri,
  readUriDocumentMap,
} from "../ParseSchemaContext";

export function resolveSchema(
  jsonPointer: JsonPointer
): ParseSchemaRTE<SchemaOrRef> {
  return pipe(
    RTE.Do,
    RTE.bind("uriDocumentMap", () => readUriDocumentMap()),
    RTE.bind("currentDocumentUri", () => readCurrentDocumentUri()),
    RTE.chainW(({ currentDocumentUri, uriDocumentMap }) => {
      if (jsonPointer.tokens.length === 1 && jsonPointer.tokens[0] === "#") {
        return RTE.right(uriDocumentMap[currentDocumentUri]);
      }

      const absolutePointer = convertToAbsolutePointer(
        jsonPointer,
        currentDocumentUri
      );

      return pipe(
        resolvePointer<SchemaOrRef>(uriDocumentMap, absolutePointer),
        RTE.fromOption(
          () =>
            new Error(
              `Cannot resolve pointer ${JSON.stringify(absolutePointer.tokens)}`
            )
        )
      );
    })
  );
}

function convertToAbsolutePointer(
  jsonPointer: JsonPointer,
  documentUri: string
): JsonPointer {
  if (jsonPointer.tokens[0] === "#") {
    const absoluteTokens = pipe(
      jsonPointer.tokens,
      RNEA.updateHead(documentUri)
    );
    return new JsonPointer(absoluteTokens);
  }

  if (jsonPointer.tokens[0].startsWith("./")) {
    const absoluteFileName = getAbsoluteFileName(
      documentUri,
      jsonPointer.tokens[0].replace("#", "")
    );

    const absoluteTokens = pipe(
      jsonPointer.tokens,
      RNEA.updateHead(absoluteFileName)
    );

    return new JsonPointer(absoluteTokens);
  }

  return jsonPointer;
}
