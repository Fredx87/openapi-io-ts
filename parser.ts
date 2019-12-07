import SwaggerParser from "swagger-parser";
import { OpenAPIV3 } from 'openapi-types';
import { JSONSchema } from './index';

export const getSchemas = async (jsonFile: string): Promise<Record<string, JSONSchema>> => {

    const doc = await SwaggerParser.bundle(jsonFile);

    // TODO Fix me please :(
    return (doc as OpenAPIV3.Document).components!.schemas
}
