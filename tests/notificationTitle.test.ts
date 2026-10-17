import { describe, expect, it } from "vitest";
import { notificationBody, notificationTitle } from "@/lib/notificationTitle";

describe("update titles for staff", () => {
  it("uses the explicit title when there is one", () => {
    expect(notificationTitle({ title: "Status: In progress", text: "anything" })).toBe("Status: In progress");
  });

  it("works out a title for older notifications from the message", () => {
    expect(notificationTitle({ text: "📣 Update on CIV-000042: In progress.\nWork has started.\nTrack: https://x/t/abc" })).toBe("In progress");
    expect(notificationTitle({ text: "📣 Update on CIV-000042: your report has been reviewed by staff and assigned to Roads & Public Works (demo queue).\nTrack: https://x" })).toBe(
      "Team confirmed: Roads & Public Works (demo queue)",
    );
    expect(notificationTitle({ text: "📣 Update on CIV-000042: it is the same problem as an earlier report, so staff linked them." })).toBe("Linked to an earlier report");
  });

  it("shortens a very long first line and never returns an empty title", () => {
    const long = "📣 Update on CIV-000001: " + "word ".repeat(40);
    expect(notificationTitle({ text: long }).length).toBeLessThanOrEqual(70);
    expect(notificationTitle({ text: "" })).toBe("Update");
  });

  it("hides the tracking link line from the message shown to staff", () => {
    expect(notificationBody("📣 Update on CIV-000042: In progress.\nWork has started.\nTrack: https://x/t/abc")).toBe("📣 Update on CIV-000042: In progress.\nWork has started.");
  });
});
