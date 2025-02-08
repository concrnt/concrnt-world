import { fetchWithTimeout } from '@concrnt/client'
import { createContext, useCallback, useContext, useRef } from 'react'

export interface Summary {
    title: string
    icon: string
    description: string
    thumbnail: string
    sitename: string
    url: string
}

export interface UrlSummaryState {
    getSummary: (url: string) => Promise<Summary | undefined>
}

export const UrlSummaryContext = createContext<UrlSummaryState | undefined>(undefined)

export interface UrlSummaryProviderProps {
    host: string
    children: JSX.Element
}

export const UrlSummaryProvider = (props: UrlSummaryProviderProps): JSX.Element => {
    const cache = useRef<Record<string, Promise<Summary | undefined>>>({})

    const getSummary = useCallback(
        async (url: string): Promise<Summary | undefined> => {
            if (url in cache.current) return await cache.current[url]
            const response = await fetchWithTimeout(`https://${props.host}/summary?url=${url}`, {}).catch(() => {
                cache.current[url] = Promise.resolve(undefined)
            })
            if (!response) return undefined
            const json = await response.json()
            cache.current[url] = Promise.resolve(json)
            return json
        },
        [cache.current]
    )

    return (
        <UrlSummaryContext.Provider
            value={{
                getSummary
            }}
        >
            {props.children}
        </UrlSummaryContext.Provider>
    )
}

export function useUrlSummary(): UrlSummaryState | undefined {
    const context = useContext(UrlSummaryContext)
    return context
}
