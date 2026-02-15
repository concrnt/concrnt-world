import { useMemo, useCallback, useState, createElement } from 'react'
import { type User } from '@concrnt/worldlib'
import { Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
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
    const { t } = useTranslation('', { keyPrefix: 'ui.messageActions' })
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
                        // Ack is independent of Watch — fire even when subId is absent
                        const managed: { ack?: boolean; watchTargets?: Array<{ fqid: string; subId: string }> } = {}
                        if (user) {
                            await user.Ack()
                            managed.ack = true
                        }
                        const subId = user ? findSubIdFor(user.homeTimeline) : undefined
                        if (user && subId) {
                            managed.watchTargets = [{ fqid: user.homeTimeline, subId }]
                        }
                        upsertItem({
                            kind,
                            ref: itemRef,
                            managed: Object.keys(managed).length > 0 ? managed : undefined
                        })
                        if (user && subId) {
                            await managedOps.watchManaged(user.homeTimeline, subId)
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
                        const msgItemId = makeItemId(kind, itemRef)
                        enqueueSnackbar(t('messageKept'), {
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
                                                managedOps.watchManagedFor(msgItemId, authorUser.homeTimeline, subId)
                                                    .then(() => {
                                                        enqueueSnackbar(t('nowWatchingAuthor'), { variant: 'info' })
                                                    })
                                                    .catch(console.error)
                                            }
                                        }).catch(console.error)
                                    }
                                }, t('watchAuthor'))
                        })
                        break
                    }
                }
            } catch (e) {
                console.error('Keep failed', e)
                enqueueSnackbar(t('keepFailed'), { variant: 'error' })
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
                    enqueueSnackbar(t('cleanupFailedRetry'), { variant: 'warning' })
                }
            })
            .catch((e) => {
                console.error('Unkeep failed', e)
                enqueueSnackbar(t('unkeepFailed'), { variant: 'error' })
            })
            .finally(() => {
                setLoading(false)
            })
    }, [item, managedOps])

    return { isKept, item, keep, unkeep, loading }
}
