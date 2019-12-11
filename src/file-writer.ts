import { writeFileSync } from "fs";
import * as gen from "io-ts-codegen";
import * as prettier from "prettier";
import { ParserContext } from "./parser";

function getModelFileName(name: string, context: ParserContext): string {
  return `${context.outputDir}/models/${name}.ts`;
}

function getIoTsTypesImportString(name: string): string {
  return `import { ${name} } from "io-ts-types/lib/${name}";`;
}

function getModelImportString(name: string, path: string): string {
  return `import { ${name} } from "${path}/${name}";`;
}

function getModelImports(deps: string[], modelsPath: string): string {
  const ioTsTypes = ["DateFromISOString"];
  const ioTsTypesImports = deps
    .filter(d => ioTsTypes.includes(d))
    .map(getIoTsTypesImportString)
    .join("\n");
  const otherImports = deps
    .filter(d => !ioTsTypes.includes(d))
    .map(d => getModelImportString(d, modelsPath))
    .join("\n");
  return `import * as t from "io-ts";
    ${ioTsTypesImports}
    ${otherImports}`;
}

export function writeModels(context: ParserContext): void {
  for (const [name, model] of Object.entries(
    context.generatedModels.namesMap
  )) {
    const fileName = getModelFileName(name, context);
    const content = `${getModelImports(gen.getNodeDependencies(model), ".")}
  
      ${gen.printRuntime(model)}
      
      export type ${name} = t.TypeOf<typeof ${name}>;`;

    const formatted = prettier.format(content, { parser: "typescript" });

    writeFileSync(fileName, formatted);
  }
}
