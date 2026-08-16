/**
 * Convierte conteos en porcentajes enteros que siempre suman 100
 * (método del resto mayor / Hamilton). Evita que el redondeo independiente
 * deje 99% o 101% al mostrar una distribución.
 */
export function roundPercentagesTo100(counts: number[]): number[] {
  if (counts.length === 0) return [];

  const safe = counts.map((c) => (Number.isFinite(c) && c > 0 ? c : 0));
  const total = safe.reduce((sum, n) => sum + n, 0);
  if (total <= 0) return counts.map(() => 0);

  const exact = safe.map((c) => (c / total) * 100);
  const floors = exact.map((p) => Math.floor(p + 1e-9));
  let remaining = 100 - floors.reduce((sum, n) => sum + n, 0);

  const order = exact
    .map((p, index) => ({
      index,
      frac: p - floors[index],
      count: safe[index],
    }))
    .sort((a, b) => b.frac - a.frac || b.count - a.count || a.index - b.index);

  const result = [...floors];
  if (remaining > 0) {
    for (let i = 0; i < remaining && i < order.length; i++) {
      result[order[i].index] += 1;
    }
  } else if (remaining < 0) {
    const rev = [...order].reverse();
    for (let i = 0; i < -remaining && i < rev.length; i++) {
      if (result[rev[i].index] > 0) result[rev[i].index] -= 1;
    }
  }
  return result;
}
