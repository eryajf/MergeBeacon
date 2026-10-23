export function getErrorMessage(error: unknown, fallback: string): string {
  if (error === null || error === undefined) {
    return fallback;
  }

  if (typeof error === "string") {
    return error.trim() || fallback;
  }

  if (error instanceof Error) {
    const message = String(error).trim();
    return message || fallback;
  }

  if (typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  return fallback;
}
