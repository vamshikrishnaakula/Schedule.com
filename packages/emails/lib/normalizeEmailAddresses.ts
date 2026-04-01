type EmailAddressInput = string | string[] | null | undefined;

const splitAddressString = (value: string): string[] => {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
};

export const normalizeEmailAddresses = (input: EmailAddressInput): string[] => {
  if (!input) {
    return [];
  }

  const values = Array.isArray(input) ? input.flatMap(splitAddressString) : splitAddressString(input);
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalizedValue = value.toLowerCase();
    if (seen.has(normalizedValue)) {
      return false;
    }

    seen.add(normalizedValue);
    return true;
  });
};
