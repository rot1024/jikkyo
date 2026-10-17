import { describe, it, expect } from "vitest";
import { getFileKind } from "./fileType";

const file = (name: string, type = "") => new File([""], name, { type });

describe("getFileKind", () => {
  it("detects files by MIME type or extension", () => {
    expect(getFileKind(file("a.mp4", "video/mp4"))).toBe("video");
    expect(getFileKind(file("a.mkv"))).toBe("video");
    expect(getFileKind(file("a.xml", "text/xml"))).toBe("comment");
    expect(getFileKind(file("a.xml"))).toBe("comment");
    expect(getFileKind(file("a.json", "application/json"))).toBe("comment");
    expect(getFileKind(file("a.txt", "text/plain"))).toBeUndefined();
  });
});
