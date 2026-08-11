export type RandomSort = "generated" | "ascending" | "descending";

export type RandomErrorCode =
  | "invalid_integer_range"
  | "range_too_large"
  | "alphabet_too_small"
  | "invalid_range"
  | "invalid_quantity"
  | "invalid_decimal_places"
  | "precision_range_empty"
  | "precision_range_too_large"
  | "unique_values_unavailable";

export class RandomToolError extends Error {
  constructor(
    public readonly code: RandomErrorCode,
    message: string,
    public readonly values: Readonly<Record<string, number>> = {},
  ) {
    super(message);
    this.name = "RandomToolError";
  }
}

export function secureRandomInt(minimum: number, maximum: number): number {
  const low = Math.ceil(minimum);
  const high = Math.floor(maximum);
  if (!Number.isSafeInteger(low) || !Number.isSafeInteger(high) || high < low) {
    throw new RandomToolError(
      "invalid_integer_range",
      "Enter a valid integer range.",
    );
  }
  const range = high - low + 1;
  if (range > 0x1_0000_0000) {
    throw new RandomToolError("range_too_large", "The range is too large.");
  }
  const limit = Math.floor(0x1_0000_0000 / range) * range;
  const values = new Uint32Array(1);
  do crypto.getRandomValues(values);
  while (values[0] >= limit);
  return low + (values[0] % range);
}

export function secureRandomString(length: number, alphabet: string): string {
  const safeLength = Math.min(4096, Math.max(1, Math.floor(length)));
  const characters = Array.from(alphabet);
  if (characters.length < 2) {
    throw new RandomToolError(
      "alphabet_too_small",
      "Choose at least two possible characters.",
    );
  }
  return Array.from(
    { length: safeLength },
    () => characters[secureRandomInt(0, characters.length - 1)],
  ).join("");
}

export function secureShuffle<T>(values: readonly T[]): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const next = secureRandomInt(0, index);
    [shuffled[index], shuffled[next]] = [shuffled[next], shuffled[index]];
  }
  return shuffled;
}

export function generateRandomNumbers(options: {
  minimum: number;
  maximum: number;
  quantity: number;
  decimalPlaces?: number;
  unique?: boolean;
  sort?: RandomSort;
  locale?: string;
}): string[] {
  const {
    minimum,
    maximum,
    quantity,
    decimalPlaces = 0,
    unique = false,
    sort = "generated",
    locale = "en",
  } = options;
  if (
    !Number.isFinite(minimum) ||
    !Number.isFinite(maximum) ||
    maximum < minimum
  ) {
    throw new RandomToolError(
      "invalid_range",
      "Maximum must be greater than or equal to minimum.",
    );
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new RandomToolError(
      "invalid_quantity",
      "Quantity must be between 1 and 100.",
    );
  }
  if (
    !Number.isInteger(decimalPlaces) ||
    decimalPlaces < 0 ||
    decimalPlaces > 6
  ) {
    throw new RandomToolError(
      "invalid_decimal_places",
      "Decimal places must be between 0 and 6.",
    );
  }
  const scale = 10 ** decimalPlaces;
  const low = Math.ceil(minimum * scale);
  const high = Math.floor(maximum * scale);
  if (!Number.isSafeInteger(low) || !Number.isSafeInteger(high) || high < low) {
    throw new RandomToolError(
      "precision_range_empty",
      "The range has no values at the selected precision.",
    );
  }
  const available = high - low + 1;
  if (available > 0x1_0000_0000) {
    throw new RandomToolError(
      "precision_range_too_large",
      "Reduce the range or decimal precision.",
    );
  }
  if (unique && quantity > available) {
    throw new RandomToolError(
      "unique_values_unavailable",
      `Only ${available.toLocaleString(locale)} unique values exist in this range.`,
      { available },
    );
  }

  const values: number[] = [];
  const used = new Set<number>();
  while (values.length < quantity) {
    const scaled = secureRandomInt(low, high);
    if (unique && used.has(scaled)) continue;
    used.add(scaled);
    values.push(scaled);
  }
  if (sort !== "generated") {
    values.sort((first, second) =>
      sort === "ascending" ? first - second : second - first,
    );
  }
  const formatter = new Intl.NumberFormat(locale, {
    useGrouping: false,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
  return values.map((value) => formatter.format(value / scale));
}

export function uniqueCharacters(value: string): string {
  return Array.from(new Set(Array.from(value))).join("");
}

export function passwordEntropyBits(length: number, alphabetSize: number) {
  if (length < 1 || alphabetSize < 2) return 0;
  return length * Math.log2(alphabetSize);
}

export function prepareRandomList(
  source: string,
  removeDuplicates = true,
  caseSensitive = false,
  locale = "en",
): string[] {
  const items = source
    .split(/\r?\n/gu)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!removeDuplicates) return items;
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = caseSensitive ? item : item.toLocaleLowerCase(locale);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
