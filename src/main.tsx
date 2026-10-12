import { env, argv } from "node:process";
import data from "./data";
import { Category, category_of_data, children_of_data, Data, Entry, FoldOpts, HTMLFile, opt, readFile, RootData, Update, writeFile } from "./lib";
import { InterpolatedPart, Template } from "./template";
import { jsx, HTMLNode, HTMLText, HTMLChild, HTMLAttrib, html_node } from "./jsx";

type HTMLNodeRepr = {
  tag: string,
  args: [string, HTMLAttrib][],
  body: HTMLChild[],
};

const rootHtml: HTMLNodeRepr = { tag: "ul", args: [], body: [] };
const categoryHtml: HTMLNodeRepr = { tag: "div", args: [], body: [] };
const entryHtml: HTMLNodeRepr = { tag: "div", args: [], body: [] };

function renderData<C>(
  d: Data<C>,
  name: string,
  collapsed: boolean,
  render_c: (c: C, name: string) => void,
  is_c: (v: unknown) => v is C,
): HTMLNode {
  const maybe_category = category_of_data(d);
  if (maybe_category) {
    render_c(maybe_category, name);
  }

  const children = Object.entries(children_of_data(d))
    .map(([k, v]) => {
      if (is_c(v)) {
        render_c(v, k);
        return <li><button>{ k }</button></li>;
      } else {
        return <li>{renderData(v.$, k, !!v.collapsed, render_c, is_c)}</li>;
      }
    });

  return <details open={collapsed ? undefined : null}>
    <summary>{
      maybe_category ? (
        <button>
          {name}
        </button>
      ) : (
        new HTMLText(name)
      )
    }</summary>

    <ul>{ children }</ul>
  </details>;
}

function renderDataOfCategories(d: Data, name: string, collapsed: boolean) {
  return renderData<Category>(d, name, collapsed, renderCategory, v => v instanceof Category);
}

function renderDataOfEntries(d: Data<Entry>, name: string, collapsed: boolean) {
  return renderData<Entry>(d, name, collapsed, renderEntry, v => v instanceof Entry);
}

function renderRootData(rd: RootData) {
  Object.entries(rd)
    .forEach(([k, v]) => {
      if (v instanceof Category) {
        renderCategory(v, k);
        rootHtml.body.push(<li><button>{k}</button></li>);
      } else {
        rootHtml.body.push(<li>{renderDataOfCategories(v.$, k, !!v.collapsed)}</li>);
      }
    });
}

function renderCategory(c: Category, name: string) {
  const children = Object.entries(c.inner)
    .map(([k, v]) => {
      if (v instanceof Entry) {
        renderEntry(v, k);
        return <button>{k}</button>;
      } else {
        return renderDataOfEntries(v.$, k, !!v.collapsed);
      }
    });

  categoryHtml.body.push(<div id={name}>{ children }</div>);
}

function renderEntry(c: Entry, name: string) {
  entryHtml.body.push(<div id={name}>
    {opt(!!c.inner.summary && <p>{ c.inner.summary }</p>)}
    {c.inner.content instanceof HTMLFile
      ? new HTMLNode(readFile(c.inner.content.inner, {encoding: 'ascii'}))
      : c.inner.content}
  </div>);
}

renderRootData(data);
const interpolatedParts = [rootHtml, categoryHtml, entryHtml];

const input_filename = argv[2] || env.IN;
if (input_filename === undefined) {
  throw new Error("specify input-file name as `node main.js <in>` or `IN=<in> node main.js`");
}

const output_filename = argv[3] || env.OUT;
if (output_filename === undefined) {
  throw new Error("specify output-file name as `node main.js _ <out>` or `OUT=<out> node main.js`");
}

const t = new Template(readFile(input_filename));
let i = 1;
writeFile(
  output_filename,
  write => {
    while (true) {
      const part = t.next();
      if (part instanceof InterpolatedPart) {
        if (parseInt(part.inner) != i) throw new Error("template invariant broken");
        const { tag, args, body } = interpolatedParts[i - 1]!;
        write(html_node(tag, args, body).content);
        i++;
      } else if (part === null) {
        break;
      } else {
        write(part);
      }
    }
  }
);
