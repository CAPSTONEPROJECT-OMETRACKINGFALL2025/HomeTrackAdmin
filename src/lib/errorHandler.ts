import { ApiError } from "./api";

/**
 * Extracts a friendly error message from an API error
 * Checks for .error field first, then .message, then falls back to default message
 */
export const getErrorMessage = (error: unknown, defaultMessage: string = "An error occurred"): string => {
  if (error instanceof ApiError) {
    // Check for .error field in payload (most common case)
    if (error.payload && typeof error.payload === "object") {
      const payload = error.payload as any;
      // Check for .error field first
      if (payload.error) {
        return String(payload.error);
      }
      // Check for .message field
      if (payload.message) {
        return String(payload.message);
      }
    }
    // Use the error message if it's not a generic HTTP error message
    if (error.message && !error.message.includes("Request failed with status")) {
      return error.message;
    }
  }
  
  // For other error types
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  
  // Fallback
  return defaultMessage;
};

