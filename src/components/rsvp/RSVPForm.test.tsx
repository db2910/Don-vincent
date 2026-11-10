import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RSVPForm from "./RSVPForm";

type User = ReturnType<typeof userEvent.setup>;

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function guest(user: User, attendance = "Joyfully accepts") {
  await user.type(screen.getByLabelText(/Full name/), "A Guest");
  await user.type(screen.getByLabelText(/Phone or email/), "guest@example.com");
  await user.click(screen.getByLabelText(attendance));
}

async function stay(user: User) {
  await user.click(screen.getByLabelText("Yes"));
  await user.selectOptions(screen.getByLabelText("Currency"), "RWF");
  await user.type(screen.getByLabelText(/Budget per room per night/), "180000");
  await user.type(screen.getByLabelText(/How many nights/), "3");
  await user.click(screen.getByLabelText("Bed and breakfast"));
  await user.click(screen.getByLabelText("Hotel"));
  await user.click(screen.getByLabelText("I'll share with my own group"));
  await user.type(screen.getByLabelText(/How many people/), "2");
}

function stubResponse(body: object) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("RSVP guest journey", { timeout: 15_000 }, () => {
  it("shows one continuous form and links accessible validation errors to the fields", async () => {
    const user = userEvent.setup();
    render(<RSVPForm whatsappNumber={null} />);
    expect(screen.queryByRole("button", { name: /Continue|Back/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Will you need accommodation/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please check");
    expect(screen.getByLabelText(/Full name/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/Phone or email/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/A message for the couple/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveFocus());
    await user.click(screen.getByRole("link", { name: "Please enter your full name." }));
    expect(screen.getByLabelText(/Full name/)).toHaveFocus();
  });

  it("submits a decline without accommodation or unavailable WhatsApp actions", async () => {
    const user = userEvent.setup();
    const fetchMock = stubResponse({ submitted: true, reference: "decline-reference" });
    render(<RSVPForm whatsappNumber={null} />);
    await guest(user, "Regretfully declines");
    expect(screen.getByLabelText(/A message for the couple/)).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Will you need accommodation/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "RSVP via WhatsApp" })).not.toBeInTheDocument();
    expect(screen.queryByText(/RSVP preview|once the hosts add their contact number/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    await screen.findByText("Your reply has been submitted");
    expect(screen.getByLabelText(/Full name/)).toBeDisabled();
    expect(screen.getByLabelText(/Full name/)).toHaveValue("A Guest");
    const options = fetchMock.mock.calls[0][1];
    const payload = JSON.parse(options.body);
    expect(payload).toMatchObject({ attendanceStatus: "declined", accommodationStatus: "not_applicable", budgetAmount: null, nights: null, roomOccupants: null });
    expect(options.headers["Idempotency-Key"]).toMatch(/^[a-f\d-]{36}$/i);
  });

  it.each(["No, I have my own arrangements", "I'm not sure yet"])("does not require stay preferences for %s", async (choice) => {
    const user = userEvent.setup();
    const fetchMock = stubResponse({ submitted: true, reference: "test-rsvp-reference" });
    render(<RSVPForm whatsappNumber={null} />);
    await guest(user);
    await user.click(screen.getByLabelText("Yes"));
    await user.type(screen.getByLabelText(/Budget per room per night/), "120");
    await user.click(screen.getByLabelText(choice));
    expect(screen.queryByLabelText(/Budget per room per night/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    await screen.findByText("Your reply has been submitted");
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.accommodationStatus).toBe(choice.startsWith("No,") ? "no" : "unsure");
    expect(payload.budgetAmount).toBeNull();
    expect(payload.nights).toBeNull();
    expect(payload.roomOccupants).toBeNull();
  });

  it("reveals preferences inline, preserves them when toggled, and confirms submission without replacing the form", async () => {
    const user = userEvent.setup();
    const fetchMock = stubResponse({ submitted: true, reference: "test-rsvp-reference" });
    render(<RSVPForm whatsappNumber="+250 788 000 000" />);
    await guest(user);
    await stay(user);
    await user.click(screen.getByLabelText("No, I have my own arrangements"));
    expect(screen.queryByLabelText(/Budget per room per night/)).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Yes"));
    expect(screen.getByLabelText(/Budget per room per night/)).toHaveValue(180000);
    expect(screen.getByLabelText(/How many nights/)).toHaveValue(3);
    expect(screen.getByLabelText("Bed and breakfast")).toBeChecked();
    await user.click(screen.getByLabelText("Regretfully declines"));
    expect(screen.queryByRole("group", { name: /Will you need accommodation/ })).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Joyfully accepts"));
    expect(screen.getByLabelText(/Budget per room per night/)).toHaveValue(180000);
    const whatsapp = screen.getByRole("link", { name: /RSVP via WhatsApp/ });
    expect(whatsapp).toHaveAttribute("href", expect.stringContaining("https://wa.me/250788000000?text="));
    expect(decodeURIComponent(whatsapp.getAttribute("href")!)).toContain("Budget / room / night: RWF 180,000");
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    await screen.findByText("Your reply has been submitted");
    expect(screen.getByRole("status")).toHaveTextContent("Thank you for replying");
    expect(screen.getByRole("status")).toHaveTextContent("No accommodation has been booked");
    expect(screen.getByLabelText(/Full name/)).toBeDisabled();
    expect(screen.getByLabelText(/Budget per room per night/)).toHaveValue(180000);
    expect(screen.getByRole("button", { name: /RSVP sent/ })).toBeDisabled();
    fireEvent.submit(screen.getByRole("form", { name: "Wedding RSVP" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.click(screen.getByText("View your submitted reply"));
    expect(screen.getByText("RWF 180,000")).toBeVisible();
  });

  it("does not mistake an old preview response for a real submission", async () => {
    const user = userEvent.setup();
    stubResponse({ mode: "preview", sent: false });
    render(<RSVPForm whatsappNumber={null} />);
    await guest(user, "Regretfully declines");
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t confirm your RSVP");
    expect(screen.queryByText("Preview complete")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/)).toBeEnabled();
  });

  it("rejects zero budget and fractional nights and occupants", async () => {
    const user = userEvent.setup();
    render(<RSVPForm whatsappNumber={null} />);
    await guest(user);
    await user.click(screen.getByLabelText("Yes"));
    fireEvent.change(screen.getByLabelText(/Budget per room per night/), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText(/How many nights/), { target: { value: "1.5" } });
    fireEvent.change(screen.getByLabelText(/How many people/), { target: { value: "1.5" } });
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    expect(screen.getByLabelText(/Budget per room per night/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/How many nights/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/How many people/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/A message for the couple/)).toBeInTheDocument();
    await user.click(screen.getByLabelText("No, I have my own arrangements"));
    expect(screen.queryByText("Please enter a budget greater than zero.")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /How many nights/ })).not.toBeInTheDocument();
  });

  it("keeps the same idempotency key after a network failure and changes it for an edited reply", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    render(<RSVPForm whatsappNumber={null} />);
    await guest(user, "Regretfully declines");
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    await screen.findByRole("button", { name: /Try Again/ });
    expect(screen.getByRole("alert")).toHaveTextContent("couldn’t confirm your RSVP");
    await user.click(screen.getByRole("button", { name: /Try Again/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toBe(fetchMock.mock.calls[1][1].headers["Idempotency-Key"]);
    await user.type(screen.getByLabelText(/A message for the couple/), "Sending our love!");
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[2][1].headers["Idempotency-Key"]).not.toBe(fetchMock.mock.calls[1][1].headers["Idempotency-Key"]);
  });

  it("explains activation failures and retains the form without showing provider text", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ code: "activation_required", error: "Raw service text with private@example.test" }) }));
    render(<RSVPForm whatsappNumber="250788408241" />);
    await guest(user, "Regretfully declines");
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("awaiting confirmation from the hosts");
    expect(alert).not.toHaveTextContent("private@example.test");
    expect(screen.getByLabelText(/Full name/)).toHaveValue("A Guest");
    expect(screen.getByRole("link", { name: /RSVP via WhatsApp/ })).toHaveAttribute("href", expect.stringContaining("wa.me/250788408241"));
    expect(screen.queryByText("Your reply has been submitted")).not.toBeInTheDocument();
  });

  it("does not show success without a confirmed submission", async () => {
    const user = userEvent.setup();
    stubResponse({ sent: false });
    render(<RSVPForm whatsappNumber={null} />);
    await guest(user, "Regretfully declines");
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t confirm your RSVP");
    expect(screen.queryByText("Your reply has been submitted")).not.toBeInTheDocument();
  });

  it("retains the reply and handles unavailable secure randomness without sending", async () => {
    const user = userEvent.setup();
    const fetchMock = stubResponse({ submitted: true, reference: "test-rsvp-reference" });
    vi.spyOn(crypto, "randomUUID").mockImplementationOnce(() => { throw new Error("unavailable"); });
    render(<RSVPForm whatsappNumber={null} />);
    await guest(user, "Regretfully declines");
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your details are still here");
    expect(screen.getByRole("button", { name: /Try Again/ })).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
