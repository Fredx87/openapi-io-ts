import { OpenAPIV3 } from "openapi-types";
import SwaggerParser from "swagger-parser";

export const getSchemas = async (
  jsonFile: string
): Promise<Record<
  string,
  OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
>> => {
  const doc = await SwaggerParser.bundle(jsonFile);

  // TODO Fix me please :(
  return (doc as OpenAPIV3.Document).components!.schemas!;
};
