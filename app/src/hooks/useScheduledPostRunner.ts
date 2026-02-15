import { useCallback, useEffect, useRef } from 'react'
import { useDraftContext } from '../context/DraftContext'
import { useClient } from '../context/ClientContext'
import { LS_PREFIX } from '../appConfig'
import { enqueueSnackbar } from 'notistack'

const INTERVAL_MS = 45_000 // 45 seconds
const MAX_RETRIES = 3

export function useScheduledPostRunner(): void {
    const { client } = useClient()
    const { entries, removeDraft, updateDraft } = useDraftContext()
    const entriesRef = useRef(entries)
    entriesRef.current = entries
    const inFlightRef = useRef<Set<string>>(new Set())

    const runScheduledPosts = useCallback(() => {
        const now = Date.now()
        for (const entry of entriesRef.current) {
            if (!entry.scheduledAt || entry.scheduledAt > now) continue
            if ((entry.retryCount ?? 0) >= MAX_RETRIES) continue
            if (inFlightRef.current.has(entry.id)) continue

            // Read draft content from localStorage
            const prefix = entry.key ? `${LS_PREFIX}${entry.key}:` : LS_PREFIX
            const draftContent = localStorage.getItem(prefix + 'draft')
            if (!draftContent) {
                removeDraft(entry.id)
                continue
            }

            let body: string
            try {
                body = JSON.parse(draftContent)
            } catch {
                body = draftContent
            }

            if (!body || typeof body !== 'string' || body.trim() === '') {
                removeDraft(entry.id)
                continue
            }

            // Post the draft
            if (!client?.user?.homeTimeline) continue

            inFlightRef.current.add(entry.id)
            client
                .createMarkdownCrnt(body, [client.user.homeTimeline])
                .then(() => {
                    // Clean up draft localStorage entries
                    localStorage.removeItem(prefix + 'draft')
                    localStorage.removeItem(prefix + 'draftEmojis')
                    localStorage.removeItem(prefix + 'draftMedias')
                    removeDraft(entry.id)
                    enqueueSnackbar('Scheduled post sent', { variant: 'success' })
                })
                .catch((e) => {
                    console.error('Scheduled post failed', e)
                    const nextRetry = (entry.retryCount ?? 0) + 1
                    if (nextRetry >= MAX_RETRIES) {
                        updateDraft(entry.id, {
                            scheduledAt: undefined,
                            retryCount: nextRetry,
                            lastError: e instanceof Error ? e.message : String(e)
                        })
                        enqueueSnackbar('Scheduled post failed after retries', { variant: 'error' })
                    } else {
                        updateDraft(entry.id, {
                            retryCount: nextRetry,
                            lastError: e instanceof Error ? e.message : String(e)
                        })
                    }
                })
                .finally(() => {
                    inFlightRef.current.delete(entry.id)
                })
        }
    }, [client, removeDraft, updateDraft])

    useEffect(() => {
        const timer = setInterval(runScheduledPosts, INTERVAL_MS)

        const onVisibilityChange = (): void => {
            if (!document.hidden) {
                runScheduledPosts()
            }
        }
        document.addEventListener('visibilitychange', onVisibilityChange)

        return () => {
            clearInterval(timer)
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [runScheduledPosts])
}
