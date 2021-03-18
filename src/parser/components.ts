import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { JsonPointer, JsonReference } from "../common/JSONReference";
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
  const pointer = new JsonPointer(["#", "components"]);

  const tasks: ParserRTE<void>[] = [];

  const { schemas, parameters, requestBodies, responses } = components;

  if (schemas) {
    tasks.push(parseAllSchemas(pointer, schemas));
  }

  if (parameters) {
    tasks.push(parseAllParameters(pointer, parameters));
  }

  if (requestBodies) {
    tasks.push(parseAllBodies(pointer, requestBodies));
  }

  if (responses) {
    tasks.push(parseAllResponses(pointer, responses));
  }

  return tasks;
}

function parseAllSchemas(
  componentsPointer: JsonPointer,
  schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): ParserRTE<void> {
  const tasks: ParserRTE<void>[] = Object.entries(schemas).map(
    ([name, schema]) => {
      const pointer = componentsPointer.concat(["schemas", name]);

      return pipe(
        createSchemaComponent(name, schema),
        RTE.fromEither,
        RTE.chain((component) =>
          modifyParserOutput((draft) => {
            draft.components.schemas[pointer.toString()] = component;
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
  componentsPointer: JsonPointer,
  parameters: Record<
    string,
    OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject
  >
): ParserRTE<void> {
  const pointer = componentsPointer.concat(["parameters"]);

  return pipe(
    Object.entries(parameters),
    A.map(([name, param]) => parseParameterComponent(pointer, name, param)),
    RTE.sequenceSeqArray,
    RTE.map(() => {})
  );
}

function parseParameterComponent(
  parametersPointer: JsonPointer,
  name: string,
  parameter: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject
): ParserRTE<void> {
  if (JsonReference.is(parameter)) {
    return RTE.left(new Error("Found $ref in components/parameter"));
  }

  const pointer = parametersPointer.concat([name]);

  return pipe(
    parseParameterObject(parameter),
    RTE.map((object) => genericComponent(name, object.value)),
    RTE.chain((parsedComponent) =>
      modifyParserOutput((draft) => {
        draft.components.parameters[pointer.toString()] = parsedComponent;
      })
    )
  );
}

function parseAllBodies(
  componentsPointer: JsonPointer,
  bodies: Record<
    string,
    OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject
  >
): ParserRTE<void> {
  const pointer = componentsPointer.concat(["requestBodies"]);

  return pipe(
    Object.entries(bodies),
    A.map(([name, body]) => parseBodyComponent(pointer, name, body)),
    RTE.sequenceSeqArray,
    RTE.map(() => {})
  );
}

function parseBodyComponent(
  bodiesPointer: JsonPointer,
  name: string,
  body: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject
): ParserRTE<void> {
  if (JsonReference.is(body)) {
    return RTE.left(new Error("Found $ref in components/requestBodies"));
  }

  const pointer = bodiesPointer.concat([name]);

  return pipe(
    parseBodyObject(name, body),
    RTE.map((object) => genericComponent(name, object.value)),
    RTE.chain((parsedComponent) =>
      modifyParserOutput((draft) => {
        draft.components.bodies[pointer.toString()] = parsedComponent;
      })
    )
  );
}

function parseAllResponses(
  componentsPointer: JsonPointer,
  responses: Record<
    string,
    OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject
  >
): ParserRTE<void> {
  const pointer = componentsPointer.concat(["responses"]);

  return pipe(
    Object.entries(responses),
    A.map(([name, response]) =>
      parseResponseComponent(pointer, name, response)
    ),
    RTE.sequenceSeqArray,
    RTE.map(() => {})
  );
}

function parseResponseComponent(
  responsesPointer: JsonPointer,
  name: string,
  response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject
): ParserRTE<void> {
  if (JsonReference.is(response)) {
    return RTE.left(new Error("Found $ref in components/responses"));
  }

  const pointer = responsesPointer.concat([name]);

  return pipe(
    parseResponseObject(name, response),
    RTE.map((object) => genericComponent(name, object.value)),
    RTE.chain((parsedComponent) =>
      modifyParserOutput((draft) => {
        draft.components.responses[pointer.toString()] = parsedComponent;
      })
    )
  );
}
