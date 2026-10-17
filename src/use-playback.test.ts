import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import usePlayback from "./use-playback";

describe("usePlayback without video", () => {
  let now = 0;
  beforeEach(() => {
    now = 0;
    vi.useFakeTimers();
    vi.spyOn(performance, "now").mockImplementation(() => now);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const setup = (duration = 60000) =>
    renderHook(() => usePlayback({ current: null }, false, duration));

  it("advances by elapsed wall-clock time regardless of renders", () => {
    const { result } = setup();
    act(() => result.current.toggle());
    expect(result.current.playing).toBe(true);
    now = 1234;
    expect(result.current.getTime()).toBe(1234);
    now = 5000;
    expect(result.current.getTime()).toBe(5000);
  });

  it("seeks backward while playing", () => {
    const { result } = setup();
    act(() => result.current.toggle());
    now = 30000;
    act(() => result.current.seek(10000));
    expect(result.current.getTime()).toBe(10000);
    expect(result.current.currentTime).toBe(10000);
    now = 31000;
    expect(result.current.getTime()).toBe(11000);
  });

  it("seeks relative to the actual current time", () => {
    const { result } = setup();
    act(() => result.current.toggle());
    now = 30000;
    act(() => result.current.seek(-10000, true));
    expect(result.current.getTime()).toBe(20000);
    act(() => result.current.seek(-100000, true));
    expect(result.current.getTime()).toBe(0);
  });

  it("keeps the time while paused", () => {
    const { result } = setup();
    act(() => result.current.toggle());
    now = 3000;
    act(() => result.current.toggle());
    expect(result.current.playing).toBe(false);
    now = 10000;
    expect(result.current.getTime()).toBe(3000);
    act(() => result.current.seek(1000, true));
    expect(result.current.getTime()).toBe(4000);
  });

  it("stops at the end and restarts from the beginning", () => {
    const { result } = setup(1000);
    act(() => result.current.toggle());
    now = 2000;
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.playing).toBe(false);
    expect(result.current.getTime()).toBe(1000);
    act(() => result.current.toggle());
    expect(result.current.getTime()).toBe(0);
  });
});
