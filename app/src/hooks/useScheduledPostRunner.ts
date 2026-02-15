import { useCallback, useEffect, useRef, useMemo } from 'react'
import { useDraftContext } from '../context/DraftContext'
import { useClient } from '../context/ClientContext'
import { LS_PREFIX } from '../appConfig'
import { enqueueSnackbar } from 'notistack'
import { useGlobalState } from '../context/GlobalState'
import { type CommunityTimelineSchema, type Timeline } from '@concrnt/worldlib'

const INTERVAL_MS = 45_000 // 45 seconds
const MAX_RETRIES = 3

interface DraftDestinationState {
    timelineIds: string[]
    postHome: boolean
}

interface DraftDestinationResult {
    destination: string[]
    fallbackToHome: boolean
}

export function useScheduledPostRunner(): void {
    const { client } = useClient()
    const { entries, removeDraft, updateDraft } = useDraftContext()
    const { allKnownTimelines } = useGlobalState()
    const entriesRef = useRef(entries)
    entriesRef.current = entries
    const inFlightRef = useRef<Set<string>>(new Set())
    const fallbackNoticeShownRef = useRef<Set<string>>(new Set())

    const timelineById = useMemo(() => {
        const map = new Map<string, Timeline<CommunityTimelineSchema>>()
        for (const timeline of allKnownTimelines) {
            if (timeline.id) {
                map.set(timeline.id, timeline)
            }
        }
        return map
    }, [allKnownTimelines])

    const resolveDestination = useCallback(
        (entryKey: string): DraftDestinationResult => {
            const homeTimeline = client.user?.homeTimeline
            if (!homeTimeline) return { destination: [], fallbackToHome: false }

            const prefix = entryKey ? `${LS_PREFIX}${entryKey}:` : LS_PREFIX
            const raw = localStorage.getItem(prefix + 'draftDestination')
            let destination: DraftDestinationState = { timelineIds: [], postHome: true }
            try {
                const parsed = raw ? JSON.parse(raw) : undefined
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    const parsedDestination = parsed as Partial<DraftDestinationState>
                    destination = {
                        timelineIds: Array.isArray(parsedDestination.timelineIds) ? parsedDestination.timelineIds : [],
                        postHome:
                            typeof parsedDestination.postHome === 'boolean' ? parsedDestination.postHome : true
                    }
                }
            } catch {
                // keep defaults
            }

            const selected = destination.timelineIds
                .map((timelineId) => timelineById.get(timelineId))
                .filter((timeline): timeline is Timeline<CommunityTimelineSchema> => timeline !== undefined)
                .map((timeline) => timeline.fqid)
                .filter((fqid): fqid is string => fqid !== undefined && fqid !== '')

            if (!destination.postHome && selected.length === 0) {
                return { destination: [homeTimeline], fallbackToHome: true }
            }

            if (destination.postHome) {
                return {
                    destination: [...new Set([...selected, homeTimeline])],
                    fallbackToHome: false
                }
            }

            return {
                destination: [...new Set(selected)],
                fallbackToHome: false
            }
        },
        [client.user?.homeTimeline, timelineById]
    )

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
            const { destination: dest, fallbackToHome } = resolveDestination(entry.key)
            if (!dest.length) continue
            if (fallbackToHome) {
                if (!fallbackNoticeShownRef.current.has(entry.id)) {
                    enqueueSnackbar(
                        `Draft #${entry.key.substring(0, 6)} had no destination; posting to Home as fallback`,
                        { variant: 'warning' }
                    )
                    fallbackNoticeShownRef.current.add(entry.id)
                }
            } else {
                fallbackNoticeShownRef.current.delete(entry.id)
            }

            inFlightRef.current.add(entry.id)
            client
                .createMarkdownCrnt(body, dest)
                .then(() => {
                    // Clean up draft localStorage entries
                    localStorage.removeItem(prefix + 'draft')
                    localStorage.removeItem(prefix + 'draftEmojis')
                    localStorage.removeItem(prefix + 'draftMedias')
                    localStorage.removeItem(prefix + 'draftDestination')
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
    }, [client, removeDraft, resolveDestination, updateDraft])

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
