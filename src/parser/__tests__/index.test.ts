import { newIORef } from "fp-ts/IORef";
import * as TE from "fp-ts/TaskEither";
// import { promises } from "fs";
import { OpenAPI } from "openapi-types";
import { parse } from "..";
import { Environment } from "../../environment";
import { parserState } from "../parserState";
import petStore from "./__fixtures__/pet-store.json";

describe("OpenAPI parser", () => {
  test("petstore parser", async () => {
    const env: Environment = {
      parseDocument: () => TE.right(petStore as OpenAPI.Document),
      inputFile: "",
      outputDir: "",
      parserState: newIORef(parserState())(),
    };

    await parse()(env)();

    const result = env.parserState.read();

    // await promises.writeFile(
    //   `${__dirname}/../../templates/__fixtures__/pet-store-state.json`,
    //   JSON.stringify(result)
    // );

    expect(result).toMatchSnapshot();
  });
});
