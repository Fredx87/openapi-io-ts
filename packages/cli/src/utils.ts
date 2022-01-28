export function toValidVariableName(
  input: string,
  casing: "camel" | "pascal"
): string {
  const joined = input
    .split(" ")
    .map(removeInvalidChars)
    .map((i) => capitalize(i, "pascal"))
    .join("");

  return capitalize(joined, casing);
}

export type CapitalizeCasing = "camel" | "pascal";

export function capitalize(input: string, casing: CapitalizeCasing): string {
  const firstChar =
    casing === "camel"
      ? input.charAt(0).toLocaleLowerCase()
      : input.charAt(0).toLocaleUpperCase();
  return firstChar + input.slice(1);
}

function removeInvalidChars(input: string): string {
  return input.replace(/(\W+)/gi, "");
}
