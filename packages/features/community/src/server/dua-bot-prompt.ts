// Hidden technical contract the engine always appends so the reply can be parsed.
// Not editorial — admins never need to write this.
export const RETRIEVE_OUTPUT_CONTRACT =
  'Return strict JSON only: {"dua": string, "hashtag": string}. If there is no complete dua in the required output language, return {"dua": "", "hashtag": ""}.';
