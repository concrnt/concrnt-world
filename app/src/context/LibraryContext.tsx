import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useClient } from './ClientContext'
import { usePersistent } from '../hooks/usePersistent'
import { useDebouncedKVSync } from '../hooks/useDebouncedKVSync'
import { KV_PREFIX, LS_PREFIX } from '../appConfig'

type RawValue = unknown

export type ItemKind = 'user' | 'timeline' | 'message'

export type UserRef = {
    ccid: string
    hint?: string
}

export type TimelineRef = {
    fqid: string
}

export type MessageRef = {
    author: string
    messageId: string
    hint?: string
}

export type DisplayRule = 'normal' | 'blur' | 'omit' | 'hide'

export type Managed = {
    watchSubs?: string[]
    ack?: boolean
}

export type LibraryItem = {
    id: string
    kind: ItemKind
    ref: UserRef | TimelineRef | MessageRef
    keptAt: number
    updatedAt: number
    pinned?: boolean
    marked?: boolean
    folderId?: string | null
    tags?: string[]
    memo?: string
    display?: DisplayRule
    managed?: Managed
}

export type Folder = {
    id: string
    name: string
    order: number
    pinned?: boolean
}

export type TagRule = {
    tag: string
    display?: DisplayRule
}

export type LibraryItemInput = {
    kind: ItemKind
    ref: UserRef | TimelineRef | MessageRef
    id?: string
    keptAt?: number
    updatedAt?: number
    pinned?: boolean
    marked?: boolean
    folderId?: string | null
    tags?: string[]
    memo?: string
    display?: DisplayRule
    managed?: Managed
}

export type LibraryStore = {
    items: LibraryItem[]
    folders: Folder[]
    tagRules: TagRule[]
}

interface LibraryContextState {
    items: LibraryItem[]
    folders: Folder[]
    tagRules: TagRule[]
    upsertItem: (item: LibraryItemInput) => string
    removeItem: (itemId: string) => void
    togglePin: (itemId: string) => void
    toggleMark: (itemId: string) => void
    setFolder: (itemId: string, folderId?: string | null) => void
    setTags: (itemId: string, tags: string[]) => void
    setMemo: (itemId: string, memo?: string) => void
    setDisplay: (itemId: string, display?: DisplayRule) => void
    updateItem: (itemId: string, patch: Partial<LibraryItem>) => void
    byKind: (kind: ItemKind) => LibraryItem[]
    addFolder: (name: string) => string
    removeFolder: (folderId: string) => void
    renameFolder: (folderId: string, name: string) => void
    reorderFolders: (folderIds: string[]) => void
    addTagRule: (tag: string, display?: DisplayRule) => void
    removeTagRule: (tag: string) => void
    updateTagRule: (tag: string, display?: DisplayRule) => void
}

const LIBRARY_LOCAL_STORAGE_KEY = LS_PREFIX + 'library'
const LIBRARY_KV_KEY = `${KV_PREFIX}.library`
const DEFAULT_LIBRARY: LibraryStore = {
    items: [],
    folders: [],
    tagRules: []
}

const KINDS: ItemKind[] = ['user', 'timeline', 'message']
const DISPLAY_RULES: readonly DisplayRule[] = ['normal', 'blur', 'omit', 'hide']

const isDisplayRule = (input: RawValue): input is DisplayRule => {
    return typeof input === 'string' && (DISPLAY_RULES as readonly string[]).includes(input)
}

const normalizeTags = (tags: unknown): string[] => {
    if (!Array.isArray(tags)) return []
    return tags
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
}

const normalizeManaged = (managed: RawValue): Managed | undefined => {
    if (managed === null || managed === undefined) return undefined
    if (typeof managed !== 'object') return undefined
    const rawSubs = (managed as { watchSubs?: unknown }).watchSubs
    const watchSubs = Array.isArray(rawSubs)
        ? (rawSubs as unknown[]).filter((id): id is string => typeof id === 'string')
        : []
    const ack = (managed as { ack?: unknown }).ack === true
    if (!watchSubs.length && ack === false) return undefined
    return {
        ...(watchSubs.length > 0 ? { watchSubs } : {}),
        ...(ack ? { ack } : {})
    }
}

