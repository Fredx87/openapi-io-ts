import SwaggerParser from "swagger-parser";
import { OpenAPIV3 } from 'openapi-types';

export const parseOpen = () => 
    SwaggerParser.bundle('./openapi.json').then(res => {
        const doc = res as OpenAPIV3.Document;
        console.log(doc.components);
    });
