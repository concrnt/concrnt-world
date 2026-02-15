import { useMemo, useCallback, useState } from 'react'
import { type User } from '@concrnt/worldlib'
import { useLibrary, makeItemId, type ItemKind, type UserRef, type TimelineRef, type MessageRef, type LibraryItem } from '../context/LibraryContext'
import { useManagedOperations } from './useManagedOperations'
import { useGlobalState } from '../context/GlobalState'
import { enqueueSnackbar } from 'notistack'

export interface UseKeepToggleParams {
    kind: ItemKind
    itemRef: UserRef | TimelineRef | MessageRef
    user?: User
}

export interface UseKeepToggleResult {
    isKept: boolean
    item: LibraryItem | undefined
    keep: () => void
    unkeep: () => void
    loading: boolean
}

export function useKeepToggle({ kind, itemRef, user }: UseKeepToggleParams): UseKeepToggleResult {
    const { items, upsertItem, removeItem } = useLibrary()
    const managedOps = useManagedOperations()
    const { listedSubscriptions } = useGlobalState()
    const [loading, setLoading] = useState(false)

    const itemId = useMemo(() => makeItemId(kind, itemRef), [kind, itemRef])

    const item = useMemo(() => items.find((i) => i.id === itemId), [items, itemId])

    const isKept = item !== undefined

    const firstSubId = useMemo(() => {
        const keys = Object.keys(listedSubscriptions)
        return keys.length > 0 ? keys[0] : undefined
    }, [listedSubscriptions])

    const keep = useCallback(() => {
        const run = async (): Promise<void> => {
            setLoading(true)
            try {
                switch (kind) {
                    case 'user': {
                        if (user && firstSubId) {
                            upsertItem({
                                kind,
                                ref: itemRef,
                                managed: { ack: true, watchSubs: [firstSubId] }
                            })
                            await user.Ack()
                            await managedOps.watchManaged(user.homeTimeline, firstSubId)
                        } else {
                            upsertItem({ kind, ref: itemRef })
                        }
                        break
                    }
                    case 'timeline': {
                        const tRef = itemRef as TimelineRef
                        if (firstSubId) {
                            upsertItem({
                                kind,
                                ref: itemRef,
                                managed: { watchSubs: [firstSubId] }
                            })
                            await managedOps.watchManaged(tRef.fqid, firstSubId)
                        } else {
                            upsertItem({ kind, ref: itemRef })
                        }
                        break
                    }
                    case 'message':
                    default:
                        upsertItem({ kind, ref: itemRef })
                        break
                }
            } catch (e) {
                console.error('Keep failed', e)
                enqueueSnackbar('Failed to keep', { variant: 'error' })
            } finally {
                setLoading(false)
            }
        }
        run()
    }, [kind, itemRef, user, firstSubId, upsertItem, managedOps])

    const unkeep = useCallback(() => {
        if (item) {
            removeItem(item.id)
        }
    }, [item, removeItem])

    return { isKept, item, keep, unkeep, loading }
}
