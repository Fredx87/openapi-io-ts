import * as O from "fp-ts/Option";
import {
  camelCase,
  JsonReference,
  ModelGenerationInfo,
  ParseSchemaContext,
} from "json-schema-io-ts";
import {
  getDefaultModelGenerationInfo,
  getModelGenerationInfoForComponent,
  getModelGenerationInfoForExternalItem,
  getOperationIdFromReference,
} from "./common";

export function parsedItemModelGenerationInfo(
  jsonReference: JsonReference,
  parseSchemaContext: ParseSchemaContext
): O.Option<ModelGenerationInfo> {
  const isRootItem = jsonReference.uri === parseSchemaContext.rootDocumentUri;

  return isRootItem
    ? getModelGenerationInfoForRootItem(jsonReference, parseSchemaContext)
    : O.some(getModelGenerationInfoForExternalItem(jsonReference));
}

function getModelGenerationInfoForRootItem(
  jsonReference: JsonReference,
  parseSchemaContext: ParseSchemaContext
): O.Option<ModelGenerationInfo> {
  if (jsonReference.jsonPointer[0] === "components") {
    return O.some(getModelGenerationInfoForComponent(jsonReference));
  }

  if (jsonReference.jsonPointer[0] === "paths") {
    return getModelGenerationInfoForOperation(
      jsonReference,
      parseSchemaContext
    );
  }

  return O.some(getDefaultModelGenerationInfo(jsonReference));
}

function getModelGenerationInfoForOperation(
  jsonReference: JsonReference,
  parseSchemaContext: ParseSchemaContext
): O.Option<ModelGenerationInfo> {
  const { jsonPointer } = jsonReference;
  const operationId = getOperationIdFromReference(
    jsonReference,
    parseSchemaContext
  );

  if (jsonPointer.length === 3) {
    return O.some({
      name: operationId,
      filePath: `operations/${camelCase(operationId)}.ts`,
    });
  }

  return O.none;
}
