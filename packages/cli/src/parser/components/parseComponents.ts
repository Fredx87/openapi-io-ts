import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import {
  concatJsonReference,
  JsonReference,
  jsonReferenceToString,
  parseSchema,
} from "json-schema-io-ts";
import { OpenAPIV3_1 } from "openapi-types";
import { parseBodyFromReference } from "../body";
import { ParserContext, ParserRTE } from "../context";
import { parseParameterFromReference } from "../parameter";
import { parseResponseFromReference } from "../response";

export function parseAllComponents(): ParserRTE<void> {
  return pipe(
    RTE.ask<ParserContext>(),
    RTE.chain((context) => {
      const { components } = context.document;
      const { rootDocumentUri } = context.parseSchemaContext;

      const tasks: ParserRTE<void>[] = components
        ? createTasks(components, rootDocumentUri)
        : [];
      return pipe(
        RTE.sequenceSeqArray(tasks),
        RTE.map(() => void 0)
      );
    })
  );
}

function createTasks(
  components: OpenAPIV3_1.ComponentsObject,
  rootDocumentUri: string
): ParserRTE<void>[] {
  const jsonReference: JsonReference = {
    uri: rootDocumentUri,
    jsonPointer: ["components"],
  };

  const tasks: ParserRTE<void>[] = [];

  const { schemas, parameters, requestBodies, responses } = components;

  if (schemas) {
    tasks.push(
      parseAllSchemas(concatJsonReference(jsonReference, ["schemas"]), schemas)
    );
  }

  if (parameters) {
    tasks.push(
      parseAllParameters(
        concatJsonReference(jsonReference, ["parameters"]),
        parameters
      )
    );
  }

  if (requestBodies) {
    tasks.push(
      parseAllBodies(
        concatJsonReference(jsonReference, ["requestBodies"]),
        requestBodies
      )
    );
  }

  if (responses) {
    tasks.push(
      parseAllResponses(
        concatJsonReference(jsonReference, ["responses"]),
        responses
      )
    );
  }

  return tasks;
}

function parseAllSchemas(
  jsonReference: JsonReference,
  schemas: Record<string, unknown>
): ParserRTE<void> {
  return pipe(
    Object.keys(schemas),
    RTE.traverseSeqArray((key) => {
      const schemaReference = concatJsonReference(jsonReference, [key]);
      return parseComponentSchema(schemaReference);
    }),
    RTE.map(() => void 0)
  );
}

function parseComponentSchema(jsonReference: JsonReference): ParserRTE<void> {
  return pipe(
    RTE.asks((c: ParserContext) => c.parseSchemaContext),
    RTE.chainW((parseSchemaContext) =>
      pipe(
        parseSchema(jsonReferenceToString(jsonReference))(parseSchemaContext),
        RTE.fromTaskEither
      )
    ),
    RTE.map(() => void 0)
  );
}

function parseAllParameters(
  jsonReference: JsonReference,
  parameters: Record<string, unknown>
): ParserRTE<void> {
  return pipe(
    Object.keys(parameters),
    RTE.traverseSeqArray((key) =>
      parseParameterFromReference(concatJsonReference(jsonReference, [key]))
    ),
    RTE.map(() => void 0)
  );
}

function parseAllBodies(
  jsonReference: JsonReference,
  bodies: Record<string, unknown>
): ParserRTE<void> {
  return pipe(
    Object.keys(bodies),
    RTE.traverseSeqArray((key) =>
      parseBodyFromReference(concatJsonReference(jsonReference, [key]))
    ),
    RTE.map(() => void 0)
  );
}

function parseAllResponses(
  jsonReference: JsonReference,
  responses: Record<string, unknown>
): ParserRTE<void> {
  return pipe(
    Object.keys(responses),
    RTE.traverseSeqArray((key) =>
      parseResponseFromReference(concatJsonReference(jsonReference, [key]))
    ),
    RTE.map(() => void 0)
  );
}
