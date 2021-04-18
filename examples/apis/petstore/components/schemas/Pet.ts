import * as t from "io-ts";
import { Category } from "./Category";
import { Tag } from "./Tag";

export const Pet = t.intersection([
  t.type({
    name: t.string,
    photoUrls: t.array(t.string),
  }),
  t.partial({
    id: t.number,
    category: Category,
    tags: t.array(Tag),
    status: t.union([
      t.literal("available"),
      t.literal("pending"),
      t.literal("sold"),
    ]),
  }),
]);

export interface Pet {
  id?: number;
  category?: Category;
  name: string;
  photoUrls: Array<string>;
  tags?: Array<Tag>;
  status?: "available" | "pending" | "sold";
}
