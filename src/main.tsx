import { env, argv } from "node:process";
import { data, links } from "./data";
import { Category, category_of_data, children_of_data, Data, entries, Entry, HTMLFile, readFile, RootData, writeFile } from "./lib";
import { iter as template_iter, new_template, type template, is_interpolated_part } from "./template";
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
function with_last(p: Path, last: string): Path {
  if (p.length === 1)
    return [last];
  return [p[0], ...p.slice(1, -1), last];
}

type SiteCategory = { html: HTMLNode, entries: Map<Path, HTMLNode> };
type Site = {
  root: HTMLNodeRepr,
  categories: Map<Path, SiteCategory>,
}

function renderDataOfCategories(
  d: Data,
  path: Path,
  collapsed: boolean,
  storeCategory: (sc: SiteCategory, path: Path) => void,
) {
  const maybe_category = category_of_data(d);
  if (maybe_category) {
    storeCategory(renderCategory(maybe_category, path), path);
  }

  const children = Object.entries(children_of_data(d))
    .map(([k, v]) => {
      const new_path: Path = [...path, k];

      if (v instanceof Category) {
        storeCategory(renderCategory(v, new_path), new_path);
        return <li><a href={show(new_path)}>{ k }</a></li>;
      } else {
        return <li>{renderDataOfCategories(v.$, new_path, !!v.collapsed, storeCategory)}</li>;
      }
    });

  return <details open={collapsed ? undefined : null}>
    <summary>{
      maybe_category ? (
        <div>
          <span><a href={show(path)} title={maybe_category.inner.summary}>
            {last(path)}
          </a></span>
        </div>
      ) : (
        <div>
          <span>{new HTMLText(last(path))}</span>
        </div>
      )
    }</summary>

    <ul>{ children }</ul>
  </details>;
}

function renderDataOfEntries(
  d: Data<Entry>,
  category_path: Path,
  path: Path,
  collapsed: boolean,
  storeEntry: (sc: HTMLNode, path: Path) => void,
) {
  const maybe_entry = category_of_data(d);
  if (maybe_entry) {
    storeEntry(renderEntry(maybe_entry), path);
  }

  const children = Object.entries(children_of_data(d))
    .map(([k, v]) => {
      const new_path: Path = [...path, k];

      if (v instanceof Entry) {
        storeEntry(renderEntry(v), new_path);
        return <li>
          <div>
            <span><a title={v.inner.summary} href={show([
              ...category_path,
              ":",
              ...with_last(new_path, last(new_path) + ".html"),
            ])}>
              { k }
            </a></span>
          </div>
        </li>;
      } else {
        return <li>{renderDataOfEntries(v.$, category_path, new_path, !!v.collapsed, storeEntry)}</li>;
      }
    });

  return <details open={collapsed ? undefined : null}>
    <summary>{
      maybe_entry ? (
        <div>
          <span><a title={maybe_entry.inner.summary} href={show([
            ...category_path,
            ":",
            ...with_last(path, last(path) + ".html"),
          ])}>
            {last(path)}
          </a></span>
        </div>
      ) : (
        <div>
          <span>{new HTMLText(last(path))}</span>
        </div>
      )
    }</summary>

    <ul>{ children }</ul>
  </details>;
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
        site.root.body.push(<li><a href={show(path)}>{k}</a></li>);
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

  const children = Object.entries(c.inner.$ || {})
    .map(([k, v]) => {
      if (v instanceof Entry) {
        entries.set([k], renderEntry(v));
        return <li><div>
          <span><a title={v.inner.summary} href={show([...path, ":", k + ".html"])}>{k}</a></span>
        </div></li>;
      } else {
        return <li>{renderDataOfEntries(
          v.$,
          path,
          [k],
          !!v.collapsed,
          (e, entry_path) => entries.set(entry_path, e),
        )}</li>;
      }
    });

  return { html: <ul>{ children }</ul>, entries };
}

function renderEntry(c: Entry): HTMLNode {
  return <div>
    {c.inner.content instanceof HTMLFile
      ? new HTMLNode(readFile(c.inner.content.inner, {encoding: 'ascii'}))
      : c.inner.content}
  </div>;
}

type TemplateInputs =
  | 'categories'
  | 'entries'
  | 'entry';

type SiteConfig = {
  no_entry_selected_content?: HTMLChild,
  no_category_selected_content?: HTMLChild,
};

function writeSite(
  site: Site,
  write_file: (path: string, contents: Record<TemplateInputs, HTMLChild>) => void,
  config: SiteConfig = {},
) {
  const root_html = html_node(site.root.tag, site.root.args, site.root.body);

  // landing page with categories listed but no entries or view of an entry
  write_file("index.html", {
    categories: root_html,
    entries: config.no_category_selected_content ?? <p>No category selected</p>,
    entry: config.no_entry_selected_content ?? <p>No entry selected</p>,
  });

  // intermediate pages with categories listed and entries listed for the respective category
  for (const [category_path, { html: category, entries }] of site.categories) {
    console.log("entries: ", path.join(...category_path, "index.html"));
    write_file(path.join(...category_path, "index.html"), {
      categories: root_html,
      entries: category,
      entry: config.no_entry_selected_content ?? <p>No entry selected</p>,
    });

    // leaf pages with categories listed, entries listed and a respective entry open
    for (const [entry_path, entry] of entries) {
      const entry_filepath: Path = [...entry_path];
      entry_filepath[entry_filepath.length - 1] = last(entry_filepath) + ".html";

      console.log("entry: ", path.join(
        ...category_path,
        ":",
        ...with_last(entry_path, last(entry_path) + ".html"),
      ));
      write_file(path.join(...category_path, ":", ...entry_filepath), {
        categories: root_html,
        entries: category,
        entry: entry,
      });
    }
  }
}

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

  (file_path, map_part) => {
    writeFile(path.join(out_dir, file_path), write => {
      for (const part of template_iter(
        new_template<TemplateInputs | 'links'>(readFile(input_filename))
      )) {
        if (is_interpolated_part(part)) {
          if (part.inner === 'links') {
            write((<span>
              {entries(links).map(([name, link]) => <a href={link}>{name}</a>)}
            </span>).content);
          } else {
            write(map_part[part.inner].content);
          }
        } else {
          write(part);
        }
      }
    });
  },

  {
    no_category_selected_content: <p style="padding-left: 1em;">No category selected</p>
  }
);
