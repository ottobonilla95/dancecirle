// String interpolation: replaces {var} placeholders with values
// Safe for both client and server components
export function tReplace(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replaceAll(`{${key}}`, String(val)),
    template
  );
}
