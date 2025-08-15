import { DefaultPassphraseGenerationOptions } from "./data";
import { GeneratorConstraints, PassphraseGenerationOptions } from "./types";
import { optionsToEffWordListRequest, optionsToRandomAsciiRequest, sum, equivalent } from "./util";

describe("sum", () => {
  it("returns 0 when the list is empty", () => {
    expect(sum()).toBe(0);
  });

  it("returns its argument when there's a single number", () => {
    expect(sum(1)).toBe(1);
  });

  it("adds its arguments together", () => {
    expect(sum(1, 2)).toBe(3);
    expect(sum(1, 3)).toBe(4);
    expect(sum(1, 2, 3)).toBe(6);
  });
});

describe("optionsToRandomAsciiRequest", () => {
  it("should map options", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 20,
      ambiguous: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
      minUppercase: 1,
      minLowercase: 2,
      minNumber: 3,
      minSpecial: 4,
    });

    expect(result).toEqual({
      all: 10,
      uppercase: 1,
      lowercase: 2,
      digits: 3,
      special: 4,
      ambiguous: true,
    });
  });

  it("should disable uppercase", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 3,
      ambiguous: true,
      uppercase: false,
      lowercase: true,
      number: true,
      special: true,
      minUppercase: 1,
      minLowercase: 1,
      minNumber: 1,
      minSpecial: 1,
    });

    expect(result).toEqual({
      all: 0,
      uppercase: undefined,
      lowercase: 1,
      digits: 1,
      special: 1,
      ambiguous: true,
    });
  });

  it("should disable lowercase", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 3,
      ambiguous: true,
      uppercase: true,
      lowercase: false,
      number: true,
      special: true,
      minUppercase: 1,
      minLowercase: 1,
      minNumber: 1,
      minSpecial: 1,
    });

    expect(result).toEqual({
      all: 0,
      uppercase: 1,
      lowercase: undefined,
      digits: 1,
      special: 1,
      ambiguous: true,
    });
  });

  it("should disable digits", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 3,
      ambiguous: true,
      uppercase: true,
      lowercase: true,
      number: false,
      special: true,
      minUppercase: 1,
      minLowercase: 1,
      minNumber: 1,
      minSpecial: 1,
    });

    expect(result).toEqual({
      all: 0,
      uppercase: 1,
      lowercase: 1,
      digits: undefined,
      special: 1,
      ambiguous: true,
    });
  });

  it("should disable special", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 3,
      ambiguous: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: false,
      minUppercase: 1,
      minLowercase: 1,
      minNumber: 1,
      minSpecial: 1,
    });

    expect(result).toEqual({
      all: 0,
      uppercase: 1,
      lowercase: 1,
      digits: 1,
      special: undefined,
      ambiguous: true,
    });
  });

  it("should override length with minimums", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 20,
      ambiguous: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
      minUppercase: 1,
      minLowercase: 2,
      minNumber: 3,
      minSpecial: 4,
    });

    expect(result).toEqual({
      all: 10,
      uppercase: 1,
      lowercase: 2,
      digits: 3,
      special: 4,
      ambiguous: true,
    });
  });

  it("should default uppercase", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 2,
      ambiguous: true,
      lowercase: true,
      number: true,
      special: true,
      minUppercase: 2,
      minLowercase: 0,
      minNumber: 0,
      minSpecial: 0,
    });

    expect(result).toEqual({
      all: 0,
      uppercase: 2,
      lowercase: 0,
      digits: 0,
      special: 0,
      ambiguous: true,
    });
  });

  it("should default lowercase", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 0,
      ambiguous: true,
      uppercase: true,
      number: true,
      special: true,
      minUppercase: 0,
      minLowercase: 2,
      minNumber: 0,
      minSpecial: 0,
    });

    expect(result).toEqual({
      all: 0,
      uppercase: 0,
      lowercase: 2,
      digits: 0,
      special: 0,
      ambiguous: true,
    });
  });

  it("should default number", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 0,
      ambiguous: true,
      uppercase: true,
      lowercase: true,
      special: true,
      minUppercase: 0,
      minLowercase: 0,
      minNumber: 2,
      minSpecial: 0,
    });

    expect(result).toEqual({
      all: 0,
      uppercase: 0,
      lowercase: 0,
      digits: 2,
      special: 0,
      ambiguous: true,
    });
  });

  it("should default special", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 0,
      ambiguous: true,
      uppercase: true,
      lowercase: true,
      number: true,
      minUppercase: 0,
      minLowercase: 0,
      minNumber: 0,
      minSpecial: 0,
    });

    expect(result).toEqual({
      all: 0,
      uppercase: 0,
      lowercase: 0,
      digits: 0,
      special: undefined,
      ambiguous: true,
    });
  });

  it("should default minUppercase", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 0,
      ambiguous: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
      minLowercase: 0,
      minNumber: 0,
      minSpecial: 0,
    });

    expect(result).toEqual({
      all: 0,
      uppercase: 1,
      lowercase: 0,
      digits: 0,
      special: 0,
      ambiguous: true,
    });
  });

  it("should default minLowercase", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 0,
      ambiguous: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
      minUppercase: 0,
      minNumber: 0,
      minSpecial: 0,
    });

    expect(result).toEqual({
      all: 0,
      uppercase: 0,
      lowercase: 1,
      digits: 0,
      special: 0,
      ambiguous: true,
    });
  });

  it("should default minNumber", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 0,
      ambiguous: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
      minUppercase: 0,
      minLowercase: 0,
      minSpecial: 0,
    });

    expect(result).toEqual({
      all: 0,
      uppercase: 0,
      lowercase: 0,
      digits: 1,
      special: 0,
      ambiguous: true,
    });
  });

  it("should default minSpecial", async () => {
    const result = optionsToRandomAsciiRequest({
      length: 0,
      ambiguous: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
      minUppercase: 0,
      minLowercase: 0,
      minNumber: 0,
    });

    expect(result).toEqual({
      all: 0,
      uppercase: 0,
      lowercase: 0,
      digits: 0,
      special: 0,
      ambiguous: true,
    });
  });
});

