export function seededRandom(seed = Date.now()) {
  let state = (Number(seed) >>> 0) || 1;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function shuffle(items, rng) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Mit ?seed=<Zahl> in der Adresse wird jede Runde reproduzierbar (für Tests); sonst echter Zufall.
export function createRandomSource(search = window.location.search) {
  const seed = new URLSearchParams(search).get('seed');
  return seed !== null && seed.trim() !== '' && Number.isFinite(Number(seed)) ? seededRandom(Number(seed)) : Math.random;
}
