import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as NEA from "fp-ts/lib/NonEmptyArray";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { jsonPointer, JsonReference } from "../common/JSONReference";
import { parseBodyObject } from "./body";
import { genericComponent, schemaComponent, SchemaComponent } from "./common";
import { modifyParserOutput, ParserContext, ParserRTE } from "./context";
import { parseParameterObject } from "./parameter";
import { parseResponseObject } from "./response";
import { parseSchema } from "./schema";

export function parseAllComponents(): ParserRTE<void> {
  return pipe(
    RTE.asks((context: ParserContext) => context.document.components),
    RTE.chain((components) => {
      const tasks: ParserRTE<void>[] = components
        ? createTasks(components)
        : [];
      return pipe(
        RTE.sequenceSeqArray(tasks),
        RTE.map(() => {})
      );
    })
  );
}

function createTasks(
  components: OpenAPIV3.ComponentsObject
): ParserRTE<void>[] {
  const pointerTokens: NEA.NonEmptyArray<string> = ["components"];

  const tasks: ParserRTE<void>[] = [];

  const { schemas, parameters, requestBodies, responses } = components;

  if (schemas) {
    tasks.push(parseAllSchemas(pointerTokens, schemas));
  }

  if (parameters) {
    tasks.push(parseAllParameters(pointerTokens, parameters));
  }

  if (requestBodies) {
    tasks.push(parseAllBodies(pointerTokens, requestBodies));
  }

  if (responses) {
    tasks.push(parseAllResponses(pointerTokens, responses));
  }

  return tasks;
}

function parseAllSchemas(
  componentsPointerTokens: NEA.NonEmptyArray<string>,
  schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): ParserRTE<void> {
  const pointerTokens = NEA.concat(componentsPointerTokens, ["schemas"]);

  const tasks: ParserRTE<void>[] = Object.entries(schemas).map(
    ([name, schema]) => {
      const pointer = jsonPointer(NEA.concat(pointerTokens, [name]));

      return pipe(
        createSchemaComponent(name, schema),
        RTE.fromEither,
        RTE.chain((component) =>
          modifyParserOutput((draft) => {
            draft.components.schemas[pointer] = component;
          })
        )
      );
    }
  );

  return pipe(
    RTE.sequenceSeqArray(tasks),
    RTE.map(() => {})
  );
}

function createSchemaComponent(
  name: string,
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): E.Either<Error, SchemaComponent> {
  return pipe(
    parseSchema(schema),
    E.map((type) => schemaComponent(gen.typeDeclaration(name, type, true)))
  );
}

function parseAllParameters(
  componentsPointerTokens: NEA.NonEmptyArray<string>,
  parameters: Record<
    string,
    OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject
  >
): ParserRTE<void> {
  const pointerTokens = NEA.concat(componentsPointerTokens, ["parameters"]);

  return pipe(
    Object.entries(parameters),
    A.map(([name, param]) =>
      parseParameterComponent(pointerTokens, name, param)
    ),
    RTE.sequenceSeqArray,
    RTE.map(() => {})
  );
}

function parseParameterComponent(
  parametersPointerTokens: NEA.NonEmptyArray<string>,
  name: string,
  parameter: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject
): ParserRTE<void> {
  if (JsonReference.is(parameter)) {
    return RTE.left(new Error("Found $ref in components/parameter"));
  }

  const pointer = jsonPointer(NEA.concat(parametersPointerTokens, [name]));

  return pipe(
    parseParameterObject(parameter),
    RTE.map((object) => genericComponent(name, object.value)),
    RTE.chain((parsedComponent) =>
      modifyParserOutput((draft) => {
        draft.components.parameters[pointer] = parsedComponent;
      })
    )
  );
}

function parseAllBodies(
  componentsPointerTokens: NEA.NonEmptyArray<string>,
  bodies: Record<
    string,
    OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject
  >
): ParserRTE<void> {
  const pointerTokens = NEA.concat(componentsPointerTokens, ["requestBodies"]);

  return pipe(
    Object.entries(bodies),
    A.map(([name, body]) => parseBodyComponent(pointerTokens, name, body)),
    RTE.sequenceSeqArray,
    RTE.map(() => {})
  );
}

function parseBodyComponent(
  parentPointerTokens: NEA.NonEmptyArray<string>,
  name: string,
  body: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject
): ParserRTE<void> {
  if (JsonReference.is(body)) {
    return RTE.left(new Error("Found $ref in components/requestBodies"));
  }

  const pointer = jsonPointer(NEA.concat(parentPointerTokens, [name]));

  return pipe(
    parseBodyObject(name, body),
    RTE.map((object) => genericComponent(name, object.value)),
    RTE.chain((parsedComponent) =>
      modifyParserOutput((draft) => {
        draft.components.bodies[pointer] = parsedComponent;
      })
    )
  );
}

function parseAllResponses(
  componentsPointerTokens: NEA.NonEmptyArray<string>,
  responses: Record<
    string,
    OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject
  >
): ParserRTE<void> {
  const pointerTokens = NEA.concat(componentsPointerTokens, ["responses"]);

  return pipe(
    Object.entries(responses),
    A.map(([name, response]) =>
      parseResponseComponent(pointerTokens, name, response)
    ),
    RTE.sequenceSeqArray,
    RTE.map(() => {})
  );
}

function parseResponseComponent(
  parentPointerTokens: NEA.NonEmptyArray<string>,
  name: string,
  response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject
): ParserRTE<void> {
  if (JsonReference.is(response)) {
    return RTE.left(new Error("Found $ref in components/responses"));
  }

  const pointer = jsonPointer(NEA.concat(parentPointerTokens, [name]));

  return pipe(
    parseResponseObject(name, response),
    RTE.map((object) => genericComponent(name, object.value)),
    RTE.chain((parsedComponent) =>
      modifyParserOutput((draft) => {
        draft.components.responses[pointer] = parsedComponent;
      })
    )
  );
}
