import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { parseSchema } from "./parseSchema";
import { ParseSchemaRTE } from "./ParseSchemaRTE";
import { readGeneratedModelsRef } from "./generatedModels";
import {
  modifyCurrentDocumentUri,
  readCurrentDocumentUri,
} from "../ParseSchemaContext";
import { getAbsoluteFileName } from "../JsonReference";

export function parseJsonReference(pointer: string): ParseSchemaRTE {
  return pipe(
    getParsedReference(pointer),
    RTE.chainW(
      O.fold(
        () => parseNewReference(pointer),
        (r) => RTE.right(r)
      )
    )
  );
}

function getParsedReference(
  pointer: string
): ParseSchemaRTE<O.Option<gen.TypeReference>, never> {
  return pipe(
    readGeneratedModelsRef(),
    RTE.map((currentRes) =>
      pipe(
        currentRes.pointerModelNameMap[pointer],
        O.fromNullable,
        O.map((name) => gen.identifier(name))
      )
    )
  );
}

/**
 * Parse a new ref. If the ref was added to generated model, returns the model name.
 * Otherwise it returns the parsed schema.
 *
 * @param pointer JSON pointer of the reference to add
 * @returns the new parsed reference
 */
function parseNewReference(pointer: string): ParseSchemaRTE {
  return pipe(
    RTE.Do,
    RTE.bind("resolvedPointerAndDocumentUri", () =>
      getResolvedPointerAndDocumentUri(pointer)
    ),
    RTE.bind("parsedSchema", ({ resolvedPointerAndDocumentUri }) =>
      setCurrentDocumentUriAndParseSchema(resolvedPointerAndDocumentUri)
    ),
    RTE.bindW("reference", () => getParsedReference(pointer)),
    RTE.map(({ parsedSchema, reference }) =>
      pipe(
        reference,
        O.fold(
          () => parsedSchema,
          (ref) => ref
        )
      )
    )
  );
}

interface ResolvedPointerAndDocumentUri {
  resolvedPointer: string;
  documentUri: O.Option<string>;
}

function setCurrentDocumentUriAndParseSchema({
  resolvedPointer,
  documentUri,
}: ResolvedPointerAndDocumentUri): ParseSchemaRTE {
  return pipe(
    modifyCurrentDocumentUri(documentUri),
    RTE.chainW(() => parseSchema(resolvedPointer, true)),
    RTE.chainFirstW(() => modifyCurrentDocumentUri(O.none))
  );
}

function getResolvedPointerAndDocumentUri(
  pointer: string
): ParseSchemaRTE<ResolvedPointerAndDocumentUri, never> {
  if (pointer.startsWith("./")) {
    const hashIndex = pointer.indexOf("#");
    const fileName = pointer.substring(
      0,
      hashIndex === -1 ? undefined : hashIndex
    );
    const resolvedPointer =
      hashIndex === -1 ? "#" : pointer.replace(fileName, "");

    return pipe(
      readCurrentDocumentUri(),
      RTE.map((currentDocumentUri) => {
        const res: ResolvedPointerAndDocumentUri = {
          resolvedPointer,
          documentUri: O.some(
            getAbsoluteFileName(currentDocumentUri, `${fileName}`)
          ),
        };
        return res;
      })
    );
  }

  return pipe(
    readCurrentDocumentUri(),
    RTE.map(
      (documentUri): ResolvedPointerAndDocumentUri => ({
        resolvedPointer: pointer,
        documentUri: O.some(documentUri),
      })
    )
  );
}
