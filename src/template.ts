import { HTMLChild } from "./jsx";
import { Struct } from "./lib";

export class InterpolatedPart<S extends string> extends Struct<S> { }

export class Template<Inputs extends {[k in string]: HTMLChild}> {
  private s: string;

  constructor(s: string) {
    this.s = s;
  }

  next(): string | InterpolatedPart<Extract<keyof Inputs, string>> | null {
    if (this.s === "") {
      return null;
    }

    const next_interpolation = this.s.indexOf("{{");
    if (next_interpolation === -1) {
      const s = this.s;
      this.s = "";
      return s;
    } else if (next_interpolation === 0) {
      const end_interpolation = this.s.indexOf("}}");
      if (end_interpolation === -1) {
        throw Error("invalid template string");
      } else if (end_interpolation < 2) {
        throw Error("unrechable");
      }

      const td = new InterpolatedPart<Extract<keyof Inputs, string>>(
        (end_interpolation === 2
          ? ""
          : this.s.substring(2, end_interpolation - 1).trim()) as any,
      );
      this.s = this.s.substring(end_interpolation + 2);
      return td;
    } else {
      const s = this.s.substring(0, next_interpolation - 1);
      this.s = this.s.substring(next_interpolation);
      return s;
    }
  }

  run(inputs: Inputs): (w: (s: string) => void) => void {
    return write => {
      while (true) {
        const part = this.next();
        if (part instanceof InterpolatedPart) {
          const html = inputs[part.inner]!;
          write(html.content);
        } else if (part === null) {
          break;
        } else {
          write(part);
        }
      }
    }
  };
}

