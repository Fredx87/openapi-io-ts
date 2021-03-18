#!/usr/bin/env node

import * as yargs from "yargs";
import { generate } from ".";

const argv = yargs
  .usage("Usage: $0 [options]")
  .example(
    "$0 -i ./petstore.yaml",
    "Generates io-ts files from the schema given in input"
  )
  .options({
    input: {
      alias: "i",
      demandOption: true,
      description: "OpenAPI file to parse",
    },
    output: {
      alias: "o",
      demandOption: true,
      description: "Output directory",
      default: "./out",
    },
  }).argv;

generate(argv.input as string, argv.output);