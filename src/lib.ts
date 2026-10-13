import { close, mkdirSync, open, openSync, readFileSync, ReadFileSyncOptionsWithStringEncoding, writeFileSync } from "node:fs";
import { write_attrib, HTMLAttrib, HTMLChild, HTMLNode, HTMLText, html_node } from "./jsx";
import path from "node:path";

export type Update<T> = (old: T) => T;

export class Struct<T> {
  inner: T;
  constructor(inner: T) {
    this.inner = inner;
  }
}

export class HTMLFile extends Struct<string> { }

export class Category extends Struct<RootData<Entry>> { }
export class Entry extends Struct<{
  summary?: string,
  content: HTMLFile | HTMLChild,
}> { }

export type FoldOpts = {collapsed?: boolean};

export type Data<C = Category> =
  | { [name: string]: { $: Data<C> } & FoldOpts | C }
  | [C, { [name: string]: { $: Data<C> } & FoldOpts | C }]
  ;

export function children_of_data<C>(d: Data<C>): { [name: string]: { $: Data<C> } & FoldOpts | C } {
  return Array.isArray(d) ? d[1] : d;
}

export function category_of_data<C>(d: Data<C>): C | null {
  return Array.isArray(d) ? d[0] : null;
}

export type RootData<C = Category> = {
  [name: string]: { $: Data<C> } & FoldOpts | C
};

// flatten the nested entries via pairs from `Data<Category>`s or `Data<Entry>`'s children,
// into a single list of pairs of entries
export const flatten1 = (
  [k, v]: [string,
    | { $: Data<Category> } & FoldOpts
    | Category
    | { $: Data<Entry> } & FoldOpts
    | Entry
  ]
): [string, Entry][] => v instanceof Entry
    ? [[k, v]]
    : Object.entries(v instanceof Category ? v.inner : Array.isArray(v.$) ? v.$[1] : v.$)
      .flatMap(flatten1);

// TODO HERE:
export type Id = { category: string | string[] };

export function opt(t: HTMLChild | null | undefined | false): HTMLChild[] {
  return t ? [t] : [];
}

export function readFile(
  filename: string,
  opts?: ReadFileSyncOptionsWithStringEncoding | BufferEncoding
): string {
  return readFileSync(filename, opts || {encoding: "utf8"});
}

export function writeFile(filename: string, f: (write: (s: string) => void) => void): void {
  mkdirSync(path.dirname(filename), { recursive: true });
  const fd = openSync(filename, "w");
  f(s => writeFileSync(fd, s));
  close(fd);
}

