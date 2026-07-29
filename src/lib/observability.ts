/**
 * Structured logging and a vendor-neutral error reporting seam.
 *
 * Logs are emitted as single-line JSON so a platform log drain can index them.
 * Errors additionally go to a reporter, which is a no-op until one is
 * registered — Sentry or an equivalent can be attached in instrumentation
 * without touching any call site.
 *
 * Nothing here may carry patient content. Log identifiers, decisions and
 * counts; never message bodies, extracted fields, page text or quotes.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = {
  /** Correlates every line emitted while handling one request. */
  requestId?: string;
  clinicId?: string;
  caseId?: string;
  versionId?: string;
  route?: string;
  [key: string]: unknown;
};

export type ErrorReporter = (error: unknown, context: LogContext) => void;

let reporter: ErrorReporter | undefined;

/** Registers the process-wide error reporter. Intended for instrumentation. */
export function setErrorReporter(next: ErrorReporter | undefined) {
  reporter = next;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      // Stacks are kept out of production logs; the reporter receives the error
      // object itself and can capture more detail under its own controls.
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    };
  }
  return { name: "NonError", message: String(error) };
}

function emit(level: LogLevel, event: string, context: LogContext = {}, error?: unknown) {
  const line = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...context,
    ...(error === undefined ? {} : { error: serializeError(error) }),
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, context?: LogContext) => emit("debug", event, context),
  info: (event: string, context?: LogContext) => emit("info", event, context),
  warn: (event: string, context?: LogContext) => emit("warn", event, context),
  error: (event: string, error: unknown, context: LogContext = {}) => {
    emit("error", event, context, error);
    try {
      reporter?.(error, { event, ...context });
    } catch {
      // A failing reporter must never mask the original error.
    }
  },
};

/** Stable identifier used to correlate log lines for a single request. */
export function newRequestId() {
  return crypto.randomUUID();
}
