import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import orderSchema from "./orderSchema.json";
import { getSchemas } from "./parser";
import { parseSchema } from "./src/schema-parser";

const RuntimeType = gen.printRuntime(
  parseSchema(orderSchema as OpenAPIV3.SchemaObject)
);
const StaticType = gen.printStatic(
  parseSchema(orderSchema as OpenAPIV3.SchemaObject)
);

console.log(RuntimeType);
console.log(StaticType);

getSchemas("./openapi.json").then(schemas => {
  console.log(schemas);
});
