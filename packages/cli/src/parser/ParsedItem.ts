import { ComponentReference, ComponentType } from "./components";

export interface ImportExportData {
  prefix: string;
  path: string;
}

export interface ParsedItem<T> {
  type: "ParsedItem";
  name: string;
  item: T;
  importExportData?: ImportExportData;
}

export function parsedItem<T>(
  name: string,
  item: T,
  importExportData?: ImportExportData
): ParsedItem<T> {
  return {
    type: "ParsedItem",
    name,
    item,
    importExportData,
  };
}

export type ParsedItemOrComponentReference<T extends ComponentType> =
  | ParsedItem<T>
  | ComponentReference<T>;
