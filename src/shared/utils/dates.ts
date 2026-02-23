// utils/dates.ts
export function toInstantISO(value?: string | null) {
  if (!value) return null;                  // value = "2025-09-13T00:55" from <input type="datetime-local">
  const d = new Date(value);                // Interpreted as local time
  return d.toISOString();                   // -> "2025-09-13T04:55:00.000Z" (example)
}