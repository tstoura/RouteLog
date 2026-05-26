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
  /**
   * Official: required, >= 1.
   * Personal: optional. Omit when not provided; backend stores 0 as Phase A sentinel.
   */
  altitude?: number
  /**
   * Official: required, >= 0.01.
   * Personal: optional. Omit when not provided; backend stores 0 as Phase A sentinel.
   */
  routeLength?: number
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
  /** Optional free-text notes visible only to the submitting user. */
  privateNotes?: string
  /** Optional route review visible to other club members. */
  publicNotes?: string
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
  /** Optional for personal records — stored as "" when omitted. */
  mountainRange?: string
  mountain: string
  /** Optional for personal records — stored as "" when omitted. */
  summit?: string
  /** Optional for personal records — stored as "" when omitted. */
  routeName?: string
  /**
   * Backend values: "summer" | "winter"
   * NOTE: No ski_mountaineering option for expeditions — ski mountaineering
   *       conditions are treated as winter.
   */
  season: string
  /** Required for official records. Optional for personal — omit when unknown. */
  altitude?: number
  /** Required for official records. Optional for personal — omit when unknown. */
  totalElevationGain?: number
  /**
   * Backend values: "hiking" | "F-" | "F" | "F+" | "PD-" | "PD" | "PD+" |
   *                 "AD-" | "AD" | "AD+" | "D-" | "D" | "D+" | "TD-" | "TD" |
   *                 "TD+" | "ED-" | "ED" | "ED+"
   * UI label for "hiking": Πεζοπορία
   * Optional for personal records — omit when unknown.
   */
  difficultyGrade?: string
  participantsNum: number
  /**
   * Backend values: "no" | "europe" | "africa" | "other_continents"
   * UI labels:       Όχι  | Ευρώπη  | Αφρική  | Άλλες ήπειροι
   */
  organizationType: string
  /** Optional free-text notes visible only to the submitting user. */
  privateNotes?: string
  /** Optional expedition review visible to other club members. */
  publicNotes?: string
}

export function submitExpeditionActivity(
  payload: ExpeditionActivityPayload,
): Promise<ActivityCreatedResponse> {
  return apiFetch('/activities/expedition', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── Activity history response types ────────────────────────────────────────────

export type HikingDetailResponse = {
  mountain: string
  startPoint: string
  endPoint: string
  maxAltitude: number
  totalElevationGain: number
  distanceLength: number
  /** Backend values: "normal" | "winter_conditions" | "ski_mountaineering" */
  fieldType: string
  /** Backend values: "hiking" | "F-" … "AD+" */
  difficultyGrade: string
  participantsNum: number
}

export type ClimbingDetailResponse = {
  routeName: string
  mountainOrArea: string
  climbingField: string
  /** Backend values: "summer" | "winter" */
  season: string
  /** Backend values: "repeat" | "new" */
  repetitionType: string
  altitude: number
  routeLength: number
  difficultyScale: string | null
  difficultyGrade: string | null
  mixedClimbing: string | null
  mappedScale: string | null
  mappedGrade: string | null
  participantsNum: number
  participantsText: string | null
  /** Backend values: "on_sight" | "flash" | "red_point" | "top_rope" | null */
  completionType: string | null
}

export type ExpeditionDetailResponse = {
  country: string
  mountainRange: string
  mountain: string
  summit: string
  routeName: string
  /** Backend values: "summer" | "winter" */
  season: string
  altitude: number
  totalElevationGain: number
  /** Backend values: "hiking" | "F-" … "ED+" */
  difficultyGrade: string
  participantsNum: number
  /** Backend values: "no" | "europe" | "africa" | "other_continents" */
  organizationType: string
}

/** Full activity record as returned by GET /activities and GET /activities/:id */
export type ActivityListItem = {
  id: string
  /** Backend values: "hiking" | "climbing" | "expedition" */
  category: string
  isOfficial: boolean
  points: number | null
  /** ISO date: YYYY-MM-DD */
  date: string
  privateNotes: string | null
  publicNotes: string | null
  hikingDetail: HikingDetailResponse | null
  climbingDetail: ClimbingDetailResponse | null
  expeditionDetail: ExpeditionDetailResponse | null
}

/**
 * Fetch activity history for a user.
 *
 * TODO: replace `userId` query param with JWT-decoded user context.
 *
 * @param userId Temporary dev user ID (replaced by JWT later).
 * @param category Optional backend category filter: "hiking" | "climbing" | "expedition"
 */
export function getActivities(
  userId: string,
  category?: string,
): Promise<ActivityListItem[]> {
  const params = new URLSearchParams({ userId })
  if (category) params.set('category', category)
  return apiFetch<ActivityListItem[]>(`/activities?${params.toString()}`)
}

/**
 * Fetch a single activity with its detail object.
 *
 * Backend returns 404 if the activity doesn't belong to the requesting user.
 *
 * TODO: replace `userId` query param with JWT-decoded user context.
 */
export function getActivityById(
  id: string,
  userId: string,
): Promise<ActivityListItem> {
  const params = new URLSearchParams({ userId })
  return apiFetch<ActivityListItem>(`/activities/${id}?${params.toString()}`)
}
