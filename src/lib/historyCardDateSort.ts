import type { HistoryCard } from '../types/historyCard.ts'

/** Parse route `updatedAt` ISO date (e.g. YYYY-MM-DD) to ms for sorting. */
export function parseRouteUpdatedAtMs(updatedAt: string): number {
  const t = new Date(updatedAt.trim()).getTime()
  return Number.isFinite(t) ? t : 0
}

/** Routes newest first (descending `updatedAt`). */
export function sortRoutesByUpdatedAtDesc<T extends { updatedAt: string }>(routes: T[]): T[] {
  return [...routes].sort((a, b) => parseRouteUpdatedAtMs(b.updatedAt) - parseRouteUpdatedAtMs(a.updatedAt))
}

/** Parse history `dateLabel` (DD/MM/YYYY) to ms for sorting. */
export function parseHistoryDateLabelMs(dateLabel: string): number {
  const parts = dateLabel.trim().split('/')
  if (parts.length !== 3) return 0
  const day = Number(parts[0])
  const month = Number(parts[1])
  const year = Number(parts[2])
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return 0
  const t = new Date(year, month - 1, day).getTime()
  return Number.isFinite(t) ? t : 0
}

/** History cards newest first (descending activity date). */
export function sortHistoryCardsByActivityDateDesc(cards: HistoryCard[]): HistoryCard[] {
  return [...cards].sort((a, b) => parseHistoryDateLabelMs(b.dateLabel) - parseHistoryDateLabelMs(a.dateLabel))
}
