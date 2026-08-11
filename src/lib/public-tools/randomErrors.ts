import { RandomToolError } from "./random";

export type RandomErrorKey =
  | "invalidIntegerRange"
  | "rangeTooLarge"
  | "stringAlphabet"
  | "invalidRange"
  | "count"
  | "decimalPlaces"
  | "precisionRange"
  | "uniqueUnavailable"
  | "generic";

export function classifyRandomError(error: unknown): {
  key: RandomErrorKey;
  values: Readonly<Record<string, number>>;
} {
  if (!(error instanceof RandomToolError)) {
    return { key: "generic", values: {} };
  }

  switch (error.code) {
    case "invalid_integer_range":
      return { key: "invalidIntegerRange", values: error.values };
    case "range_too_large":
    case "precision_range_too_large":
      return { key: "rangeTooLarge", values: error.values };
    case "alphabet_too_small":
      return { key: "stringAlphabet", values: error.values };
    case "invalid_range":
      return { key: "invalidRange", values: error.values };
    case "invalid_quantity":
      return { key: "count", values: error.values };
    case "invalid_decimal_places":
      return { key: "decimalPlaces", values: error.values };
    case "precision_range_empty":
      return { key: "precisionRange", values: error.values };
    case "unique_values_unavailable":
      return { key: "uniqueUnavailable", values: error.values };
  }
}
