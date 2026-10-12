
export class HTMLNode {
  content: string;
  constructor(content: string) {
    this.content = content
  }
}
export class HTMLText {
  content: string;
  constructor(content: string) {
    this.content = content
  }
}

export type HTMLChild = HTMLNode | HTMLText;

export type ActualChild = HTMLChild | string | (HTMLChild | string)[];
export type Children =
  | HTMLChild
  | string
  | (HTMLChild | string)[]
  | ((HTMLChild | string)[] | HTMLChild | string)[]
  ;

export type HTMLAttrib = Children | string | number | boolean | (null | undefined);

export function write_attrib(key: string, v: HTMLAttrib): string {
  if (v === null) {
    return key;
  }
  if (v === undefined) {
    return "";
  }

  let s = `${key}=`;
  if (v instanceof HTMLNode || v instanceof HTMLText) {
    s += v.content;
  }
  else if (Array.isArray(v)) {
    s += v.map(child => child instanceof HTMLNode ? child.content : child).join('');
  }
  else {
    switch (typeof v) {
      case "string":
        s += `"${v}"`;
        break;
      case "number":
        s += v.toString();
        break;
      case "boolean":
        s += v ? "true" : "false";
        break;
     default:
        v satisfies never;
        throw new TypeError("HTMLAttrib can only be a string, number, boolean, null, undefined, an HTMLNode, or a list of HTMLChild or strings");
    }
  }
  return s;
};

export function html_node(
  tag: string,
  args: [string, HTMLAttrib][],
  body: HTMLChild[],
): HTMLNode {
  const args_str = args
    .map(([k, v]) => write_attrib(k, v))
    .flatMap(s => s ? [' ' + s] : [])
    .join('');
  const body_str = body.map(child => child.content).join('');

  return new HTMLNode("<" + tag + args_str + ">" + body_str + "</" + tag + ">");
};

// so much work for nothing
// export function jsx<P extends Record<string, HTMLAttrib>>(
//   tag: string,
//   props: P | null,
//   ...children: HTMLChild[]
// ): HTMLChild;

// export function jsx<
//   Props extends Record<string, HTMLAttrib | HTMLChild>,
//   Children extends HTMLChild[],
//   Return extends HTMLNode | string,
//   T extends (props: Props, ...children: Children) => Return,
// >(
//   tag: T,
//   props: Props,
//   ...children: Children
// ): HTMLChild;

export function jsx(
  tag: ((
    props: Record<string, HTMLAttrib | HTMLChild>,
    ...children: HTMLChild[]
  ) => HTMLNode | string) | string,
  props: Record<string, HTMLAttrib | HTMLChild> | null,
  // ...children: HTMLChild[]
  ...children: ActualChild[]
): HTMLChild {
  // Flatten children
  const children_ = children
    .flat(1)
    .map(child => typeof child === 'string' ? new HTMLText(child) : child);

  // Builtin tag
  if (typeof tag === 'string') {
    return html_node(
      tag,
      props === null ? [] : Object.entries(props).map(([k, v]) => {
        if (v instanceof HTMLNode || v instanceof HTMLText)
          throw new TypeError(`Builtin tag cannot be supplied non-html attributes`);
        return [k, v];
      }),
      children_,
    );
  }

  // Component/function as tag
  const ret = tag(props || {}, ...children_);
  return ret instanceof HTMLNode ? ret : new HTMLText(ret);
};

export namespace jsx {
  export namespace JSX {
    // interface ElementAttributesProperty {
    //   props; // specify the property name to use
    // }
    export type Element = HTMLChild;

    export type ElementType =
      | keyof IntrinsicElements
      | ((props: any) => HTMLChild);

    export interface ElementChildrenAttribute { children: {} }

    export interface IntrinsicElements {
      [tag: string]: {
        children?: Children,
        [k: string]: HTMLAttrib,
      },
    }
  }
}

