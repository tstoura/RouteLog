import type { HistoryCard } from '../types/historyCard.ts'

/** Completion style stored on the card (full set). */
export type RockCompletionKind = 'on_sight' | 'flash' | 'red_point' | 'repeat' | 'incomplete'

/** Values shown as History page filter pills. */
export type RockCompletionFilterKey = 'all' | 'on_sight' | 'flash' | 'red_point'

export type HistoryEntryStatusFilter = 'all' | 'official' | 'personal'

/** Derive completion style from the card (`rockCompletion` or `styleBadge`). */
export function getRockCompletionKind(entry: HistoryCard): RockCompletionKind {
  if (entry.kind !== 'rock_climbing') return 'red_point'
  if (entry.rockCompletion) return entry.rockCompletion
  const s = (entry.styleBadge ?? '').toUpperCase()
  if (s.includes('ON SIGHT')) return 'on_sight'
  if (s.includes('FLASH')) return 'flash'
  if (s.includes('RED POINT')) return 'red_point'
  return 'red_point'
}

export function matchesRockCompletionFilter(
  entry: HistoryCard,
  filter: RockCompletionFilterKey,
): boolean {
  if (filter === 'all') return true
  if (entry.kind !== 'rock_climbing') return false
  return getRockCompletionKind(entry) === filter
}

export function matchesEntryStatusFilter(
  entry: HistoryCard,
  filter: HistoryEntryStatusFilter,
): boolean {
  if (filter === 'all') return true
  return entry.status === filter
}
