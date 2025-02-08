import { type MutableRefObject, useCallback, useState, useRef } from 'react'

export function useRefWithForceUpdate<T>(init: T): [value: MutableRefObject<T>, update: () => void] {
    const ref = useRef<T>(init)
    const [, forceUpdate] = useState(0)

    const update = useCallback((): void => {
        forceUpdate((prev) => prev + 1)
    }, [])

    return [ref, update]
}
