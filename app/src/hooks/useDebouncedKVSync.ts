import { useEffect, useRef } from 'react'
import { type Client } from '@concrnt/worldlib'

export function useDebouncedKVSync<T>(
    client: Client | undefined,
    kvKey: string,
    data: T,
    initialized: boolean,
    options?: { delay?: number }
): void {
    const delay = options?.delay ?? 1500
    const writeTimer = useRef<number>()
    const lastWrittenRef = useRef<string>()

    useEffect(() => {
        if (!client || !initialized) return

        const serialized = JSON.stringify(data)
        if (lastWrittenRef.current === serialized) return

        if (writeTimer.current) {
            window.clearTimeout(writeTimer.current)
        }

        writeTimer.current = window.setTimeout(() => {
            lastWrittenRef.current = serialized
            client.api.writeKV(kvKey, serialized).catch((e) => {
                console.error(`failed to save KV ${kvKey}`, e)
            })
        }, delay)

        return () => {
            if (writeTimer.current) {
                window.clearTimeout(writeTimer.current)
            }
        }
    }, [data, client, initialized, kvKey, delay])
}
