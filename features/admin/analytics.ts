// Small pure helpers for the sales charts. The numbers themselves come from the database
// (lib/db/queries/admin-reports.ts), so a dashboard figure always reconciles with the orders table.

export type Range = 7 | 30 | 90

/** Percentage change from previous to current (0 when there is nothing to compare with). */
export const delta = (current: number, previous: number) => (previous === 0 ? 0 : ((current - previous) / previous) * 100)

export const formatShortDate = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${iso}T00:00:00Z`))
