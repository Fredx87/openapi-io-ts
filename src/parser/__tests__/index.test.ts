import { newIORef } from "fp-ts/lib/IORef";
import * as TE from "fp-ts/lib/TaskEither";
import { OpenAPI } from "openapi-types";
import { parse } from "..";
import { Environment } from "../../environment";
import { parserState } from "../parserState";
import petStore from "./fixtures/pet-store.json";

describe("OpenAPI parser", () => {
  test("petstore parser", async () => {
    const env: Environment = {
      parseDocument: () => TE.right(petStore as OpenAPI.Document),
      inputFile: "",
      outputDir: "",
      parserState: newIORef(parserState())()
    };

    await parse()(env)();

    const result = env.parserState.read();

    expect(result).toMatchSnapshot();
  });
});