const normalizeRef = (kind: ItemKind, ref: RawValue): UserRef | TimelineRef | MessageRef | undefined => {
    if (!ref || typeof ref !== 'object') return

    switch (kind) {
        case 'user': {
            if (typeof (ref as UserRef).ccid !== 'string') return
            return {
                ccid: (ref as UserRef).ccid,
                hint: typeof (ref as UserRef).hint === 'string' ? (ref as UserRef).hint : undefined
            }
        }
        case 'timeline': {
            if (typeof (ref as TimelineRef).fqid !== 'string') return
            return {
                fqid: (ref as TimelineRef).fqid
            }
        }
        case 'message': {
            if (typeof (ref as MessageRef).author !== 'string' || typeof (ref as MessageRef).messageId !== 'string') return
            return {
                author: (ref as MessageRef).author,
                messageId: (ref as MessageRef).messageId,
                hint: typeof (ref as MessageRef).hint === 'string' ? (ref as MessageRef).hint : undefined
            }
        }
    }
}

export const makeItemId = (kind: ItemKind, ref: UserRef | TimelineRef | MessageRef): string => {
    switch (kind) {
        case 'user':
            return `user:${encodeURIComponent((ref as UserRef).ccid)}`
        case 'timeline':
            return `timeline:${encodeURIComponent((ref as TimelineRef).fqid)}`
        case 'message': {
            const messageRef = ref as MessageRef
            return `message:${encodeURIComponent(messageRef.author)}:${encodeURIComponent(messageRef.messageId)}`
        }
    }
}

const normalizeFolder = (folder: RawValue): Folder | undefined => {
    if (!folder || typeof folder !== 'object') return
    if (typeof (folder as Folder).id !== 'string') return
    return {
        id: (folder as Folder).id,
        name: typeof (folder as Folder).name === 'string' && (folder as Folder).name.trim() !== '' ? (folder as Folder).name : 'New Folder',
        order: Number.isFinite((folder as Folder).order) ? (folder as Folder).order : 0,
        pinned: (folder as Folder).pinned === true
    }
}

const normalizeTagRule = (rule: RawValue): TagRule | undefined => {
    if (!rule || typeof rule !== 'object') return
    if (typeof (rule as TagRule).tag !== 'string' || (rule as TagRule).tag.trim() === '') return
    return {
        tag: (rule as TagRule).tag.trim(),
        ...(isDisplayRule((rule as TagRule).display) ? { display: (rule as TagRule).display } : {})
    }
}

const normalizeLibraryItem = (item: RawValue): LibraryItem | undefined => {
    if (!item || typeof item !== 'object') return
    const candidate = item as Partial<LibraryItem>
    if (typeof candidate.kind !== 'string' || !KINDS.includes(candidate.kind as ItemKind)) return
    const kind = candidate.kind as ItemKind
    const ref = normalizeRef(kind, candidate.ref)
    if (!ref) return

    const now = Date.now()
    return {
        id: typeof candidate.id === 'string' ? candidate.id : makeItemId(kind, ref),
        kind,
        ref,
        keptAt: Number.isFinite(candidate.keptAt) ? (candidate.keptAt as number) : now,
        updatedAt: Number.isFinite(candidate.updatedAt) ? (candidate.updatedAt as number) : now,
        pinned: candidate.pinned === true,
        marked: candidate.marked === true,
        folderId: candidate.folderId === null ? null : candidate.folderId || undefined,
        tags: normalizeTags(candidate.tags),
        memo: typeof candidate.memo === 'string' ? candidate.memo : undefined,
        display: isDisplayRule(candidate.display) ? candidate.display : undefined,
        managed: normalizeManaged(candidate.managed)
    }
}

const normalizeStore = (storage: RawValue): LibraryStore => {
    if (!storage || typeof storage !== 'object') return DEFAULT_LIBRARY
    const next: LibraryStore = {
        items: [],
        folders: [],
        tagRules: []
    }

    if (Array.isArray((storage as LibraryStore).items)) {
        next.items = (storage as LibraryStore).items.map(normalizeLibraryItem).filter((item): item is LibraryItem => item !== undefined)
    }

    if (Array.isArray((storage as LibraryStore).folders)) {
        next.folders = (storage as LibraryStore).folders
            .map(normalizeFolder)
            .filter((folder): folder is Folder => folder !== undefined)
    }

    if (Array.isArray((storage as LibraryStore).tagRules)) {
        next.tagRules = (storage as LibraryStore).tagRules
            .map(normalizeTagRule)
            .filter((rule): rule is TagRule => rule !== undefined)
    }

    return next
}

