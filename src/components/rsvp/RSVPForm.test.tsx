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
    render(<RSVPForm previewMode whatsappNumber={null} />);
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

  it("skips accommodation for a decline and clearly identifies unpersisted preview replies", async () => {
    const user = userEvent.setup();
    const fetchMock = stubResponse({ mode: "preview", stored: false });
    render(<RSVPForm previewMode whatsappNumber={null} />);
    await guest(user, "Regretfully declines");
    expect(screen.getByLabelText(/A message for the couple/)).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Will you need accommodation/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RSVP via WhatsApp" })).toBeDisabled();
    expect(screen.getByText(/once the hosts add their contact number/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    await screen.findByText("Preview complete");
    expect(screen.getByLabelText(/Full name/)).toBeEnabled();
    expect(screen.getByLabelText(/Full name/)).toHaveValue("A Guest");
    expect(screen.getByRole("status")).toHaveTextContent("has not been stored or emailed");
    const options = fetchMock.mock.calls[0][1];
    const payload = JSON.parse(options.body);
    expect(payload).toMatchObject({ attendanceStatus: "declined", accommodationStatus: "not_applicable", budgetAmount: null, nights: null, roomOccupants: null });
    expect(options.headers["Idempotency-Key"]).toMatch(/^[a-f\d-]{36}$/i);
    await user.type(screen.getByLabelText(/A message for the couple/), "With love");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it.each(["No, I have my own arrangements", "I'm not sure yet"])("does not require stay preferences for %s", async (choice) => {
    const user = userEvent.setup();
    const fetchMock = stubResponse({ stored: true, id: "test-rsvp-id" });
    render(<RSVPForm previewMode={false} whatsappNumber={null} />);
    await guest(user);
    await user.click(screen.getByLabelText("Yes"));
    await user.type(screen.getByLabelText(/Budget per room per night/), "120");
    await user.click(screen.getByLabelText(choice));
    expect(screen.queryByLabelText(/Budget per room per night/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    await screen.findByText("Your reply is received");
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.accommodationStatus).toBe(choice.startsWith("No,") ? "no" : "unsure");
    expect(payload.budgetAmount).toBeNull();
    expect(payload.nights).toBeNull();
    expect(payload.roomOccupants).toBeNull();
  });

  it("reveals preferences inline, preserves them when toggled, and confirms storage without replacing the form", async () => {
    const user = userEvent.setup();
    const fetchMock = stubResponse({ stored: true, id: "test-rsvp-id" });
    render(<RSVPForm previewMode={false} whatsappNumber="+250 788 000 000" />);
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
    await screen.findByText("Your reply is received");
    expect(screen.getByRole("status")).toHaveTextContent("Your RSVP has been saved");
    expect(screen.getByRole("status")).toHaveTextContent("No accommodation has been booked");
    expect(screen.getByLabelText(/Full name/)).toBeDisabled();
    expect(screen.getByLabelText(/Budget per room per night/)).toHaveValue(180000);
    expect(screen.getByRole("button", { name: /RSVP sent/ })).toBeDisabled();
    fireEvent.submit(screen.getByRole("form", { name: "Wedding RSVP" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.click(screen.getByText("View your saved reply"));
    expect(screen.getByText("RWF 180,000")).toBeVisible();
  });

  it("rejects zero budget and fractional nights and occupants", async () => {
    const user = userEvent.setup();
    render(<RSVPForm previewMode whatsappNumber={null} />);
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
    render(<RSVPForm previewMode={false} whatsappNumber={null} />);
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

  it("does not show success without a confirmed persisted record", async () => {
    const user = userEvent.setup();
    stubResponse({ stored: false });
    render(<RSVPForm previewMode={false} whatsappNumber={null} />);
    await guest(user, "Regretfully declines");
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t confirm your RSVP");
    expect(screen.queryByText("Your reply is received")).not.toBeInTheDocument();
  });

  it("retains the reply and handles unavailable secure randomness without sending", async () => {
    const user = userEvent.setup();
    const fetchMock = stubResponse({ stored: true, id: "test-rsvp-id" });
    vi.spyOn(crypto, "randomUUID").mockImplementationOnce(() => { throw new Error("unavailable"); });
    render(<RSVPForm previewMode={false} whatsappNumber={null} />);
    await guest(user, "Regretfully declines");
    await user.click(screen.getByRole("button", { name: /Send My RSVP/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your details are still here");
    expect(screen.getByRole("button", { name: /Try Again/ })).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
