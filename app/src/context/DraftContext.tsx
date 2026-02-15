import { createContext, useCallback, useContext, useMemo } from 'react'
import { usePersistent } from '../hooks/usePersistent'
import { useDebouncedKVSync } from '../hooks/useDebouncedKVSync'
import { useClient } from './ClientContext'
import { KV_PREFIX, LS_PREFIX } from '../appConfig'

export interface DraftEntry {
    id: string
    key: string
    title?: string
    createdAt: number
    updatedAt: number
    pinned?: boolean
    scheduledAt?: number
    retryCount?: number
    lastError?: string
}

export interface DraftStore {
    entries: DraftEntry[]
}

interface DraftContextState {
    entries: DraftEntry[]
    registerDraft: (key: string, title?: string) => void
    removeDraft: (id: string) => void
    togglePinDraft: (id: string) => void
    updateDraft: (id: string, patch: Partial<DraftEntry>) => void
    scheduleDraft: (id: string, scheduledAt: number | undefined) => void
}

const DRAFT_LS_KEY = LS_PREFIX + 'drafts'
const DRAFT_KV_KEY = `${KV_PREFIX}.drafts`
const DEFAULT_STORE: DraftStore = { entries: [] }

const DraftContext = createContext<DraftContextState | undefined>(undefined)

export const DraftProvider = ({ children }: { children: JSX.Element | JSX.Element[] }): JSX.Element => {
    const { client } = useClient()
    const [store, setStore] = usePersistent<DraftStore>(DRAFT_LS_KEY, DEFAULT_STORE)

    useDebouncedKVSync(client, DRAFT_KV_KEY, store, true)

    const registerDraft = useCallback(
        (key: string, title?: string): void => {
            const now = Date.now()
            setStore((prev) => {
                const existing = prev.entries.find((e) => e.key === key)
                if (existing) {
                    return {
                        ...prev,
                        entries: prev.entries.map((e) =>
                            e.key === key ? { ...e, updatedAt: now, title: title ?? e.title } : e
                        )
                    }
                }
                return {
                    ...prev,
                    entries: [
                        ...prev.entries,
                        {
                            id: crypto.randomUUID(),
                            key,
                            title,
                            createdAt: now,
                            updatedAt: now
                        }
                    ]
                }
            })
        },
        [setStore]
    )

    const removeDraft = useCallback(
        (id: string): void => {
            setStore((prev) => {
                const entry = prev.entries.find((e) => e.id === id)
                if (entry) {
                    const prefix = entry.key ? `${LS_PREFIX}${entry.key}:` : LS_PREFIX
                    localStorage.removeItem(prefix + 'draft')
                    localStorage.removeItem(prefix + 'draftEmojis')
                    localStorage.removeItem(prefix + 'draftMedias')
                }
                return {
                    ...prev,
                    entries: prev.entries.filter((e) => e.id !== id)
                }
            })
        },
        [setStore]
    )

    const togglePinDraft = useCallback(
        (id: string): void => {
            setStore((prev) => ({
                ...prev,
                entries: prev.entries.map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e))
            }))
        },
        [setStore]
    )

    const updateDraft = useCallback(
        (id: string, patch: Partial<DraftEntry>): void => {
            setStore((prev) => ({
                ...prev,
                entries: prev.entries.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e))
            }))
        },
        [setStore]
    )

    const scheduleDraft = useCallback(
        (id: string, scheduledAt: number | undefined): void => {
            setStore((prev) => ({
                ...prev,
                entries: prev.entries.map((e) => (e.id === id ? { ...e, scheduledAt, updatedAt: Date.now() } : e))
            }))
        },
        [setStore]
    )

    const value = useMemo(
        () => ({
            entries: store.entries,
            registerDraft,
            removeDraft,
            togglePinDraft,
            updateDraft,
            scheduleDraft
        }),
        [store.entries, registerDraft, removeDraft, togglePinDraft, updateDraft, scheduleDraft]
    )

    return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
}

export function useDraftContext(): DraftContextState {
    const ctx = useContext(DraftContext)
    if (!ctx) {
        throw new Error('useDraftContext must be used within DraftProvider')
    }
    return ctx
}
