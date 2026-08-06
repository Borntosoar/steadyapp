/* Minimal inline emphasis parser for **bold** and *italic*.
 *
 * Deliberately not a markdown library: the module content uses exactly two marks, and a
 * parser dependency would be more surface area than the feature is worth. Unmatched
 * markers render literally rather than swallowing the rest of the paragraph.
 *
 * Lives in lib/ rather than beside the component so it stays plain TypeScript and can be
 * unit-tested without a JSX toolchain. */

export interface Token {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export function parseInline(input: string): Token[] {
  const tokens: Token[] = [];
  // Bold alternative comes first so `**x**` is never read as two italic runs.
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(input)) !== null) {
    if (m.index > last) tokens.push({ text: input.slice(last, m.index) });
    const raw = m[0];
    if (raw.startsWith('**')) tokens.push({ text: raw.slice(2, -2), bold: true });
    else tokens.push({ text: raw.slice(1, -1), italic: true });
    last = m.index + raw.length;
  }
  if (last < input.length) tokens.push({ text: input.slice(last) });
  return tokens;
}
