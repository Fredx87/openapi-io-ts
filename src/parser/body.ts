import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { JsonReference } from "../common/JSONReference";
import {
  createComponentRef,
  getOrCreateType,
  parsedItem,
  ParsedItem,
  JSON_MEDIA_TYPE,
  ComponentRef,
} from "./common";
import { ParserRTE } from "./context";

interface BaseParsedBody {
  required: boolean;
}

export interface ParsedJsonBody extends BaseParsedBody {
  _tag: "JsonBody";
  type: gen.TypeDeclaration | gen.TypeReference;
}

export interface ParsedTextBody extends BaseParsedBody {
  _tag: "TextBody";
}

export type ParsedBody = ParsedJsonBody | ParsedTextBody;

export type BodyItemOrRef =
  | ParsedItem<ParsedBody>
  | ComponentRef<"requestBodies">;

export function parseBody(
  name: string,
  body: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject
): ParserRTE<BodyItemOrRef> {
  if (JsonReference.is(body)) {
    return RTE.fromEither(createComponentRef("requestBodies", body.$ref));
  }

  return parseBodyObject(name, body);
}

export function parseBodyObject(
  name: string,
  body: OpenAPIV3.RequestBodyObject
): ParserRTE<ParsedItem<ParsedBody>> {
  const { content } = body;
  const required = body.required ?? false;

  const jsonSchema = content?.[JSON_MEDIA_TYPE]?.schema;

  if (jsonSchema == null) {
    const parsedBody: ParsedTextBody = {
      _tag: "TextBody",
      required,
    };
    return RTE.right(parsedItem(parsedBody, name));
  } else {
    return pipe(
      getOrCreateType(name, jsonSchema),
      RTE.map((type) => {
        const parsedBody: ParsedJsonBody = {
          _tag: "JsonBody",
          type,
          required,
        };
        return parsedItem(parsedBody, name);
      })
    );
  }
}
