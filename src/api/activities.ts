import { apiFetch } from './client.ts'

// ── Shared response shape ──────────────────────────────────────────────────────

export type ActivityCreatedResponse = {
  id: string
  category: string
  isOfficial: boolean
  points: number | null
}

// ── Hiking / Ski Mountaineering ────────────────────────────────────────────────

export type HikingActivityPayload = {
  /** Temporary: replaced by JWT-decoded userId in a later phase. */
  userId: string
  isOfficial: boolean
  /** Required when isOfficial = true. */
  clubId?: string
  /** ISO date: YYYY-MM-DD */
  date: string
  mountain: string
  startPoint: string
  endPoint: string
  maxAltitude: number
  totalElevationGain: number
  distanceLength: number
  /**
   * Backend values: "normal" | "winter_conditions" | "ski_mountaineering"
   * UI labels:       Κανονικό | Χειμερινών συνθηκών | Ορειβατικού σκι
   */
  fieldType: string
  /**
   * Backend values: "hiking" | "F-" | "F" | "F+" | "PD-" | "PD" | "PD+" | "AD-" | "AD" | "AD+"
   * UI label for "hiking": Πεζοπορία
   */
  difficultyGrade: string
  participantsNum: number
  /** Optional free-text notes visible only to the submitting user. */
  privateNotes?: string
  /** Optional route review visible to other club members. */
  publicNotes?: string
}

export function submitHikingActivity(
  payload: HikingActivityPayload,
): Promise<ActivityCreatedResponse> {
  return apiFetch('/activities/hiking', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── Rock Climbing ──────────────────────────────────────────────────────────────

export type ClimbingActivityPayload = {
  /** Temporary: replaced by JWT-decoded userId in a later phase. */
  userId: string
  isOfficial: boolean
  /** Required when isOfficial = true. */
  clubId?: string
  /** ISO date: YYYY-MM-DD */
  date: string
  /** ID of an existing climbing route. Always required. */
  routeId: string
  /**
   * Backend values: "summer" | "winter"
   * UI labels:       Θερινή  | Χειμερινή
   */
  season: string
  /**
   * Backend values: "new"   | "repeat"
   * UI labels:       Νέα    | Επανάληψη
   */
  repetitionType: string
  altitude: number
  routeLength: number
  /** Required when isOfficial = true. */
  participantsNum: number
  /** Required when isOfficial = true. Free-form list of participants. */
  participantsText?: string
  /**
   * "uiaa" | "alpine" | "french"
   * Must be paired with difficultyGrade when present.
   * NOTE: French scale submissions return 422 until grade_mappings is populated.
   */
  difficultyScale?: string
  difficultyGrade?: string
  /**
   * M-scale (M1–M12) or WI-scale (WI1–WI12) grade.
   * Required for official records when no regular difficulty is provided.
   */
  mixedClimbing?: string
  /**
   * Optional personal tracking. Not exported to EOOA Excel.
   * Values: "on_sight" | "flash" | "red_point" | "top_rope"
   */
  completionType?: string
}

export function submitClimbingActivity(
  payload: ClimbingActivityPayload,
): Promise<ActivityCreatedResponse> {
  return apiFetch('/activities/climbing', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── Expeditions Abroad ─────────────────────────────────────────────────────────

export type ExpeditionActivityPayload = {
  /** Temporary: replaced by JWT-decoded userId in a later phase. */
  userId: string
  isOfficial: boolean
  /** Required when isOfficial = true. */
  clubId?: string
  /** ISO date: YYYY-MM-DD */
  date: string
  country: string
  mountainRange: string
  mountain: string
  summit: string
  routeName: string
  /**
   * Backend values: "summer" | "winter"
   * NOTE: No ski_mountaineering option for expeditions — ski mountaineering
   *       conditions are treated as winter.
   */
  season: string
  altitude: number
  totalElevationGain: number
  /**
   * Backend values: "hiking" | "F-" | "F" | "F+" | "PD-" | "PD" | "PD+" |
   *                 "AD-" | "AD" | "AD+" | "D-" | "D" | "D+" | "TD-" | "TD" |
   *                 "TD+" | "ED-" | "ED" | "ED+"
   * UI label for "hiking": Πεζοπορία
   */
  difficultyGrade: string
  participantsNum: number
  /**
   * Backend values: "no" | "europe" | "africa" | "other_continents"
   * UI labels:       Όχι  | Ευρώπη  | Αφρική  | Άλλες ήπειροι
   */
  organizationType: string
}

export function submitExpeditionActivity(
  payload: ExpeditionActivityPayload,
): Promise<ActivityCreatedResponse> {
  return apiFetch('/activities/expedition', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
