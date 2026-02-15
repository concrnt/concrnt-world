import { useMemo, useCallback, useState, createElement } from 'react'
import { type User } from '@concrnt/worldlib'
import { Button } from '@mui/material'
import { useLibrary, makeItemId, type ItemKind, type UserRef, type TimelineRef, type MessageRef, type LibraryItem } from '../context/LibraryContext'
import { useManagedOperations } from './useManagedOperations'
import { useClient } from '../context/ClientContext'
import { useGlobalState } from '../context/GlobalState'
import { enqueueSnackbar, closeSnackbar } from 'notistack'

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
    const { client } = useClient()
    const { items, upsertItem } = useLibrary()
    const managedOps = useManagedOperations()
    const { listedSubscriptions } = useGlobalState()
    const [loading, setLoading] = useState(false)

    const itemId = useMemo(() => makeItemId(kind, itemRef), [kind, itemRef])

    const item = useMemo(() => items.find((i) => i.id === itemId), [items, itemId])

    const isKept = item !== undefined

    const findSubIdFor = useCallback(
        (targetFqid: string): string | undefined => {
            const keys = Object.keys(listedSubscriptions)
            if (keys.length === 0) return undefined
            return keys.find((k) => listedSubscriptions[k].items.some((e) => e.id === targetFqid)) ?? keys[0]
        },
        [listedSubscriptions]
    )

    const keep = useCallback(() => {
        const run = async (): Promise<void> => {
            setLoading(true)
            try {
                switch (kind) {
                    case 'user': {
                        const subId = user ? findSubIdFor(user.homeTimeline) : undefined
                        if (user && subId) {
                            upsertItem({
                                kind,
                                ref: itemRef,
                                managed: { ack: true, watchTargets: [{ fqid: user.homeTimeline, subId }] }
                            })
                            await user.Ack()
                            await managedOps.watchManaged(user.homeTimeline, subId)
                        } else {
                            upsertItem({ kind, ref: itemRef })
                        }
                        break
                    }
                    case 'timeline': {
                        const tRef = itemRef as TimelineRef
                        const subId = findSubIdFor(tRef.fqid)
                        if (subId) {
                            upsertItem({
                                kind,
                                ref: itemRef,
                                managed: { watchTargets: [{ fqid: tRef.fqid, subId }] }
                            })
                            await managedOps.watchManaged(tRef.fqid, subId)
                        } else {
                            upsertItem({ kind, ref: itemRef })
                        }
                        break
                    }
                    case 'message':
                    default: {
                        const msgRef = itemRef as MessageRef
                        upsertItem({ kind, ref: itemRef })
                        enqueueSnackbar('Message kept', {
                            variant: 'success',
                            action: (snackbarId) =>
                                createElement(Button, {
                                    color: 'inherit',
                                    size: 'small',
                                    onClick: () => {
                                        closeSnackbar(snackbarId)
                                        client.getUser(msgRef.author).then((authorUser) => {
                                            if (!authorUser?.homeTimeline) return
                                            const subId = findSubIdFor(authorUser.homeTimeline)
                                            if (subId) {
                                                managedOps.watchManaged(authorUser.homeTimeline, subId)
                                                    .then(() => {
                                                        enqueueSnackbar('Now watching author', { variant: 'info' })
                                                    })
                                                    .catch(console.error)
                                            }
                                        }).catch(console.error)
                                    }
                                }, 'Watch Author')
                        })
                        break
                    }
                }
            } catch (e) {
                console.error('Keep failed', e)
                enqueueSnackbar('Failed to keep', { variant: 'error' })
            } finally {
                setLoading(false)
            }
        }
        run()
    }, [kind, itemRef, user, findSubIdFor, upsertItem, managedOps])

    const unkeep = useCallback(() => {
        if (!item) return
        setLoading(true)
        managedOps
            .removeWithCleanup(item.id)
            .then((result) => {
                if (!result.success) {
                    enqueueSnackbar('Some cleanup failed. Retry from Library.', { variant: 'warning' })
                }
            })
            .catch((e) => {
                console.error('Unkeep failed', e)
                enqueueSnackbar('Failed to unkeep', { variant: 'error' })
            })
            .finally(() => {
                setLoading(false)
            })
    }, [item, managedOps])

    return { isKept, item, keep, unkeep, loading }
}
