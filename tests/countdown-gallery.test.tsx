import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { weddingConfig } from "@/lib/wedding-config";
import WeddingCountdown from "@/components/invitation/WeddingCountdown";
import PhotoGallery from "@/components/invitation/PhotoGallery";
import MusicToggle from "@/components/shared/MusicToggle";
import { requestInvitationMusic } from "@/lib/music";

vi.mock("next/image", () => ({ default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
  // Unit tests exercise image semantics without Next's image loader.
  // eslint-disable-next-line @next/next/no-img-element
  <img alt={alt ?? ""} {...props} />
) }));
const originalPhotos = [...weddingConfig.photos];

beforeEach(() => {
  weddingConfig.startTime = null;
  weddingConfig.endTime = null;
  weddingConfig.photos = [originalPhotos[0]];
  weddingConfig.countdown.useDateBeginningWhenTimeUnknown = true;
  weddingConfig.music = { src: null, title: null };
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value() { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value() { this.removeAttribute("open"); } });
});
afterEach(() => {
  cleanup();
  weddingConfig.startTime = null;
  weddingConfig.endTime = null;
  weddingConfig.photos = [...originalPhotos];
  weddingConfig.music = { src: null, title: null };
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("countdown display", () => {
  it("shows the provisional date countdown while keeping ceremony time unconfirmed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-16T21:59:58Z"));
    render(<WeddingCountdown/>);
    expect(within(screen.getByRole("timer")).getByText("02")).toBeInTheDocument();
    expect(screen.getByText(/Date countdown · Ceremony time unconfirmed/)).toBeInTheDocument();
    expect(weddingConfig.startTime).toBeNull();
  });
  it("ticks once per second, reaches zero and stops", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-17T11:59:58Z"));
    weddingConfig.startTime = "14:00";
    const { unmount } = render(<WeddingCountdown/>);
    expect(within(screen.getByRole("timer")).getByText("02")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(within(screen.getByRole("timer")).getByText("01")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText(/Our wedding day has arrived/)).toBeInTheDocument();
    expect(within(screen.getByRole("timer")).getAllByText("00")).toHaveLength(4);
    expect(vi.getTimerCount()).toBe(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cleans up a running interval when unmounted", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-01T12:00:00Z"));
    weddingConfig.startTime = "14:00";
    const { unmount } = render(<WeddingCountdown/>);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("photo gallery", () => {
  it("shows one configured photo once, opens by keyboard-capable button, traps focus and restores it", () => {
    render(<PhotoGallery/>);
    expect(screen.getAllByRole("img")).toHaveLength(1);
    const opener = screen.getByRole("button", { name: /Open photograph 1/ });
    opener.focus();
    fireEvent.click(opener);
    const lightbox = screen.getByRole("dialog");
    const close = within(lightbox).getByRole("button", { name: "Close photograph" });
    expect(close).toHaveFocus();
    expect(within(lightbox).queryByRole("button", { name: "Next photograph" })).not.toBeInTheDocument();
    fireEvent.keyDown(lightbox, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(lightbox, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
  it("supports arrow keys, previous/next, focus wrapping, swipes and backdrop close when more photos are configured", () => {
    weddingConfig.photos.push({ src: "/images/approved-second.jpeg", alt: "Another approved couple photograph", width: 1600, height: 1066 });
    render(<PhotoGallery/>);
    fireEvent.click(screen.getByRole("button", { name: /Open photograph 1/ }));
    const lightbox = screen.getByRole("dialog");
    fireEvent.keyDown(lightbox, { key: "Tab", shiftKey: true });
    expect(within(lightbox).getByRole("button", { name: "Next photograph" })).toHaveFocus();
    fireEvent.keyDown(lightbox, { key: "Tab" });
    expect(within(lightbox).getByRole("button", { name: "Close photograph" })).toHaveFocus();
    fireEvent.keyDown(lightbox, { key: "ArrowRight" });
    expect(within(lightbox).getByRole("img", { name: "Another approved couple photograph" })).toBeInTheDocument();
    fireEvent.click(within(lightbox).getByRole("button", { name: "Next photograph" }));
    expect(within(lightbox).getByRole("img", { name: originalPhotos[0].alt })).toBeInTheDocument();
    fireEvent.click(within(lightbox).getByRole("button", { name: "Previous photograph" }));
    const image = within(lightbox).getByRole("img", { name: "Another approved couple photograph" });
    fireEvent.touchStart(image.parentElement!, { changedTouches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(image.parentElement!, { changedTouches: [{ clientX: 50, clientY: 100 }] });
    expect(within(lightbox).getByRole("img", { name: originalPhotos[0].alt })).toBeInTheDocument();
    fireEvent.click(lightbox);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

it("hides the music player until an approved audio source is configured", () => {
  render(<MusicToggle/>);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("plays only after a guest action and synchronizes controls with actual audio events", async () => {
  weddingConfig.music = { src: "/audio/approved-music.mp3", title: "Approved music" };
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  const { container } = render(<MusicToggle/>);
  const audio = container.querySelector("audio")!;
  expect(audio.autoplay).toBe(false);
  expect(play).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Play wedding music" })); });
  expect(play).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "Play wedding music" })).toHaveAttribute("aria-pressed", "false");
  fireEvent.play(audio);
  expect(screen.getByRole("button", { name: "Pause wedding music" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.pause(audio);
  expect(screen.getByRole("button", { name: "Play wedding music" })).toHaveAttribute("aria-pressed", "false");
});

it("reports a rejected audio playback attempt without claiming music is playing", async () => {
  weddingConfig.music = { src: "/audio/approved-music.mp3", title: null };
  vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(new Error("Playback unavailable"));
  render(<MusicToggle/>);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Play wedding music" })); });
  expect(screen.getByRole("status")).toHaveTextContent("Music could not play. Tap to try again.");
  expect(screen.getByRole("button", { name: "Play wedding music" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: "Pause wedding music" })).not.toBeInTheDocument();
});


it("requests music synchronously from opening, exposes blocked playback, and permits manual retry", async () => {
  weddingConfig.music = { src: "/audio/approved-test.mp3", title: "Approved test fixture" };
  let rejectPlay!: (reason: Error) => void;
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => new Promise((_, reject) => { rejectPlay = reject; }));
  render(<MusicToggle/>);
  act(() => { requestInvitationMusic(); expect(play).toHaveBeenCalledOnce(); });
  expect(screen.getByRole("button", { name: "Loading wedding music" })).toBeDisabled();
  await act(async () => { rejectPlay(new Error("Browser policy")); });
  expect(screen.getByRole("button", { name: "Play wedding music" })).toBeEnabled();
  expect(screen.getByRole("status")).toHaveTextContent("Music could not play");
  play.mockResolvedValue(undefined);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Play wedding music" })); });
  expect(play).toHaveBeenCalledTimes(2);
});
