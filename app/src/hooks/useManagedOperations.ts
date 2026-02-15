import { useCallback } from 'react'
import { type User } from '@concrnt/worldlib'
import { useClient } from '../context/ClientContext'
import { useLibrary, type LibraryItem, type WatchTarget } from '../context/LibraryContext'
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
    watchManagedFor: (itemId: string, fqid: string, subId: string) => Promise<void>
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

            // Only update existing timeline item's managed; never auto-create
            const existing = items.find(
                (item) => item.kind === 'timeline' && (item.ref as { fqid: string }).fqid === fqid
            )
            if (existing) {
                const currentTargets = existing.managed?.watchTargets ?? []
                if (!currentTargets.some((t) => t.fqid === fqid && t.subId === subId)) {
                    updateItem(existing.id, {
                        managed: {
                            ...existing.managed,
                            watchTargets: [...currentTargets, { fqid, subId }]
                        }
                    })
                }
            }
        },
        [client, items, updateItem, reloadList]
    )

    // Attach watch target to an existing item by its id (any kind)
    const watchManagedFor = useCallback(
        async (itemId: string, fqid: string, subId: string): Promise<void> => {
            await client.api.subscribe(fqid, subId)
            reloadList()

            const existing = items.find((i) => i.id === itemId)
            if (!existing) return

            const currentTargets = existing.managed?.watchTargets ?? []
            if (!currentTargets.some((t) => t.fqid === fqid && t.subId === subId)) {
                updateItem(existing.id, {
                    managed: {
                        ...existing.managed,
                        watchTargets: [...currentTargets, { fqid, subId }]
                    }
                })
            }
        },
        [client, items, updateItem, reloadList]
    )

    const unwatchManaged = useCallback(
        async (fqid: string, subId: string): Promise<void> => {
            await client.api.unsubscribe(fqid, subId)
            reloadList()

            const existing = items.find(
                (item) => item.kind === 'timeline' && (item.ref as { fqid: string }).fqid === fqid
            )
            if (!existing) return

            const currentTargets = existing.managed?.watchTargets ?? []
            const nextTargets = currentTargets.filter((t) => !(t.fqid === fqid && t.subId === subId))
            updateItem(existing.id, {
                managed: {
                    ...existing.managed,
                    watchTargets: nextTargets.length > 0 ? nextTargets : undefined
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
            const succeededTargets: WatchTarget[] = []

            if (item.managed?.watchTargets?.length) {
                for (const target of item.managed.watchTargets) {
                    try {
                        await client.api.unsubscribe(target.fqid, target.subId)
                        succeededTargets.push(target)
                    } catch (e) {
                        failedOps.push({
                            op: 'unsubscribe',
                            id: `${target.fqid}:${target.subId}`,
                            error: e instanceof Error ? e : new Error(String(e))
                        })
                    }
                }
                reloadList()
            }

            let ackFailed = false
            if (item.managed?.ack) {
                const ccid = (item.ref as { ccid: string }).ccid
                try {
                    const user = await client.getUser(ccid)
                    if (user) {
                        await user.UnAck()
                        forceUpdate()
                    }
                } catch (e) {
                    ackFailed = true
                    failedOps.push({
                        op: 'unack',
                        id: ccid,
                        error: e instanceof Error ? e : new Error(String(e))
                    })
                }
            }

            if (failedOps.length === 0) {
                removeItem(itemId)
            } else {
                // Partial failure: remove succeeded targets, mark cleanupFailed
                const remaining = (item.managed?.watchTargets ?? []).filter(
                    (t) => !succeededTargets.some((s) => s.fqid === t.fqid && s.subId === t.subId)
                )
                updateItem(itemId, {
                    managed: {
                        watchTargets: remaining.length > 0 ? remaining : undefined,
                        ack: ackFailed ? item.managed?.ack : undefined,
                        cleanupFailed: true
                    }
                })
            }

            return {
                success: failedOps.length === 0,
                failedOps
            }
        },
        [client, items, removeItem, updateItem, reloadList, forceUpdate]
    )

    return {
        watchManaged,
        watchManagedFor,
        unwatchManaged,
        ackManaged,
        unackManaged,
        removeWithCleanup
    }
}
