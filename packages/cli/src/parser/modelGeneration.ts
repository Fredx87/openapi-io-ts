import {
  camelCase,
  JsonReference,
  ModelGenerationInfo,
  ModelGenerationInfoFn,
  ParseSchemaContext,
  pascalCase,
} from "json-schema-io-ts";

export const modelGenerationInfoFn: ModelGenerationInfoFn = (
  jsonReference,
  parseSchemaContext
) => {
  const isRootItem = jsonReference.uri === parseSchemaContext.rootDocumentUri;

  return isRootItem
    ? getModelGenerationInfoForRootItem(jsonReference, parseSchemaContext)
    : getModelGenerationInfoForExternalItem(jsonReference, parseSchemaContext);
};

function getModelGenerationInfoForRootItem(
  jsonReference: JsonReference,
  parseSchemaContext: ParseSchemaContext
): ModelGenerationInfo {
  if (jsonReference.jsonPointer[0] === "components") {
    return getModelGenerationInfoForComponent(
      jsonReference,
      parseSchemaContext
    );
  }

  if (jsonReference.jsonPointer[0] === "paths") {
    return getModelGenerationInfoForOperation(
      jsonReference,
      parseSchemaContext
    );
  }

  return getDefaultModelGenerationInfo(jsonReference, parseSchemaContext);
}

function getModelGenerationInfoForComponent(
  jsonReference: JsonReference,
  parseSchemaContext: ParseSchemaContext
): ModelGenerationInfo {
  const { jsonPointer } = jsonReference;

  if (jsonPointer.length < 3) {
    return getDefaultModelGenerationInfo(jsonReference, parseSchemaContext);
  }

  const componentName = camelCase(jsonPointer[2]);

  if (jsonPointer.length === 3) {
    return {
      name: pascalCase(componentName),
      filePath: `${jsonPointer[0]}/${jsonPointer[1]}/${componentName}.ts`,
    };
  }
}

// function getModelGenerationInfoForOperation(
//   jsonReference: JsonReference,
//   parseSchemaContext: ParseSchemaContext
// ): ModelGenerationInfo {}

// function getModelGenerationInfoForExternalItem(
//   { jsonPointer }: JsonReference,
//   parseSchemaContext: ParseSchemaContext
// ): ModelGenerationInfo {}

// function getDefaultModelGenerationInfo(
//   jsonReference: JsonReference,
//   parseSchemaContext: ParseSchemaContext
// ): ModelGenerationInfo {}
