import { env, argv } from "node:process";
import data from "./data";
import { Category, category_of_data, children_of_data, Data, Entry, FoldOpts, HTMLFile, opt, readFile, RootData, Update, writeFile } from "./lib";
import { InterpolatedPart, Template } from "./template";
import { jsx, HTMLNode, HTMLText, HTMLChild, HTMLAttrib, html_node } from "./jsx";
import path from "node:path";

type HTMLNodeRepr = {
  tag: string,
  args: [string, HTMLAttrib][],
  body: HTMLChild[],
};

type Path = [string, ...string[]];
function last(p: Path): string {
  return p[p.length - 1] || p[0];
}
function show(p: Path): string {
  return "/" + p.join("/");
}

type SiteCategory = { html: HTMLNode, entries: Map<Path, HTMLNode> };
type Site = {
  root: HTMLNodeRepr,
  categories: Map<Path, SiteCategory>,
}

// const rootHtml: HTMLNodeRepr = { tag: "ul", args: [], body: [] };
// const categoryHtml: Map<Path, HTMLNode> = new Map();
// // const categoryHtml: HTMLNodeRepr = { tag: "div", args: [], body: [] };
// const entryHtml: Map<Path, HTMLNodeRepr> = new Map();
// const entryHtml: HTMLNodeRepr = { tag: "div", args: [], body: [] };

function renderData<C>(
  d: Data<C>,
  path: Path,
  collapsed: boolean,
  render_c: (c: C, path: Path) => void,
  is_c: (v: unknown) => v is C,
): HTMLNode {
  const maybe_category = category_of_data(d);
  if (maybe_category) {
    render_c(maybe_category, path);
  }

  const children = Object.entries(children_of_data(d))
    .map(([k, v]) => {
      const new_path: Path = [...path, k];

      if (is_c(v)) {
        render_c(v, new_path);
        return <li><a href={show(new_path)}>{ k }</a></li>;
      } else {
        return <li>{renderData(v.$, new_path, !!v.collapsed, render_c, is_c)}</li>;
      }
    });

  return <details open={collapsed ? undefined : null}>
    <summary>{
      maybe_category ? (
        <a href={show(path)}>
          {last(path)}
        </a>
      ) : (
        new HTMLText(last(path))
      )
    }</summary>

    <ul>{ children }</ul>
  </details>;
}

function renderDataOfCategories(
  d: Data,
  path: Path,
  collapsed: boolean,
  storeCategory: (sc: SiteCategory, path: Path) => void,
) {
  return renderData<Category>(
    d,
    path,
    collapsed,
    (c, path) => storeCategory(renderCategory(c, path), path),
    v => v instanceof Category,
  );
}

function renderDataOfEntries(
  d: Data<Entry>,
  path: Path,
  collapsed: boolean,
  storeEntry: (sc: HTMLNode, path: Path) => void,
) {
  return renderData<Entry>(
    d,
    path,
    collapsed,
    (c, path) => storeEntry(renderEntry(c, path), path),
    v => v instanceof Entry,
  );
}

function renderRootData(rd: RootData): Site {
  const site: Site = {
    root: { tag: "ul", args: [], body: [] },
    categories: new Map(),
  };

  Object.entries(rd)
    .forEach(([k, v]) => {
      const path: Path = [k];

      if (v instanceof Category) {
        site.categories.set(path, renderCategory(v, path));
        site.root.body.push(<li><button>{k}</button></li>);
      } else {
        site.root.body.push(<li>{renderDataOfCategories(
          v.$,
          path,
          !!v.collapsed,
          (sc, path) => site.categories.set(path, sc),
        )}</li>);
      }
    });

  return site;
}

function renderCategory(c: Category, path: Path): SiteCategory {
  const entries = new Map();

  const children = Object.entries(c.inner)
    .map(([k, v]) => {
      if (v instanceof Entry) {
        entries.set([...path, ":", k], renderEntry(v, [...path, k]));
        return <li><button>{k}</button></li>;
      } else {
        return <li>{renderDataOfEntries(
          v.$,
          [k],
          !!v.collapsed,
          (e, entry_path) => entries.set([...path, ":", ...entry_path], e),
        )}</li>;
      }
    });

  return { html: <ul>{ children }</ul>, entries };
}

function renderEntry(c: Entry, path: Path): HTMLNode {
  return <div>
    {opt(!!c.inner.summary && <p>{ c.inner.summary }</p>)}
    {c.inner.content instanceof HTMLFile
      ? new HTMLNode(readFile(c.inner.content.inner, {encoding: 'ascii'}))
      : c.inner.content}
  </div>;
}

type TemplateInputs = {
  categories: HTMLChild,
  entries: HTMLChild,
  entry: HTMLChild,
};

function writeSite(
  site: Site,
  out_dir: string,
  template_factory: () => Template<TemplateInputs>,
) {
  const root_html = html_node(site.root.tag, site.root.args, site.root.body);

  // landing page with categories listed but no entries or view of an entry
  writeFile(path.join(out_dir, "index.html"), write => {
    template_factory().run({
      categories: root_html,
      entries: <p>No category selected</p>,
      entry: <p>No entry selected</p>,
    })(write);
  });

  // intermediate pages with categories listed and entries listed for the respective category
  for (const [category_path, { html: category, entries }] of site.categories) {
    console.log("entries: ", path.join(out_dir, ...category_path, "index.html"));
    writeFile(path.join(out_dir, ...category_path, "index.html"), write => {
      template_factory().run({
        categories: root_html,
        entries: category,
        entry: <p>No entry selected</p>,
      })(write);
    });

    // leaf pages with categories listed, entries listed and a respective entry open
    for (const [entry_path, entry] of entries) {
      const entry_filepath: Path = [...entry_path];
      entry_filepath[entry_filepath.length - 1] = last(entry_filepath) + ".html";

      console.log("entry: ", path.join(out_dir, ...category_path, ...entry_filepath));
      writeFile(path.join(out_dir, ...category_path, ...entry_filepath), write => {
        template_factory().run({
          categories: root_html,
          entries: category,
          entry: entry,
        })(write);
      });
    }
  }
}

// const interpolatedParts = [rootHtml, categoryHtml, entryHtml];

const input_filename = argv[2] || env.IN;
if (input_filename === undefined) {
  throw new Error("specify input-file as `node main.js <in>` or `IN=<in> node main.js`");
}

const out_dir = argv[3] || env.OUT;
if (out_dir === undefined) {
  throw new Error("specify output-directory as `node main.js _ <out>` or `OUT=<out> node main.js`");
}

const site = renderRootData(data);

writeSite(
  site,
  out_dir,
  () => new Template<TemplateInputs>(readFile(input_filename)),
);

/* const t = new Template(readFile(input_filename));
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
); */
