/**
 * EOOA scoring constants — re-export barrel.
 *
 * Phase 3 creates three constant modules (hiking / climbing / expedition).
 * Phase 6 scoring service imports coefficient tables and allowed-value sets from here.
 * Phase 9 Excel builder imports the *_EXCEL_LABELS tables from here.
 */

export * from './hiking.constants'
export * from './climbing.constants'
export * from './expedition.constants'
