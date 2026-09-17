const monthFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

export function formatWorkDate(value: string): string {
  if (/^\d{4}$/.test(value)) return value
  return monthFormat.format(new Date(`${value}-01T00:00:00Z`))
}

export function workDuration(
  start: string,
  end?: string,
  now = new Date(),
): string | undefined {
  // Year-only education dates do not imply an exact duration.
  if (!/^\d{4}-\d{2}$/.test(start) || (end && !/^\d{4}-\d{2}$/.test(end)))
    return undefined

  const [startYear, startMonth] = start.split("-").map(Number)
  const [endYear, endMonth] = end
    ? end.split("-").map(Number)
    : [now.getUTCFullYear(), now.getUTCMonth() + 1]
  // Include both listed months, matching the supplied employment durations.
  const total = (endYear - startYear) * 12 + endMonth - startMonth + 1
  if (total < 1) return undefined

  const years = Math.floor(total / 12)
  const months = total % 12
  return [
    years ? `${years} ${years === 1 ? "year" : "years"}` : "",
    months ? `${months} ${months === 1 ? "month" : "months"}` : "",
  ]
    .filter(Boolean)
    .join(" ")
}
