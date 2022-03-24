import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  camelCase,
  JsonReference,
  ModelGenerationInfo,
  ParseSchemaContext,
  pascalCase,
  resolveReference,
} from "json-schema-io-ts";
import { OpenAPIV3_1 } from "openapi-types";
import { basename, extname } from "path";

export function getModelGenerationInfoForComponent(
  jsonReference: JsonReference
): ModelGenerationInfo {
  const { jsonPointer } = jsonReference;

  if (jsonPointer.length < 3) {
    return getDefaultModelGenerationInfo(jsonReference);
  }

  const name = `${pascalCase(jsonPointer[2])}${getComponentSuffix(
    jsonPointer[1] as keyof OpenAPIV3_1.ComponentsObject
  )}`;
  const filePath = `${jsonPointer[0]}/${jsonPointer[1]}/${name}.ts`;

  if (jsonPointer.length === 3) {
    return {
      name,
      filePath,
    };
  }

  if (jsonPointer[jsonPointer.length - 1] === "schema") {
    return {
      name: `${name}Schema`,
      filePath,
    };
  }

  return getDefaultModelGenerationInfo(jsonReference);
}

export function getDefaultModelGenerationInfo({
  jsonPointer,
}: JsonReference): ModelGenerationInfo {
  const name = pascalCase(jsonPointer.join("/"));
  return {
    name,
    filePath: `others/${name}.ts`,
  };
}

export function getOperationIdFromReference(
  { uri, jsonPointer }: JsonReference,
  parseSchemaContext: ParseSchemaContext
): string {
  const { uriDocumentMap } = parseSchemaContext;

  if (jsonPointer.length < 3) {
    return "Unknown";
  }

  const operationIdReference: JsonReference = {
    uri,
    jsonPointer: [
      jsonPointer[0],
      jsonPointer[1],
      jsonPointer[2],
      "operationId",
    ],
  };

  return pipe(
    resolveReference<string>(uriDocumentMap, operationIdReference),
    O.getOrElse(() => `${jsonPointer[1]}/${jsonPointer[2]}`),
    pascalCase
  );
}

export function getModelGenerationInfoForExternalItem({
  uri,
  jsonPointer,
}: JsonReference): ModelGenerationInfo {
  const documentName = getDocumentNameFromUri(uri);
  const basePath = `externals/${documentName}`;

  if (jsonPointer.length === 0) {
    return {
      name: pascalCase(documentName),
      filePath: `${basePath}/${pascalCase(documentName)}.ts`,
    };
  }

  const modelName = jsonPointer[jsonPointer.length - 1];
  return {
    name: pascalCase(modelName),
    filePath: `${basePath}/${pascalCase(modelName)}.ts`,
  };
}

export function getDocumentNameFromUri(uri: string): string {
  const ext = extname(uri);
  const fileName = basename(uri, ext);
  return camelCase(fileName);
}

function getComponentSuffix(
  componentType: keyof OpenAPIV3_1.ComponentsObject
): string {
  switch (componentType) {
    case "requestBodies": {
      return "RequestBody";
    }
    case "parameters": {
      return "Parameter";
    }
    case "responses": {
      return "Response";
    }
    default:
      return "";
  }
}
