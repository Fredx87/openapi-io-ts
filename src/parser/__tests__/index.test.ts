import { newIORef } from "fp-ts/IORef";
import * as TE from "fp-ts/TaskEither";
// import { promises } from "fs";
import { OpenAPI } from "openapi-types";
import { parseOpenApiDocument } from "..";
import { ParserContext } from "../context";
import { parserState } from "../parserState";
import petStore from "./__fixtures__/pet-store.json";

describe("OpenAPI parser", () => {
  test("petstore parser", async () => {
    const context: ParserContext = {
      parseDocument: () => TE.right(petStore as OpenAPI.Document),
      inputFile: "",
      outputDir: "",
      parserState: newIORef(parserState())(),
    };

    const result = await parseOpenApiDocument()(context)();

    // await promises.writeFile(
    //   `${__dirname}/../../templates/__fixtures__/pet-store-state.json`,
    //   JSON.stringify(result)
    // );

    expect(result).toMatchSnapshot();
  });
});
