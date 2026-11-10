/** Builds a CSV in the browser and downloads it. Quotes are escaped so commas in names are safe. */
export function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
