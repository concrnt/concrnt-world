import { useEffect, useRef } from 'react'
import { useDraftContext } from '../context/DraftContext'
import { useClient } from '../context/ClientContext'
import { usePersistent } from './usePersistent'
import { LS_PREFIX } from '../appConfig'
import { enqueueSnackbar } from 'notistack'

const INTERVAL_MS = 45_000 // 45 seconds

export function useScheduledPostRunner(): void {
    const { client } = useClient()
    const { entries, removeDraft, updateDraft } = useDraftContext()
    const entriesRef = useRef(entries)
    entriesRef.current = entries

    useEffect(() => {
        const timer = setInterval(() => {
            if (document.hidden) return

            const now = Date.now()
            for (const entry of entriesRef.current) {
                if (!entry.scheduledAt || entry.scheduledAt > now) continue

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
                        updateDraft(entry.id, { scheduledAt: undefined })
                        enqueueSnackbar('Failed to send scheduled post', { variant: 'error' })
                    })
            }
        }, INTERVAL_MS)

        return () => clearInterval(timer)
    }, [client])
}
