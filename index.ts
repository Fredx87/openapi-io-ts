import * as gen from "io-ts-codegen";
import orderSchema from "./orderSchema.json";
import { parseOpen } from './parser';

export type StringSchema = { type: "string"; enum?: string[]; format?: string };

export interface NumberSchema {
  type: "number" | "integer";
}

export interface BooleanSchema {
  type: "boolean";
}

export interface ObjectSchema {
  type: "object";
  properties: {
    [key: string]: JSONSchema;
  };
  required?: Array<string>;
}

export type JSONSchema =
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | ObjectSchema;

function getRequiredProperties(schema: ObjectSchema): { [key: string]: true } {
  const required: { [key: string]: true } = {};
  if (schema.required) {
    schema.required.forEach(function(k) {
      required[k] = true;
    });
  }
  return required;
}

function toInterfaceCombinator(schema: ObjectSchema): gen.InterfaceCombinator {
  const required = getRequiredProperties(schema);
  return gen.interfaceCombinator(
    Object.keys(schema.properties).map(key =>
      gen.property(
        key,
        to(schema.properties[key]),
        !required.hasOwnProperty(key)
      )
    )
  );
}

export function to(schema: JSONSchema): gen.TypeReference {
  switch (schema.type) {
    case "string":
      if (schema.format === "date-time") {
        return gen.identifier("DateFromISOString");
      } else if (schema.enum) {
        return gen.unionCombinator(
          schema.enum.map(e => gen.literalCombinator(e))
        );
      } else {
        return gen.stringType;
      }
    case "number":
    case "integer":
      return gen.numberType;
    case "boolean":
      return gen.booleanType;
    case "object":
      return toInterfaceCombinator(schema);
  }
}

const RuntimeType = gen.printRuntime(to(orderSchema as JSONSchema));
const StaticType = gen.printStatic(to(orderSchema as JSONSchema));

console.log(RuntimeType);
console.log(StaticType);

parseOpen();
