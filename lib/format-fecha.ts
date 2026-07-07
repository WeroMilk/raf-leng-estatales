const TZ_SONORA = "America/Hermosillo";

/** Formato: dd/mm/yyyy, hh:mm:ss a.m./p.m. (hora de Sonora) */
export function formatUltimaActualizacion(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ_SONORA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const day = get("day");
  const month = get("month");
  const year = get("year");
  const hour24 = parseInt(get("hour"), 10);
  const minute = get("minute");
  const second = get("second");
  const hour12 = hour24 % 12 || 12;
  const ampm = hour24 >= 12 ? "p.m." : "a.m.";

  return `${day}/${month}/${year}, ${String(hour12).padStart(2, "0")}:${minute}:${second} ${ampm}`;
}
