import { useCallback } from 'react'
import { type User } from '@concrnt/worldlib'
import { useClient } from '../context/ClientContext'
import { useLibrary, type LibraryItem } from '../context/LibraryContext'
import { useGlobalState } from '../context/GlobalState'

export interface ManagedOperations {
    watchManaged: (fqid: string, subId: string) => Promise<void>
    unwatchManaged: (fqid: string, subId: string) => Promise<void>
    ackManaged: (user: User) => Promise<void>
    unackManaged: (user: User) => Promise<void>
    removeWithCleanup: (itemId: string) => Promise<void>
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
        async (itemId: string): Promise<void> => {
            const item: LibraryItem | undefined = items.find((i) => i.id === itemId)
            if (!item) return

            if (item.managed?.watchSubs?.length) {
                const fqid = (item.ref as { fqid: string }).fqid
                for (const subId of item.managed.watchSubs) {
                    await client.api.unsubscribe(fqid, subId)
                }
                reloadList()
            }

            if (item.managed?.ack) {
                const ccid = (item.ref as { ccid: string }).ccid
                const user = await client.getUser(ccid)
                if (user) {
                    await user.UnAck()
                    forceUpdate()
                }
            }

            removeItem(itemId)
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