describe("optionsToEffWordListRequest", () => {
  it("should map options", async () => {
    const result = optionsToEffWordListRequest({
      numWords: 6,
      capitalize: true,
      includeNumber: true,
      wordSeparator: "!",
    });

    expect(result).toEqual({
      numberOfWords: 6,
      capitalize: true,
      number: true,
      separator: "!",
    });
  });

  it("should default numWords", async () => {
    const result = optionsToEffWordListRequest({
      capitalize: true,
      includeNumber: true,
      wordSeparator: "!",
    });

    expect(result).toEqual({
      numberOfWords: DefaultPassphraseGenerationOptions.numWords,
      capitalize: true,
      number: true,
      separator: "!",
    });
  });

  it("should default capitalize", async () => {
    const result = optionsToEffWordListRequest({
      numWords: 6,
      includeNumber: true,
      wordSeparator: "!",
    });

    expect(result).toEqual({
      numberOfWords: 6,
      capitalize: DefaultPassphraseGenerationOptions.capitalize,
      number: true,
      separator: "!",
    });
  });

  it("should default includeNumber", async () => {
    const result = optionsToEffWordListRequest({
      numWords: 6,
      capitalize: true,
      wordSeparator: "!",
    });

    expect(result).toEqual({
      numberOfWords: 6,
      capitalize: true,
      number: DefaultPassphraseGenerationOptions.includeNumber,
      separator: "!",
    });
  });

  it("should default wordSeparator", async () => {
    const result = optionsToEffWordListRequest({
      numWords: 6,
      capitalize: true,
      includeNumber: true,
    });

    expect(result).toEqual({
      numberOfWords: 6,
      capitalize: true,
      number: true,
      separator: DefaultPassphraseGenerationOptions.wordSeparator,
    });
  });
});

describe("equivalent", () => {
  // constructs a partial constraints object; only the properties compared
  // by `equivalent` are included.
  function createConstraints(
    policyInEffect: boolean,
    numWordsMin?: number,
    capitalize?: boolean,
  ): GeneratorConstraints<PassphraseGenerationOptions> {
    return {
      constraints: {
        policyInEffect,
        numWords: numWordsMin !== undefined ? { min: numWordsMin } : undefined,
        capitalize: capitalize !== undefined ? { requiredValue: capitalize } : undefined,
      },
    } as unknown as GeneratorConstraints<PassphraseGenerationOptions>;
  }

  it("should return true for identical constraints", () => {
    const lhs = createConstraints(false, 3, true);
    const rhs = createConstraints(false, 3, true);

    expect(equivalent(lhs, rhs)).toBe(true);
  });

  it("should return false when policy effects differ", () => {
    const lhs = createConstraints(true, 3);
    const rhs = createConstraints(false, 3);

    expect(equivalent(lhs, rhs)).toBe(false);
  });

  it("should return false when constraint values differ", () => {
    const lhs = createConstraints(false, 3);
    const rhs = createConstraints(false, 4);

    expect(equivalent(lhs, rhs)).toBe(false);
  });

  it("should return false when one has additional constraints", () => {
    const lhs = createConstraints(false, 3, true);
    const rhs = createConstraints(false, 3);

    expect(equivalent(lhs, rhs)).toBe(false);
  });

  it("should handle undefined constraints", () => {
    const lhs = createConstraints(false);
    const rhs = createConstraints(false);

    expect(equivalent(lhs, rhs)).toBe(true);
  });

  it("should handle empty constraint objects", () => {
    const lhs = {
      constraints: {
        policyInEffect: false,
        numWords: {},
      },
    } as unknown as GeneratorConstraints<PassphraseGenerationOptions>;
    const rhs = {
      constraints: {
        policyInEffect: false,
        numWords: {},
      },
    } as unknown as GeneratorConstraints<PassphraseGenerationOptions>;

    expect(equivalent(lhs, rhs)).toBe(true);
  });

  it("should return false when inner constraint properties differ", () => {
    const lhs = {
      constraints: {
        policyInEffect: false,
        numWords: { min: 3, max: 5 },
      },
    } as any;
    const rhs = {
      constraints: {
        policyInEffect: false,
        numWords: { min: 3, max: 6 },
      },
    } as unknown as GeneratorConstraints<PassphraseGenerationOptions>;

    expect(equivalent(lhs, rhs)).toBe(false);
  });
});
