import { describe, it, expect } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import App from "./App";

const findDropZone = () => {
  const el = Array.from(document.querySelectorAll("div")).find(
    d => getComputedStyle(d).borderStyle === "dotted"
  );
  if (!el) throw new Error("drop zone not found");
  return el;
};

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it("loads a video and a comment file dropped together", async () => {
    render(<App />);
    const video = new File([""], "movie.mkv");
    const comment = new File(
      ['<packet><chat vpos="100">hello</chat></packet>'],
      "comments.xml"
    );
    fireEvent.drop(findDropZone(), { dataTransfer: { files: [comment, video] } });
    await waitFor(() => expect(document.querySelector("video")).toBeTruthy());
    expect(screen.queryByText(/Unsupported file/)).toBeNull();
  });

  it("syncs the comment offset slider with the hotkeys", () => {
    render(<App />);
    const slider = document.querySelector(
      'input[type="range"][min="-60000"]'
    ) as HTMLInputElement;
    expect(slider.value).toBe("0");

    // "," shows comments 1s later
    fireEvent.keyDown(document, { key: ",", code: "Comma" });
    fireEvent.keyUp(document, { key: ",", code: "Comma" });
    expect(slider.value).toBe("1000");
    expect(screen.getByText("+1.0s")).toBeTruthy();

    fireEvent.change(slider, { target: { value: "-2500" } });
    expect(screen.getByText("−2.5s")).toBeTruthy();

    // "/" resets
    fireEvent.keyDown(document, { key: "/", code: "Slash" });
    fireEvent.keyUp(document, { key: "/", code: "Slash" });
    expect(slider.value).toBe("0");
  });

  it("shows an error for unsupported files", async () => {
    render(<App />);
    fireEvent.drop(findDropZone(), {
      dataTransfer: { files: [new File([""], "a.txt", { type: "text/plain" })] }
    });
    await screen.findByText(/Unsupported file: a.txt/);
  });
});
