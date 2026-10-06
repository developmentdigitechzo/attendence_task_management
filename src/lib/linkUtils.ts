/**
 * Utility functions for extracting, verifying, and formatting web links in chat messages.
 */

export interface VerifiedLinkInfo {
  url: string;
  isValid: boolean;
  isSecure: boolean;
  hostname: string;
  protocol: string;
  displayUrl: string;
  error?: string;
}

/**
 * Extracts all http/https URLs from a string of text.
 */
export function extractUrls(text?: string | null): string[] {
  if (!text || typeof text !== "string") return [];
  try {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const matches = text.match(urlRegex);
    return matches ? Array.from(new Set(matches)) : [];
  } catch {
    return [];
  }
}

/**
 * Verifies whether a string is a valid and safe HTTP/HTTPS URL.
 */
export function verifyUrl(inputUrl?: string | null): VerifiedLinkInfo {
  if (!inputUrl || typeof inputUrl !== "string") {
    return {
      url: "",
      isValid: false,
      isSecure: false,
      hostname: "",
      protocol: "",
      displayUrl: "",
      error: "No URL provided.",
    };
  }

  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return {
      url: "",
      isValid: false,
      isSecure: false,
      hostname: "",
      protocol: "",
      displayUrl: "",
      error: "Empty URL.",
    };
  }

  // If missing protocol, prepend https://
  let normalized = trimmed;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = "https://" + normalized;
  }

  try {
    const parsed = new URL(normalized);

    // Validate protocol
    const isHttp = parsed.protocol === "http:";
    const isHttps = parsed.protocol === "https:";

    if (!isHttp && !isHttps) {
      return {
        url: normalized,
        isValid: false,
        isSecure: false,
        hostname: "",
        protocol: parsed.protocol || "",
        displayUrl: trimmed,
        error: "Only HTTP and HTTPS links are allowed.",
      };
    }

    // Validate hostname
    if (!parsed.hostname || parsed.hostname.length < 3 || !parsed.hostname.includes(".")) {
      return {
        url: normalized,
        isValid: false,
        isSecure: false,
        hostname: parsed.hostname || "",
        protocol: parsed.protocol || "",
        displayUrl: trimmed,
        error: "Invalid domain or hostname format.",
      };
    }

    // Check for IP or local address warnings
    const isLocalhost =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname.startsWith("192.168.");

    return {
      url: parsed.href,
      isValid: true,
      isSecure: isHttps,
      hostname: parsed.hostname,
      protocol: (parsed.protocol || "").replace(":", ""),
      displayUrl: parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : ""),
      error: isLocalhost ? "Internal network/localhost address" : undefined,
    };
  } catch {
    return {
      url: normalized,
      isValid: false,
      isSecure: false,
      hostname: "",
      protocol: "",
      displayUrl: trimmed,
      error: "Malformed URL format. Check the address spelling.",
    };
  }
}
