import * as E from "fp-ts/Either";
import { Operation } from "../model";
import { prepareRequest, PrepareRequestResult } from "./prepareRequest";
import { getUserOperationBase } from "./__fixtures__/baseOperations";

describe("prepareRequest", () => {
  it("should correctly prepare a request with path, query and headers parameters", async () => {
    const getUserOperation: Operation = {
      ...getUserOperationBase,
      parameters: [
        {
          _tag: "FormParameter",
          explode: false,
          in: "path",
          name: "username",
        },
        {
          _tag: "FormParameter",
          explode: false,
          in: "query",
          name: "showDetails",
        },
        {
          _tag: "FormParameter",
          explode: false,
          in: "header",
          name: "api-key",
        },
      ],
    } as const;

    const requestParameters = {
      username: "john.doe",
      showDetails: true,
      "api-key": "ABC-123",
    };

    const expected: PrepareRequestResult = {
      url: "/users/john.doe/?showDetails=true",
      init: {
        method: "get",
        headers: {
          Accept: "application/json",
          "api-key": "ABC-123",
        },
        body: null,
      },
    };

    const result = await prepareRequest(
      getUserOperation,
      requestParameters,
      undefined
    )();

    expect(result).toEqual(E.right(expected));
  });
});
