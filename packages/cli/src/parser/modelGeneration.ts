import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  camelCase,
  JsonReference,
  ModelGenerationInfo,
  ModelGenerationInfoFn,
  ParseSchemaContext,
  pascalCase,
  resolveReference,
} from "json-schema-io-ts";
import { basename, extname } from "path";

export const modelGenerationInfoFn: ModelGenerationInfoFn = (
  jsonReference,
  parseSchemaContext
) => {
  const isRootItem = jsonReference.uri === parseSchemaContext.rootDocumentUri;

  return isRootItem
    ? getModelGenerationInfoForRootItem(jsonReference, parseSchemaContext)
    : getModelGenerationInfoForExternalItem(jsonReference);
};

function getModelGenerationInfoForRootItem(
  jsonReference: JsonReference,
  parseSchemaContext: ParseSchemaContext
): ModelGenerationInfo {
  if (jsonReference.jsonPointer[0] === "components") {
    return getModelGenerationInfoForComponent(jsonReference);
  }

  if (jsonReference.jsonPointer[0] === "paths") {
    return getModelGenerationInfoForOperation(
      jsonReference,
      parseSchemaContext
    );
  }

  return getDefaultModelGenerationInfo(jsonReference);
}

function getModelGenerationInfoForComponent(
  jsonReference: JsonReference
): ModelGenerationInfo {
  const { jsonPointer } = jsonReference;

  if (jsonPointer.length < 3) {
    return getDefaultModelGenerationInfo(jsonReference);
  }

  const name = pascalCase(jsonPointer[2]);
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

function getModelGenerationInfoForOperation(
  jsonReference: JsonReference,
  parseSchemaContext: ParseSchemaContext
): ModelGenerationInfo {
  const { jsonPointer } = jsonReference;
  const operationId = getOperationIdFromReference(
    jsonReference,
    parseSchemaContext
  );

  const filePath = `operations/${operationId}.ts`;

  if (jsonPointer.length === 3) {
    return {
      name: operationId,
      filePath,
    };
  }

  if (jsonPointer.length === 6 && jsonPointer[3] === "parameters") {
    return {
      name: `${operationId}Parameter${jsonPointer[4]}Schema`,
    };
  }

  if (jsonPointer.length === 7 && jsonPointer[3] === "requestBody") {
    return {
      name: `${operationId}RequestBodySchema`,
    };
  }

  if (jsonPointer.length === 8 && jsonPointer[3] === "responses") {
    return {
      name: `${operationId}Response${jsonPointer[4]}Schema`,
    };
  }

  return getDefaultModelGenerationInfo(jsonReference);
}

function getOperationIdFromReference(
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

function getModelGenerationInfoForExternalItem({
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

function getDocumentNameFromUri(uri: string): string {
  const ext = extname(uri);
  const fileName = basename(uri, ext);
  return camelCase(fileName);
}

function getDefaultModelGenerationInfo({
  jsonPointer,
}: JsonReference): ModelGenerationInfo {
  const name = pascalCase(jsonPointer.join("/"));
  return {
    name,
    filePath: `others/${name}.ts`,
  };
}
