export type RandomSort = "generated" | "ascending" | "descending";

export function secureRandomInt(minimum: number, maximum: number): number {
  const low = Math.ceil(minimum);
  const high = Math.floor(maximum);
  if (!Number.isSafeInteger(low) || !Number.isSafeInteger(high) || high < low) {
    throw new Error("Enter a valid integer range.");
  }
  const range = high - low + 1;
  if (range > 0x1_0000_0000) throw new Error("The range is too large.");
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
    throw new Error("Choose at least two possible characters.");
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
}): string[] {
  const {
    minimum,
    maximum,
    quantity,
    decimalPlaces = 0,
    unique = false,
    sort = "generated",
  } = options;
  if (
    !Number.isFinite(minimum) ||
    !Number.isFinite(maximum) ||
    maximum < minimum
  ) {
    throw new Error("Maximum must be greater than or equal to minimum.");
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new Error("Quantity must be between 1 and 100.");
  }
  if (
    !Number.isInteger(decimalPlaces) ||
    decimalPlaces < 0 ||
    decimalPlaces > 6
  ) {
    throw new Error("Decimal places must be between 0 and 6.");
  }
  const scale = 10 ** decimalPlaces;
  const low = Math.ceil(minimum * scale);
  const high = Math.floor(maximum * scale);
  if (!Number.isSafeInteger(low) || !Number.isSafeInteger(high) || high < low) {
    throw new Error("The range has no values at the selected precision.");
  }
  const available = high - low + 1;
  if (available > 0x1_0000_0000) {
    throw new Error("Reduce the range or decimal precision.");
  }
  if (unique && quantity > available) {
    throw new Error(
      `Only ${available.toLocaleString()} unique values exist in this range.`,
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
  return values.map((value) =>
    decimalPlaces
      ? (value / scale).toFixed(decimalPlaces)
      : value.toString(),
  );
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
): string[] {
  const items = source
    .split(/\r?\n/gu)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!removeDuplicates) return items;
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = caseSensitive ? item : item.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
