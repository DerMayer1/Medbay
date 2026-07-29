import { afterEach, describe, expect, it, vi } from "vitest";
import { logger, setErrorReporter } from "@/lib/observability";

afterEach(() => {
  setErrorReporter(undefined);
  vi.restoreAllMocks();
});

function captureError() {
  return vi.spyOn(console, "error").mockImplementation(() => undefined);
}

describe("structured logging", () => {
  it("emits a single JSON line carrying the event and context", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    logger.info("brief_version_generated", { caseId: "case-1", versionId: "version-1" });

    expect(spy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(spy.mock.calls[0][0] as string);
    expect(line).toMatchObject({
      level: "info",
      event: "brief_version_generated",
      caseId: "case-1",
      versionId: "version-1",
    });
    expect(typeof line.timestamp).toBe("string");
  });

  it("serializes errors without losing the message", () => {
    const spy = captureError();

    logger.error("ai_provider_error", new Error("provider timed out"), { caseId: "case-1" });

    const line = JSON.parse(spy.mock.calls[0][0] as string);
    expect(line.level).toBe("error");
    expect(line.error).toMatchObject({ name: "Error", message: "provider timed out" });
    expect(line.caseId).toBe("case-1");
  });

  it("handles a thrown non-error value", () => {
    const spy = captureError();

    logger.error("calendar_provider_error", "string failure");

    const line = JSON.parse(spy.mock.calls[0][0] as string);
    expect(line.error).toMatchObject({ name: "NonError", message: "string failure" });
  });

  it("forwards errors to a registered reporter with the event name", () => {
    captureError();
    const reporter = vi.fn();
    setErrorReporter(reporter);

    const failure = new Error("provider timed out");
    logger.error("ai_provider_error", failure, { caseId: "case-1" });

    expect(reporter).toHaveBeenCalledWith(failure, { event: "ai_provider_error", caseId: "case-1" });
  });

  it("does not let a failing reporter mask the original error", () => {
    const spy = captureError();
    setErrorReporter(() => {
      throw new Error("reporter is down");
    });

    expect(() => logger.error("chat_error", new Error("original"))).not.toThrow();
    expect(JSON.parse(spy.mock.calls[0][0] as string).error.message).toBe("original");
  });
});
