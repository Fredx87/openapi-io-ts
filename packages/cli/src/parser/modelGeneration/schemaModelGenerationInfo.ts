import {
  JsonReference,
  ModelGenerationInfo,
  ModelGenerationInfoFn,
  ParseSchemaContext,
} from "json-schema-io-ts";
import {
  getDefaultModelGenerationInfo,
  getModelGenerationInfoForComponent,
  getModelGenerationInfoForExternalItem,
  getOperationIdFromReference,
} from "./common";

export const schemaModelGenerationInfo: ModelGenerationInfoFn = (
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

function getModelGenerationInfoForOperation(
  jsonReference: JsonReference,
  parseSchemaContext: ParseSchemaContext
): ModelGenerationInfo {
  const { jsonPointer } = jsonReference;
  const operationId = getOperationIdFromReference(
    jsonReference,
    parseSchemaContext
  );

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
