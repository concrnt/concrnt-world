import { useCallback } from 'react'
import { type User } from '@concrnt/worldlib'
import { useClient } from '../context/ClientContext'
import { useLibrary, type LibraryItem } from '../context/LibraryContext'
import { useGlobalState } from '../context/GlobalState'

export interface CleanupFailedOp {
    op: 'unsubscribe' | 'unack'
    id: string
    error: Error
}

export interface CleanupResult {
    success: boolean
    failedOps: CleanupFailedOp[]
}

export interface ManagedOperations {
    watchManaged: (fqid: string, subId: string) => Promise<void>
    unwatchManaged: (fqid: string, subId: string) => Promise<void>
    ackManaged: (user: User) => Promise<void>
    unackManaged: (user: User) => Promise<void>
    removeWithCleanup: (itemId: string) => Promise<CleanupResult>
}

export function useManagedOperations(): ManagedOperations {
    const { client, forceUpdate } = useClient()
    const { items, upsertItem, removeItem, updateItem } = useLibrary()
    const { reloadList } = useGlobalState()

    const watchManaged = useCallback(
        async (fqid: string, subId: string): Promise<void> => {
            await client.api.subscribe(fqid, subId)
            reloadList()

            const existing = items.find(
                (item) => item.kind === 'timeline' && (item.ref as { fqid: string }).fqid === fqid
            )

            if (existing) {
                const currentSubs = existing.managed?.watchSubs ?? []
                if (!currentSubs.includes(subId)) {
                    updateItem(existing.id, {
                        managed: {
                            ...existing.managed,
                            watchSubs: [...currentSubs, subId]
                        }
                    })
                }
            } else {
                upsertItem({
                    kind: 'timeline',
                    ref: { fqid },
                    managed: { watchSubs: [subId] }
                })
            }
        },
        [client, items, upsertItem, updateItem, reloadList]
    )

    const unwatchManaged = useCallback(
        async (fqid: string, subId: string): Promise<void> => {
            await client.api.unsubscribe(fqid, subId)
            reloadList()

            const existing = items.find(
                (item) => item.kind === 'timeline' && (item.ref as { fqid: string }).fqid === fqid
            )
            if (!existing) return

            const currentSubs = existing.managed?.watchSubs ?? []
            const nextSubs = currentSubs.filter((id) => id !== subId)
            updateItem(existing.id, {
                managed: {
                    ...existing.managed,
                    watchSubs: nextSubs.length > 0 ? nextSubs : undefined
                }
            })
        },
        [client, items, updateItem, reloadList]
    )

    const ackManaged = useCallback(
        async (user: User): Promise<void> => {
            await user.Ack()
            forceUpdate()

            const existing = items.find(
                (item) => item.kind === 'user' && (item.ref as { ccid: string }).ccid === user.ccid
            )

            if (existing) {
                updateItem(existing.id, {
                    managed: {
                        ...existing.managed,
                        ack: true
                    }
                })
            } else {
                upsertItem({
                    kind: 'user',
                    ref: { ccid: user.ccid, hint: user.profile?.username },
                    managed: { ack: true }
                })
            }
        },
        [items, upsertItem, updateItem, forceUpdate]
    )

    const unackManaged = useCallback(
        async (user: User): Promise<void> => {
            await user.UnAck()
            forceUpdate()

            const existing = items.find(
                (item) => item.kind === 'user' && (item.ref as { ccid: string }).ccid === user.ccid
            )
            if (!existing) return

            updateItem(existing.id, {
                managed: {
                    ...existing.managed,
                    ack: undefined
                }
            })
        },
        [items, updateItem, forceUpdate]
    )

    const removeWithCleanup = useCallback(
        async (itemId: string): Promise<CleanupResult> => {
            const item: LibraryItem | undefined = items.find((i) => i.id === itemId)
            if (!item) return { success: true, failedOps: [] }

            const failedOps: CleanupFailedOp[] = []

            if (item.managed?.watchSubs?.length) {
                const fqid = (item.ref as { fqid: string }).fqid
                for (const subId of item.managed.watchSubs) {
                    try {
                        await client.api.unsubscribe(fqid, subId)
                    } catch (e) {
                        failedOps.push({
                            op: 'unsubscribe',
                            id: `${fqid}:${subId}`,
                            error: e instanceof Error ? e : new Error(String(e))
                        })
                    }
                }
                reloadList()
            }

            if (item.managed?.ack) {
                const ccid = (item.ref as { ccid: string }).ccid
                try {
                    const user = await client.getUser(ccid)
                    if (user) {
                        await user.UnAck()
                        forceUpdate()
                    }
                } catch (e) {
                    failedOps.push({
                        op: 'unack',
                        id: ccid,
                        error: e instanceof Error ? e : new Error(String(e))
                    })
                }
            }

            // Always remove the item even if some cleanup failed (respect user's unkeep intent)
            removeItem(itemId)

            return {
                success: failedOps.length === 0,
                failedOps
            }
        },
        [client, items, removeItem, reloadList, forceUpdate]
    )

    return {
        watchManaged,
        unwatchManaged,
        ackManaged,
        unackManaged,
        removeWithCleanup
    }
}
