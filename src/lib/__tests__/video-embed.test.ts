import { describe, expect, it } from "vitest";
import { getEmbeddableVideo, isValidVideoInput, normalizeVideoUrlInput } from "@/lib/video-embed";

describe("video embed helpers", () => {
  it("turns regular YouTube links into nocookie embeds", () => {
    expect(getEmbeddableVideo("https://www.youtube.com/watch?v=dQw4w9WgXcQ").src).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1"
    );
  });

  it("accepts common pasted YouTube variants without a protocol", () => {
    expect(normalizeVideoUrlInput("www.youtube.com/shorts/dQw4w9WgXcQ?feature=share")).toBe(
      "https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share"
    );
    expect(getEmbeddableVideo("youtu.be/dQw4w9WgXcQ?si=abc").type).toBe("iframe");
    expect(isValidVideoInput("dQw4w9WgXcQ")).toBe(true);
  });

  it("keeps hosted video files as video sources", () => {
    expect(getEmbeddableVideo("cdn.example.com/lesson.mp4")).toEqual({
      type: "video",
      src: "https://cdn.example.com/lesson.mp4",
    });
  });
});
