import { webcrypto } from "node:crypto";
import {
  generateRandomNumbers,
  passwordEntropyBits,
  prepareRandomList,
  secureRandomInt,
  secureRandomString,
  secureShuffle,
  uniqueCharacters,
} from "../random";

describe("secure random utilities", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: webcrypto,
    });
  });

  it("generates bounded integers, strings, and non-mutating shuffles", () => {
    for (let index = 0; index < 50; index += 1) {
      expect(secureRandomInt(2, 4)).toBeGreaterThanOrEqual(2);
      expect(secureRandomInt(2, 4)).toBeLessThanOrEqual(4);
    }
    expect(secureRandomString(24, "abc")).toMatch(/^[abc]{24}$/u);
    const source = ["a", "b", "c"];
    expect(secureShuffle(source)).toEqual(expect.arrayContaining(source));
    expect(source).toEqual(["a", "b", "c"]);
  });

  it("generates unique fixed-precision values and validates capacity", () => {
    const values = generateRandomNumbers({
      minimum: 1,
      maximum: 1.02,
      quantity: 3,
      decimalPlaces: 2,
      unique: true,
      sort: "ascending",
    });
    expect(values).toEqual(["1.00", "1.01", "1.02"]);
    expect(() =>
      generateRandomNumbers({
        minimum: 1,
        maximum: 2,
        quantity: 3,
        unique: true,
      }),
    ).toThrow("Only 2 unique");
  });

  it("deduplicates Unicode alphabets and list entries", () => {
    expect(uniqueCharacters("aab😀😀c")).toBe("ab😀c");
    expect(prepareRandomList("One\none\nTwo\n\n", true, false)).toEqual([
      "One",
      "Two",
    ]);
    expect(passwordEntropyBits(16, 64)).toBe(96);
  });
});
