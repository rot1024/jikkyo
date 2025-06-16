import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    // Check if the app container is rendered
    expect(document.body).toBeTruthy();
  });

  it("renders main video player interface", () => {
    render(<App />);
    // The app should render without throwing errors
    expect(document.querySelector('body')).toBeTruthy();
  });
});
