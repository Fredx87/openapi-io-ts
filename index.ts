#!/usr/bin/env node

const argv = require("yargs")
  .usage("Usage: $0 [options]")
  .example(
    "$0 -i petstore.yaml",
    "Generates io-ts files from the schema given in input"
  )
  .options({
    input: {
      alias: "i",
      demandOption: true,
      description: "JsonSchema file to parse"
    },
    output: {
      alias: "o",
      demandOption: true,
      description: "Output directory",
      default: "api"
    }
  }).argv;
