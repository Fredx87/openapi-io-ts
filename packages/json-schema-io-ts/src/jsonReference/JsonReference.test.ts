import {
  createJsonReference,
  JsonReference,
  jsonReferenceToString,
} from "./JsonReference";

const ROOT_URI = "/tmp/canned-root-url.json";
const SECOND_DOCUMENT_NAME = "canned-second-document.json";
const ABSOLUTE_URI_DOCUMENT = "/home/canned-absolute-document.json";

describe("JsonReference", () => {
  it("should create a local reference to the entire document", () => {
    const result = createJsonReference("#", ROOT_URI);
    const expected: JsonReference = {
      uri: ROOT_URI,
      jsonPointer: [],
    };

    expect(result).toEqual(expected);
  });

  it("should create a local reference to a definition", () => {
    const result = createJsonReference("#/$defs/Foo", ROOT_URI);
    const expected: JsonReference = {
      uri: ROOT_URI,
      jsonPointer: ["$defs", "Foo"],
    };

    expect(result).toEqual(expected);
  });

  it("should create a local reference to a definition with decoded tokens", () => {
    const result = createJsonReference("#/$defs/Foo~1Bar/Baz~0", ROOT_URI);
    const expected: JsonReference = {
      uri: ROOT_URI,
      jsonPointer: ["$defs", "Foo/Bar", "Baz~"],
    };

    expect(result).toEqual(expected);
  });

  it("should create a reference to a relative URI document", () => {
    const result = createJsonReference(`./${SECOND_DOCUMENT_NAME}`, ROOT_URI);
    const expected: JsonReference = {
      uri: `/tmp/${SECOND_DOCUMENT_NAME}`,
      jsonPointer: [],
    };

    expect(result).toEqual(expected);
  });

  it("should create a reference to a definition inside a relative URI document", () => {
    const result = createJsonReference(
      `./${SECOND_DOCUMENT_NAME}#/$defs/Foo`,
      ROOT_URI
    );
    const expected: JsonReference = {
      uri: `/tmp/${SECOND_DOCUMENT_NAME}`,
      jsonPointer: ["$defs", "Foo"],
    };

    expect(result).toEqual(expected);
  });

  it("should create a reference to an absolute URI document", () => {
    const result = createJsonReference(ABSOLUTE_URI_DOCUMENT, ROOT_URI);
    const expected: JsonReference = {
      uri: ABSOLUTE_URI_DOCUMENT,
      jsonPointer: [],
    };

    expect(result).toEqual(expected);
  });

  it("should create a reference to a definition inside an absolute URI document", () => {
    const result = createJsonReference(
      `${ABSOLUTE_URI_DOCUMENT}#/$defs/Foo`,
      ROOT_URI
    );
    const expected: JsonReference = {
      uri: ABSOLUTE_URI_DOCUMENT,
      jsonPointer: ["$defs", "Foo"],
    };

    expect(result).toEqual(expected);
  });

  it("should convert a JsonReference to string", () => {
    const jsonReference: JsonReference = {
      uri: ROOT_URI,
      jsonPointer: ["$defs", "Foo", "Bar/Baz~"],
    };

    const result = jsonReferenceToString(jsonReference);
    const expected = `${ROOT_URI}#/$defs/Foo/Bar~1Baz~0`;
    expect(result).toEqual(expected);
  });

  it("should convert a JsonReference without tokens to string", () => {
    const jsonReference: JsonReference = {
      uri: ROOT_URI,
      jsonPointer: [],
    };

    const result = jsonReferenceToString(jsonReference);
    const expected = `${ROOT_URI}`;
    expect(result).toEqual(expected);
  });
});
