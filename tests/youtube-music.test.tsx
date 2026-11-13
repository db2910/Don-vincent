import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import YouTubeMusicToggle from "@/components/shared/YouTubeMusicToggle";
import { requestInvitationMusic } from "@/lib/music";
import { loadYouTubeAPI, type YouTubeAPI } from "@/lib/youtube";

vi.mock("@/lib/youtube", () => ({ loadYouTubeAPI: vi.fn() }));
type Options = ConstructorParameters<YouTubeAPI["Player"]>[1];
let options: Options;
const playVideo = vi.fn();
const pauseVideo = vi.fn();
const destroy = vi.fn();
const iframe = document.createElement("iframe");
const player = { playVideo, pauseVideo, destroy, getIframe: () => iframe };

beforeEach(() => {
  vi.clearAllMocks();
  const Player = vi.fn(function (_element: HTMLElement, config: Options) {
    options = config;
    return player;
  });
  vi.mocked(loadYouTubeAPI).mockResolvedValue({ Player });
});
afterEach(() => vi.restoreAllMocks());

it("loads the requested song after opening and follows actual playback events", async () => {
  render(<YouTubeMusicToggle videoId="5jfgdZlA7Pk" title="Intashyo"/>);
  expect(loadYouTubeAPI).not.toHaveBeenCalled();
  act(() => requestInvitationMusic());
  await waitFor(() => expect(loadYouTubeAPI).toHaveBeenCalledOnce());
  expect(options.videoId).toBe("5jfgdZlA7Pk");
  act(() => options.events.onReady({ target: player }));
  expect(playVideo).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "Play wedding music" })).toHaveAttribute("aria-pressed", "false");
  act(() => options.events.onStateChange({ target: player, data: 1 }));
  fireEvent.click(screen.getByRole("button", { name: "Pause wedding music" }));
  expect(pauseVideo).toHaveBeenCalledOnce();
  act(() => options.events.onStateChange({ target: player, data: 2 }));
  fireEvent.click(screen.getByRole("button", { name: "Play wedding music" }));
  expect(playVideo).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Close and stop wedding music" }));
  expect(destroy).toHaveBeenCalledOnce();
  expect(screen.queryByRole("region", { name: "Wedding music player" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Play wedding music" })).toHaveFocus();
});

it("handles blocked autoplay and unavailable embeds with a direct song link", async () => {
  render(<YouTubeMusicToggle videoId="5jfgdZlA7Pk" title="Intashyo"/>);
  fireEvent.click(screen.getByRole("button", { name: "Play wedding music" }));
  await waitFor(() => expect(loadYouTubeAPI).toHaveBeenCalledOnce());
  act(() => options.events.onAutoplayBlocked());
  expect(screen.getByRole("status")).toHaveTextContent("Tap play in the video");
  expect(screen.getByRole("button", { name: "Play wedding music" })).toBeEnabled();
  act(() => options.events.onError());
  expect(screen.getByRole("status")).toHaveTextContent("Music could not play here");
  expect(screen.getByRole("link", { name: /Listen on YouTube/ })).toHaveAttribute("href", "https://www.youtube.com/watch?v=5jfgdZlA7Pk");
});

it("recovers from a failed script load by closing and reopening the player", async () => {
  vi.mocked(loadYouTubeAPI).mockRejectedValueOnce(new Error("offline"));
  render(<YouTubeMusicToggle videoId="5jfgdZlA7Pk" title="Intashyo"/>);
  fireEvent.click(screen.getByRole("button", { name: "Play wedding music" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Music could not load");
  expect(screen.getByRole("button", { name: "Play wedding music" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Close and stop wedding music" }));
  fireEvent.click(screen.getByRole("button", { name: "Play wedding music" }));
  await waitFor(() => expect(loadYouTubeAPI).toHaveBeenCalledTimes(2));
  act(() => options.events.onReady({ target: player }));
  expect(playVideo).toHaveBeenCalledOnce();
});
