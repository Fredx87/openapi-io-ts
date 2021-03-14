import { printRuntime, printStatic, TypeDeclaration } from "io-ts-codegen";

export function generateSchema(declaration: TypeDeclaration): string {
  return `${printRuntime(declaration)}
    ${printStatic(declaration)}`;
}
