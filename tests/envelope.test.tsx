import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EnvelopeExperience from "@/components/envelope/EnvelopeExperience";

const mocks = vi.hoisted(() => ({ animate: vi.fn(), requestMusic: vi.fn(), reducedMotion: false }));
vi.mock("@/lib/music", () => ({ requestInvitationMusic: mocks.requestMusic, INVITATION_REVEALED_EVENT: "sd:invitation-revealed" }));
vi.mock("@/components/shared/FallingHearts", () => ({ default: () => <div aria-hidden="true" /> }));
vi.mock("motion/react", async () => {
  const { useRef } = await import("react");
  return { useAnimate: () => [useRef(null), mocks.animate], useReducedMotion: () => mocks.reducedMotion };
});

type AnimationOptions = { onUpdate: (time: number) => void };
function pendingTimeline() {
  let finish!: () => void;
  const promise = new Promise<void>(resolve => { finish = resolve; });
  return { stop: vi.fn(), then: promise.then.bind(promise), finish };
}

beforeEach(() => {
  sessionStorage.clear();
  document.body.style.overflow = "";
  mocks.animate.mockReset();
  mocks.requestMusic.mockReset();
  mocks.reducedMotion = false;
  vi.spyOn(window, "scrollTo").mockImplementation(() => {}).mockClear();
  window.history.replaceState(null, "", "/#rsvp");
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value() { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value() { this.removeAttribute("open"); } });
});

function renderInvitation() {
  return render(<><h1 id="couple-names" tabIndex={-1}>Main invitation</h1><EnvelopeExperience /></>);
}

describe("envelope lifecycle", () => {
  it("keeps the closed envelope unlettered and asks for music synchronously only when opened", async () => {
    const timeline = pendingTimeline();
    mocks.animate.mockImplementation(() => {
      expect(mocks.requestMusic).toHaveBeenCalledOnce();
      return timeline;
    });
    renderInvitation();
    const dialog = screen.getByRole("dialog", { name: "Open Your Invitation" });
    const opener = screen.getByRole("button", { name: "Open your invitation" });
    expect(opener).toHaveFocus();
    expect(document.getElementById("envelope-couple-names")).toBeNull();
    expect(mocks.requestMusic).not.toHaveBeenCalled();
    fireEvent.click(opener);
    fireEvent.click(opener);
    expect(mocks.animate).toHaveBeenCalledOnce();
    expect(mocks.requestMusic).toHaveBeenCalledOnce();
    expect(opener).toBeDisabled();
    expect(dialog).toHaveAttribute("data-state", "opening");
    const options = mocks.animate.mock.calls[0][1] as AnimationOptions;
    act(() => options.onUpdate(1.5));
    expect(dialog).toHaveAttribute("data-state", "revealing-card");
    act(() => options.onUpdate(2.5));
    expect(dialog).toHaveAttribute("data-state", "card-visible");
    act(() => options.onUpdate(3.5));
    expect(dialog).toHaveAttribute("data-state", "transitioning");
    await act(async () => { timeline.finish(); });
    expect(dialog).not.toHaveAttribute("open");
    expect(dialog).toHaveAttribute("data-state", "completed");
    expect(screen.getByRole("heading", { name: "Main invitation" })).toHaveFocus();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    expect(window.location.hash).toBe("#home");
    expect(document.body.style.overflow).toBe("");
    expect(sessionStorage.getItem("sd-invitation-opened")).toBe("true");
  });

  it("skip interrupts the timeline, ignores its later callbacks and supports a fresh replay", async () => {
    const timeline = pendingTimeline();
    mocks.animate.mockReturnValue(timeline);
    renderInvitation();
    fireEvent.click(screen.getByRole("button", { name: "Open your invitation" }));
    const options = mocks.animate.mock.calls[0][1] as AnimationOptions;
    fireEvent.click(screen.getByRole("button", { name: "Skip introduction" }));
    expect(timeline.stop).toHaveBeenCalledOnce();
    const replay = screen.getByRole("button", { name: "Open the envelope again" });
    replay.focus();
    fireEvent.click(replay);
    const dialog = screen.getByRole("dialog", { name: "Open Your Invitation" });
    expect(dialog).toHaveAttribute("data-state", "idle");
    expect(screen.getByRole("button", { name: "Open your invitation" })).toHaveFocus();
    await act(async () => { options.onUpdate(3.5); timeline.finish(); });
    expect(dialog).toHaveAttribute("data-state", "idle");
    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));
    expect(dialog).not.toHaveAttribute("open");
    expect(screen.getByRole("heading", { name: "Main invitation" })).toHaveFocus();
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
    expect(window.location.hash).toBe("#home");
  });

  it("requests music before the reduced-motion bypass, while skipping never requests playback", () => {
    mocks.reducedMotion = true;
    renderInvitation();
    fireEvent.click(screen.getByRole("button", { name: "Open your invitation" }));
    expect(mocks.requestMusic).toHaveBeenCalledOnce();
    expect(mocks.animate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Open the envelope again" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip introduction" }));
    expect(mocks.requestMusic).toHaveBeenCalledOnce();
  });

  it("reveals the invitation if animation creation fails and restores the previous overflow", () => {
    document.body.style.overflow = "clip";
    mocks.animate.mockImplementation(() => { throw new Error("Animation unavailable"); });
    renderInvitation();
    fireEvent.click(screen.getByRole("button", { name: "Open your invitation" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("clip");
    expect(screen.getByRole("heading", { name: "Main invitation" })).toHaveFocus();
  });

  it("remembers the session without opening or starting music and cleans up an active run on unmount", () => {
    sessionStorage.setItem("sd-invitation-opened", "true");
    const timeline = pendingTimeline();
    mocks.animate.mockReturnValue(timeline);
    const { unmount } = renderInvitation();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.requestMusic).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Open the envelope again" }));
    fireEvent.click(screen.getByRole("button", { name: "Open your invitation" }));
    unmount();
    expect(timeline.stop).toHaveBeenCalledOnce();
    expect(document.body.style.overflow).toBe("");
  });
});
