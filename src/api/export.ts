import { apiFetchBlob } from './client.ts'

export type ExportClubPayload = {
  /** UUIDs of members whose activities should be exported. */
  selectedUserIds: string[]
  /**
   * Temporary: replaced by JWT-decoded user context in a later phase.
   * Must be a club_admin or super_admin; otherwise backend returns 403.
   */
  requesterUserId: string
  /** If provided, filter activities by this year. Omit to export all years. */
  year?: number
}

/**
 * Trigger an EOOA Excel export for a club.
 * Returns a Blob (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet).
 *
 * TODO: replace `requesterUserId` with JWT-decoded user context.
 */
export function exportClubActivities(
  clubId: string,
  payload: ExportClubPayload,
): Promise<Blob> {
  return apiFetchBlob(`/export/club/${clubId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Trigger a browser file download for a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
