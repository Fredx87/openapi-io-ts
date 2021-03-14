import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { JsonReference } from "../common/JSONReference";
import {
  ComponentRef,
  getComponentRef,
  getOrCreateType,
  inlineObject,
  InlineObject,
  JSON_MEDIA_TYPE,
} from "./common";
import { ParserRTE } from "./context";

interface BaseParsedBody {
  required: boolean;
}

interface ParsedJsonBody extends BaseParsedBody {
  _tag: "JsonBody";
  type: gen.TypeDeclaration | gen.TypeReference;
}

interface ParsedTextBody extends BaseParsedBody {
  _tag: "TextBody";
}

export type ParsedBodyObject = ParsedJsonBody | ParsedTextBody;

export type ParsedBody =
  | ComponentRef<"bodies">
  | InlineObject<ParsedBodyObject>;

export function parseBody(
  name: string,
  body: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject
): ParserRTE<ParsedBody> {
  if (JsonReference.is(body)) {
    return getComponentRef("bodies", body.$ref);
  }

  return parseBodyObject(name, body);
}

export function parseBodyObject(
  name: string,
  body: OpenAPIV3.RequestBodyObject
): ParserRTE<InlineObject<ParsedBodyObject>> {
  const { content } = body;
  const required = body.required ?? false;

  const jsonSchema = content?.[JSON_MEDIA_TYPE]?.schema;

  if (jsonSchema == null) {
    const parsedBody: ParsedTextBody = {
      _tag: "TextBody",
      required,
    };
    return RTE.right(inlineObject(parsedBody));
  } else {
    return pipe(
      getOrCreateType(name, jsonSchema),
      RTE.map((type) => {
        const parsedBody: ParsedJsonBody = {
          _tag: "JsonBody",
          type,
          required,
        };
        return inlineObject(parsedBody);
      })
    );
  }
}
