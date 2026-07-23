import { CategoryId, lookupTerm, MAX_TERM_WORDS } from "./categories";

export interface ParsedItem {
  name: string;
  category: CategoryId;
  quantity?: number;
}

// Words that split a dictated stream into separate item phrases.
const SEPARATORS = new Set([
  "and", "also", "then", "next", "plus", "aswell",
]);

// Filler words we can safely drop when they aren't part of a lexicon match.
const FILLERS = new Set([
  "um", "uh", "erm", "er", "hmm", "mmm", "ah", "oh", "yeah", "yep", "no",
  "we", "i", "we're", "i'm", "need", "needs", "want", "wants", "get", "gets",
  "buy", "grab", "pick", "some", "a", "an", "the", "bit", "of", "to", "for",
  "please", "gotta", "got", "have", "haven't", "out", "run", "running", "low",
  "on", "lets", "let's", "see", "ok", "okay", "right", "so", "just", "well",
  "as", "think", "don't", "dont", "forget", "remember", "put", "list", "add",
  "maybe", "more", "another", "you", "know", "that's", "thats", "it", "us",
  "should", "probably", "definitely", "actually", "few", "couple", "pack",
  "packs", "packet", "bag", "bottle", "tin", "can", "box", "jar", "loads",
  "lots", "little", "in", "kitchen", "fridge", "cupboard's", "empty", "there's",
  "theres", "is", "are", "any", "anything", "else", "what", "do", "shopping",
]);

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, dozen: 12,
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,;!?]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Parse a chunk of dictated (or typed) text into shopping items.
 *
 * Strategy: scan tokens left to right, greedily matching the longest
 * possible lexicon phrase at each position (so "washing up liquid" and
 * "black pepper" survive intact). Number words attach as quantities to the
 * next item. Runs of unrecognised words between separators become a single
 * "other" item, so unusual products still make the list.
 */
export function parseTranscript(text: string): ParsedItem[] {
  const tokens = tokenize(text);
  const items: ParsedItem[] = [];

  let pendingQty: number | undefined;
  let unknownBuffer: string[] = [];

  const flushUnknown = () => {
    if (unknownBuffer.length === 0) return;
    const name = unknownBuffer.join(" ");
    items.push({ name, category: "other", quantity: pendingQty });
    pendingQty = undefined;
    unknownBuffer = [];
  };

  let i = 0;
  while (i < tokens.length) {
    // Try the longest lexicon match starting at this token.
    let matched = false;
    const maxLen = Math.min(MAX_TERM_WORDS, tokens.length - i);
    for (let len = maxLen; len >= 1; len--) {
      const phrase = tokens.slice(i, i + len).join(" ");
      const category = lookupTerm(phrase);
      if (category) {
        flushUnknown();
        items.push({ name: phrase, category, quantity: pendingQty });
        pendingQty = undefined;
        i += len;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const token = tokens[i];

    if (SEPARATORS.has(token)) {
      flushUnknown();
      i++;
      continue;
    }

    const numeric = /^\d+$/.test(token) ? parseInt(token, 10) : NUMBER_WORDS[token];
    if (numeric !== undefined && numeric > 0) {
      flushUnknown();
      pendingQty = numeric;
      i++;
      continue;
    }

    if (FILLERS.has(token)) {
      // Fillers end an unknown run too ("something for the dog" shouldn't
      // glue together across "for the").
      flushUnknown();
      i++;
      continue;
    }

    unknownBuffer.push(token);
    i++;
  }
  flushUnknown();

  return items;
}
