import * as t from "io-ts";

export const Body = t.partial({
  name: t.string,
  status: t.string,
});

export interface Body {
  name?: string;
  status?: string;
}
