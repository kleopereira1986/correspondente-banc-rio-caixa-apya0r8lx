import { useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordSubscription } from 'pocketbase'

/**
 * Hook for real-time subscriptions to a PocketBase collection.
 * ALWAYS use this hook instead of subscribing inline.
 * Uses the per-listener UnsubscribeFunc so multiple components
 * can safely subscribe to the same collection without conflicts.
 */
export function useRealtime(
  collectionName: string,
  callback: (data: RecordSubscription<any>) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false

    let retryTimeout: ReturnType<typeof setTimeout>

    const subscribe = async () => {
      try {
        // Subscribe initiates the SSE connection if not active.
        // It waits for a valid client ID implicitly.
        const fn = await pb.collection(collectionName).subscribe('*', (e) => {
          callbackRef.current(e)
        })

        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubscribeFn = fn
        }
      } catch (err: any) {
        if (cancelled) return

        // Handle "Missing or invalid client id" by retrying.
        // This ensures the application verifies and waits for a valid
        // real-time connection ID before establishing the subscription.
        console.warn(
          `[useRealtime] Failed to subscribe to ${collectionName}, retrying in 2s...`,
          err,
        )
        retryTimeout = setTimeout(subscribe, 2000)
      }
    }

    subscribe()

    return () => {
      cancelled = true
      clearTimeout(retryTimeout)
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled])
}

export default useRealtime
