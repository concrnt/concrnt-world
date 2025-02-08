import { type MutableRefObject, useCallback, useRef, useMemo } from 'react'

export interface IuseResourceManager<T> {
    body: MutableRefObject<Record<string, T>>
    get: (key: string) => Promise<T>
    register: (key: string, value: T) => void
    invalidate: (key: string) => void
}

export function useResourceManager<T>(resolver: (key: string) => Promise<T>): IuseResourceManager<T> {
    const body = useRef<Record<string, T>>({})

    const get = useCallback(async (key: string): Promise<T> => {
        if (!(key in body.current)) {
            body.current[key] = await resolver(key)
        }
        return body.current[key]
    }, [])

    const register = useCallback((key: string, value: T): void => {
        body.current[key] = value
    }, [])

    const invalidate = useCallback((key: string): void => {
        delete body.current[key]
    }, [])

    return useMemo(
        () => ({
            body,
            get,
            register,
            invalidate
        }),
        [body, get, register, invalidate]
    )
}

export const dummyResourceManager: IuseResourceManager<any> = {
    body: undefined as any,
    get: async () => {
        throw new Error('ResourceManager not initialized get')
    },
    register: (key: string, value: any) => {
        throw new Error('ResourceManager not initialized register')
    },
    invalidate: (key: string) => {
        throw new Error('ResourceManager not initialized invalidate')
    }
}