const parseKV = (value: unknown): LibraryStore => {
    try {
        if (!value || typeof value !== 'string') return DEFAULT_LIBRARY
        const parsed = JSON.parse(value)
        return normalizeStore(parsed)
    } catch (error) {
        console.error('Failed to parse library storage', error)
        return DEFAULT_LIBRARY
    }
}

const LibraryContext = createContext<LibraryContextState | undefined>(undefined)

export const LibraryProvider = ({ children }: { children: JSX.Element | JSX.Element[] }): JSX.Element => {
    const { client } = useClient()
    const [store, setStore] = usePersistent<LibraryStore>(LIBRARY_LOCAL_STORAGE_KEY, DEFAULT_LIBRARY)
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        if (!client) {
            setInitialized(true)
            return
        }

        let disposed = false
        client.api
            .getKV(LIBRARY_KV_KEY)
            .then((storage) => {
                if (disposed) return
                if (storage) {
                    const parsed = parseKV(storage)
                    setStore(parsed)
                }
                setInitialized(true)
            })
            .catch((e) => {
                console.error('failed to load library', e)
                setInitialized(true)
            })

        return () => {
            disposed = true
        }
    }, [client])

    useDebouncedKVSync(client, LIBRARY_KV_KEY, store, initialized)

    const upsertItem = useCallback(
        (item: LibraryItemInput): string => {
            const now = Date.now()
            const kind = item.kind
            const ref = normalizeRef(kind, item.ref)
            if (!ref) return ''

    const nextItem: LibraryItem = {
        id: item.id ?? makeItemId(kind, ref),
        kind,
        ref,
        keptAt: Number.isFinite(item.keptAt) ? item.keptAt as number : now,
        updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt as number : now,
        pinned: item.pinned === true,
        marked: item.marked === true,
        folderId: item.folderId === undefined ? undefined : item.folderId,
                tags: normalizeTags(item.tags),
                memo: typeof item.memo === 'string' ? item.memo : undefined,
                display: isDisplayRule(item.display) ? item.display : undefined,
                managed: normalizeManaged(item.managed)
            }

            setStore((prev) => {
                const current = [...prev.items]
                const idx = current.findIndex((target) => target.id === nextItem.id)
                if (idx >= 0) {
                    current[idx] = {
                        ...current[idx],
                        ...nextItem,
                        keptAt: current[idx].keptAt,
                        updatedAt: now,
                        id: current[idx].id
                    }
                } else {
                    current.push({
                        ...nextItem,
                        keptAt: now,
                        updatedAt: now
                    })
                }
                return {
                    ...prev,
                    items: current
                }
            })

            return nextItem.id
        },
        [setStore]
    )

    const removeItem = useCallback(
        (itemId: string): void => {
            setStore((prev) => ({
                ...prev,
                items: prev.items.filter((item) => item.id !== itemId)
            }))
        },
        [setStore]
    )

    const updateItem = useCallback(
        (itemId: string, patch: Partial<LibraryItem>): void => {
            setStore((prev) => ({
                ...prev,
                items: prev.items.map((item) => {
                    if (item.id !== itemId) return item
                    return {
                        ...item,
                        ...patch,
                        updatedAt: Date.now()
                    }
                })
            }))
        },
        [setStore]
    )

    const togglePin = useCallback(
        (itemId: string): void => {
            setStore((prev) => ({
                ...prev,
                items: prev.items.map((item) => {
                    if (item.id !== itemId) return item
                    return {
                        ...item,
                        pinned: !item.pinned,
                        updatedAt: Date.now()
                    }
                })
            }))
        },
        [setStore]
    )

    const toggleMark = useCallback(
        (itemId: string): void => {
            setStore((prev) => ({
                ...prev,
                items: prev.items.map((item) => {
                    if (item.id !== itemId) return item
                    return {
                        ...item,
                        marked: !item.marked,
                        updatedAt: Date.now()
                    }
                })
            }))
        },
        [setStore]
    )

    const setFolder = useCallback(
        (itemId: string, folderId?: string | null): void => {
            setStore((prev) => ({
                ...prev,
                items: prev.items.map((item) => {
                    if (item.id !== itemId) return item
                    return {
                        ...item,
                        folderId,
                        updatedAt: Date.now()
                    }
                })
            }))
        },
        [setStore]
    )

    const setTags = useCallback(
        (itemId: string, tags: string[]): void => {
            const normalized = normalizeTags(tags)
            setStore((prev) => ({
                ...prev,
                items: prev.items.map((item) => {
                    if (item.id !== itemId) return item
                    return {
                        ...item,
                        tags: normalized,
                        updatedAt: Date.now()
                    }
                })
            }))
        },
        [setStore]
    )

    const setMemo = useCallback(
        (itemId: string, memo?: string): void => {
            setStore((prev) => ({
                ...prev,
                items: prev.items.map((item) => {
                    if (item.id !== itemId) return item
                    return {
                        ...item,
                        memo,
                        updatedAt: Date.now()
                    }
                })
            }))
        },
        [setStore]
    )

    const setDisplay = useCallback(
        (itemId: string, display?: DisplayRule): void => {
            setStore((prev) => ({
                ...prev,
                items: prev.items.map((item) => {
                    if (item.id !== itemId) return item
                    return {
                        ...item,
                        display: isDisplayRule(display) ? display : undefined,
                        updatedAt: Date.now()
                    }
                })
            }))
        },
        [setStore]
    )

    const byKind = useCallback(
        (kind: ItemKind): LibraryItem[] => {
            return store.items.filter((item) => item.kind === kind)
        },
        [store.items]
    )

    const addFolder = useCallback(
        (name: string): string => {
            const id = crypto.randomUUID()
            setStore((prev) => ({
                ...prev,
                folders: [...prev.folders, { id, name, order: prev.folders.length }]
            }))
            return id
        },
        [setStore]
    )

    const removeFolder = useCallback(
        (folderId: string): void => {
            setStore((prev) => ({
                ...prev,
                folders: prev.folders.filter((f) => f.id !== folderId),
                items: prev.items.map((item) =>
                    item.folderId === folderId ? { ...item, folderId: undefined, updatedAt: Date.now() } : item
                )
            }))
        },
        [setStore]
    )

    const renameFolder = useCallback(
        (folderId: string, name: string): void => {
            setStore((prev) => ({
                ...prev,
                folders: prev.folders.map((f) => (f.id === folderId ? { ...f, name } : f))
            }))
        },
        [setStore]
    )

    const reorderFolders = useCallback(
        (folderIds: string[]): void => {
            setStore((prev) => ({
                ...prev,
                folders: folderIds
                    .map((id, index) => {
                        const folder = prev.folders.find((f) => f.id === id)
                        return folder ? { ...folder, order: index } : undefined
                    })
                    .filter((f): f is Folder => f !== undefined)
            }))
        },
        [setStore]
    )

    const addTagRule = useCallback(
        (tag: string, display?: DisplayRule): void => {
            setStore((prev) => {
                if (prev.tagRules.find((r) => r.tag === tag)) return prev
                return {
                    ...prev,
                    tagRules: [...prev.tagRules, { tag, display }]
                }
            })
        },
        [setStore]
    )

    const removeTagRule = useCallback(
        (tag: string): void => {
            setStore((prev) => ({
                ...prev,
                tagRules: prev.tagRules.filter((r) => r.tag !== tag)
            }))
        },
        [setStore]
    )

    const updateTagRule = useCallback(
        (tag: string, display?: DisplayRule): void => {
            setStore((prev) => ({
                ...prev,
                tagRules: prev.tagRules.map((r) => (r.tag === tag ? { ...r, display } : r))
            }))
        },
        [setStore]
    )

    const value = useMemo(
        () => ({
            items: store.items,
            folders: store.folders,
            tagRules: store.tagRules,
            upsertItem,
            removeItem,
            togglePin,
            toggleMark,
            setFolder,
            setTags,
            setMemo,
            setDisplay,
            updateItem,
            byKind,
            addFolder,
            removeFolder,
            renameFolder,
            reorderFolders,
            addTagRule,
            removeTagRule,
            updateTagRule
        }),
        [store.items, store.folders, store.tagRules, upsertItem, removeItem, togglePin, toggleMark, setFolder, setTags, setMemo, setDisplay, updateItem, byKind, addFolder, removeFolder, renameFolder, reorderFolders, addTagRule, removeTagRule, updateTagRule]
    )

    return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryContextState {
    const ctx = useContext(LibraryContext)
    if (!ctx) {
        throw new Error('useLibrary must be used within LibraryProvider')
    }
    return ctx
}
