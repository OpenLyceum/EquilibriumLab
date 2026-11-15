/**
 * markupToSpeech.ts
 *
 * Strip RichText markup to plain text for screen-reader responses.
 */

/** RichText markup to plain text for screen-reader responses. */
export function markupToSpeech(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
