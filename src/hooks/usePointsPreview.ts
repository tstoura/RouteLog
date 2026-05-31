import { useEffect, useRef, useState } from 'react'
import { previewActivityPoints, type PreviewPointsResponse } from '../api/activities.ts'

export type PointsPreviewState = {
  points: string | null
  isLoading: boolean
  isReady: boolean
}

/**
 * Debounced EOOA points preview hook for official activity forms.
 *
 * Calls POST /activities/preview-points with the current form payload
 * whenever isOfficial is true and the payload changes, debounced by
 * debounceMs (default 400ms) to avoid excessive API calls.
 *
 * Returns { points: null, isLoading: false, isReady: false } when:
 *   - isOfficial is false (personal record — no preview)
 *   - payload is incomplete (expected during form filling)
 *   - API call is in-flight (isLoading: true during debounce + fetch)
 */
export function usePointsPreview(
  category: 'hiking' | 'climbing' | 'expedition',
  payload: Record<string, unknown>,
  isOfficial: boolean,
  debounceMs = 400,
): PointsPreviewState {
  const [state, setState] = useState<PointsPreviewState>({
    points: null,
    isLoading: false,
    isReady: false,
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep a ref so the debounced callback always reads the latest payload
  // without needing it in the effect deps.
  const latestPayload = useRef(payload)
  latestPayload.current = payload

  // Serialize payload for stable change detection.
  // The payload object reference changes on every render (created inline),
  // so JSON.stringify is used to detect actual value changes.
  const payloadKey = JSON.stringify(payload)

  useEffect(() => {
    if (!isOfficial) {
      if (timerRef.current) clearTimeout(timerRef.current)
      setState({ points: null, isLoading: false, isReady: false })
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setState((s) => ({ ...s, isLoading: true }))
      previewActivityPoints(category, latestPayload.current)
        .then((result: PreviewPointsResponse) => {
          setState({ points: result.points, isLoading: false, isReady: result.isReady })
        })
        .catch(() => {
          setState({ points: null, isLoading: false, isReady: false })
        })
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // payloadKey is a string derived from payload values — correct dep for change detection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadKey, isOfficial, category, debounceMs])

  return state
}
