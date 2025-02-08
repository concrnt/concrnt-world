import { useCallback, useState } from 'react'
function parseJsonSafely(input: string): any {
    let parsed: any = null
    try {
        parsed = JSON.parse(input)
    } catch (e) {
        // Do nothing ;)
    }
    return parsed
}

export function usePersistent<T>(key: string, init: T): [value: T, update: (updator: T | ((old: T) => T)) => void] {
    const [value, setValue] = useState<T>(
        (() => {
            const cached = localStorage.getItem(key)
            if (cached) {
                return parseJsonSafely(cached) ?? init
            } else {
                localStorage.setItem(key, JSON.stringify(init))
                return init
            }
        })()
    )

    const update = useCallback((updator: T | ((old: T) => T)): void => {
        if (typeof updator === 'function') {
            setValue((old) => {
                const newValue = (updator as (old: T) => T)(old)
                localStorage.setItem(key, JSON.stringify(newValue))
                return newValue
            })
        } else {
            setValue(updator)
            localStorage.setItem(key, JSON.stringify(updator))
        }
    }, [])

    return [value, update]
}
