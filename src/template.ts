import { Struct } from "./lib";

export class InterpolatedPart<tag extends string = string> extends Struct<tag> { }

export type template<_tag extends string = string> = { s: string };

export function new_template<tag extends string = string>(s: string): template<tag> {
  return { s };
}

// empty string -> template over
// non-empty string -> string part of template
// InterpolatedPart -> interpolated part of template
// 
// NOTE: mutable, overwrites `t.s`
function next<tag extends string = string>(t: template<tag>): string | InterpolatedPart<tag> {
  if (t.s === "") {
    return "";
  }

  const next_interpolation = t.s.indexOf("{{");
  if (next_interpolation === -1) {
    const s = t.s;
    t.s = "";
    return s;
  } else if (next_interpolation === 0) {
    const end_interpolation = t.s.indexOf("}}");
    if (end_interpolation === -1) {
      throw Error("invalid template string");
    } else if (end_interpolation < 2) {
      throw Error("unrechable");
    }

    const td = new InterpolatedPart<tag>(
      (end_interpolation === 2
        ? ""
        : t.s.substring(2, end_interpolation - 1).trim()) as any,
    );
    t.s = t.s.substring(end_interpolation + 2);
    return td;
  } else {
    const s = t.s.substring(0, next_interpolation - 1);
    t.s = t.s.substring(next_interpolation);
    return s;
  }
}

export function is_interpolated_part<tag extends string = string>(
  part: string | InterpolatedPart<tag>
): part is InterpolatedPart<tag> {
  return part instanceof InterpolatedPart;
}

// iterator over all parts in the template
export function iter<tag extends string = string>(
  t: template<tag>,
): IterableIterator<string | InterpolatedPart<tag>, null, undefined> {
  return {
    next: () => {
      const part = next<tag>(t);
      return part ? {
        done: false,
        value: part,
      } : {
        done: true,
        value: null,
      }
    },
    [Symbol.iterator]() {
      return this;
    }
  };
}

