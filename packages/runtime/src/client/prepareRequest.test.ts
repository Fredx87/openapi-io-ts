/**
 * @jest-environment jsdom
 */

import * as E from "fp-ts/Either";
import { Operation } from "../model";
import { prepareRequest, PrepareRequestResult } from "./prepareRequest";
import {
  getArticlesOperationBase,
  getUserOperationBase,
  postOperationBase,
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
      url: "/users/john.doe?showDetails=true",
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

  it("should support optional parameter", () => {
    const getArticlesOperation: Operation = {
      ...getArticlesOperationBase,
      parameters: [
        ...getArticlesOperationBase.parameters,
        {
          _tag: "FormParameter",
          in: "query",
          explode: false,
          name: "search",
        },
      ],
    } as const;

    const expected: PrepareRequestResult = {
      url: getArticlesOperation.path,
      init: {
        method: "get",
        headers: {},
        body: null,
      },
    };

    const result = prepareRequest(getArticlesOperation, {}, undefined);

    expect(result).toEqual(E.right(expected));
  });

  it("should serialize a Date parameter", () => {
    const getArticlesOperation: Operation = {
      ...getArticlesOperationBase,
      parameters: [
        ...getArticlesOperationBase.parameters,
        {
          _tag: "FormParameter",
          in: "query",
          explode: false,
          name: "fromDate",
        },
      ],
    } as const;

    const fromDate = new Date(2022, 1, 2, 10, 0, 0, 0);

    const requestParameters = {
      fromDate,
    };

    const expected: PrepareRequestResult = {
      url: `${getArticlesOperation.path}?fromDate=${encodeURIComponent(
        fromDate.toISOString()
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
      url: `/users/foo?viewInfo=${encodeURIComponent(
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
      url: `${getArticlesOperation.path}?articleIds=${encodeURIComponent(
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
      url: `${getArticlesOperation.path}?articleIds=1&articleIds=2&articleIds=3`,
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

  it("should support unexploded object parameter", () => {
    const getArticlesOperation: Operation = {
      ...getArticlesOperationBase,
      parameters: [
        ...getArticlesOperationBase.parameters,
        {
          _tag: "FormParameter",
          in: "query",
          explode: false,
          name: "filter",
        },
      ],
    } as const;

    const requestParameters = {
      filter: { field: "date", dir: "asc" },
    };

    const expected: PrepareRequestResult = {
      url: `${getArticlesOperation.path}?filter=${encodeURIComponent(
        "field,date,dir,asc"
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

  it("should support exploded object parameter", () => {
    const getArticlesOperation: Operation = {
      ...getArticlesOperationBase,
      parameters: [
        ...getArticlesOperationBase.parameters,
        {
          _tag: "FormParameter",
          in: "query",
          explode: true,
          name: "filter",
        },
      ],
    } as const;

    const requestParameters = {
      filter: { field: "date", dir: "asc" },
    };

    const expected: PrepareRequestResult = {
      url: `${getArticlesOperation.path}?field=date&dir=asc`,
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

  it("should support text body", () => {
    const postOperation: Operation = {
      ...postOperationBase,
      body: { _tag: "TextBody" },
    };

    const body = "Request Body";

    const expected: PrepareRequestResult = {
      url: postOperation.path,
      init: {
        method: "post",
        headers: {},
        body,
      },
    };

    const result = prepareRequest(postOperation, {}, body);

    expect(result).toEqual(E.right(expected));
  });

  it("should support JSON body", () => {
    const postOperation: Operation = {
      ...postOperationBase,
      body: { _tag: "JsonBody" },
    };

    const body = { user: "john.doe", age: 35 };

    const expected: PrepareRequestResult = {
      url: postOperation.path,
      init: {
        method: "post",
        headers: {},
        body: JSON.stringify(body),
      },
    };

    const result = prepareRequest(postOperation, {}, body);

    expect(result).toEqual(E.right(expected));
  });

  it("should support form encoded body", () => {
    const postOperation: Operation = {
      ...postOperationBase,
      body: { _tag: "FormBody" },
    };

    const body = { user: "john.doe", age: 35 };

    const expected: PrepareRequestResult = {
      url: postOperation.path,
      init: {
        method: "post",
        headers: {},
        body: new URLSearchParams("user=john.doe&age=35"),
      },
    };

    const result = prepareRequest(postOperation, {}, body);

    expect(result).toEqual(E.right(expected));
  });

  it("should support multipart form body", () => {
    const postOperation: Operation = {
      ...postOperationBase,
      body: { _tag: "MultipartBody" },
    };

    const body = { user: "john.doe", age: 35 };

    const expectedBody = new FormData();
    expectedBody.append("user", "john.doe");
    expectedBody.append("age", "35");

    const expected: PrepareRequestResult = {
      url: postOperation.path,
      init: {
        method: "post",
        headers: {},
        body: expectedBody,
      },
    };

    const result = prepareRequest(postOperation, {}, body);

    expect(result).toEqual(E.right(expected));
  });

  it("should support binary body", () => {
    const postOperation: Operation = {
      ...postOperationBase,
      body: { _tag: "BinaryBody", mediaType: "text/string" },
    };

    const body = new Blob(["foo"]);

    const expected: PrepareRequestResult = {
      url: postOperation.path,
      init: {
        method: "post",
        headers: {},
        body,
      },
    };

    const result = prepareRequest(postOperation, {}, body);

    expect(result).toEqual(E.right(expected));
  });
});
