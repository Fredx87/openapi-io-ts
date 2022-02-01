import * as E from "fp-ts/Either";
import { Operation } from "../model";
import { prepareRequest, PrepareRequestResult } from "./prepareRequest";
import {
  getArticlesOperationBase,
  getUserOperationBase,
} from "./__fixtures__/baseOperations";

describe("prepareRequest", () => {
  it("should support simple request", () => {
    const expected: PrepareRequestResult = {
      url: getArticlesOperationBase.path,
      init: {
        method: "get",
        body: null,
        headers: {},
      },
    };

    const result = prepareRequest(getArticlesOperationBase, {}, undefined);
    expect(result).toEqual(E.right(expected));
  });

  it("should support basic path, query and header parameters", () => {
    const getUserOperation: Operation = {
      ...getUserOperationBase,
      parameters: [
        ...getUserOperationBase.parameters,
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

    const result = prepareRequest(
      getUserOperation,
      requestParameters,
      undefined
    );

    expect(result).toEqual(E.right(expected));
  });

  it("should support JSON parameter", () => {
    const getUserOperation: Operation = {
      ...getUserOperationBase,
      parameters: [
        ...getUserOperationBase.parameters,
        {
          _tag: "JsonParameter",
          in: "query",
          name: "viewInfo",
        },
      ],
    } as const;

    const requestParameters = {
      username: "foo",
      viewInfo: { showDetails: true, avatar: "large" },
    };

    const expected: PrepareRequestResult = {
      url: `/users/foo/?viewInfo=${encodeURIComponent(
        `{"showDetails":true,"avatar":"large"}`
      )}`,
      init: {
        method: "get",
        headers: { Accept: "application/json" },
        body: null,
      },
    };

    const result = prepareRequest(
      getUserOperation,
      requestParameters,
      undefined
    );

    expect(result).toEqual(E.right(expected));
  });

  it("should support unexploded array parameter", () => {
    const getArticlesOperation: Operation = {
      ...getArticlesOperationBase,
      parameters: [
        ...getArticlesOperationBase.parameters,
        {
          _tag: "FormParameter",
          in: "query",
          explode: false,
          name: "articleIds",
        },
      ],
    } as const;

    const requestParameters = {
      articleIds: ["1", "2", "3"],
    };

    const expected: PrepareRequestResult = {
      url: `${getArticlesOperation.path}/?articleIds=${encodeURIComponent(
        "1,2,3"
      )}`,
      init: {
        method: "get",
        headers: {},
        body: null,
      },
    };

    const result = prepareRequest(
      getArticlesOperation,
      requestParameters,
      undefined
    );

    expect(result).toEqual(E.right(expected));
  });

  it("should support exploded array parameter", () => {
    const getArticlesOperation: Operation = {
      ...getArticlesOperationBase,
      parameters: [
        ...getArticlesOperationBase.parameters,
        {
          _tag: "FormParameter",
          in: "query",
          explode: true,
          name: "articleIds",
        },
      ],
    } as const;

    const requestParameters = {
      articleIds: ["1", "2", "3"],
    };

    const expected: PrepareRequestResult = {
      url: `${getArticlesOperation.path}/?articleIds=1&articleIds=2&articleIds=3`,
      init: {
        method: "get",
        headers: {},
        body: null,
      },
    };

    const result = prepareRequest(
      getArticlesOperation,
      requestParameters,
      undefined
    );

    expect(result).toEqual(E.right(expected));
  });
});
