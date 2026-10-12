import { Struct } from "./lib";

export class InterpolatedPart extends Struct<string> { }

export class Template {
  private s: string;

  constructor(s: string) {
    this.s = s;
  }

  next(): string | InterpolatedPart | null {
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

      const td = new InterpolatedPart(
        end_interpolation === 2
          ? ""
          : this.s.substring(2, end_interpolation - 1),
      );
      this.s = this.s.substring(end_interpolation + 2);
      return td;
    } else {
      const s = this.s.substring(0, next_interpolation - 1);
      this.s = this.s.substring(next_interpolation);
      return s;
    }
  }
}

