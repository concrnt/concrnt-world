import { Box } from '@mui/material'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { UrlSummaryCard } from '../components/ui/UrlSummaryCard'

export interface Summary {
    title: string
    icon: string
    description: string
    thumbnail: string
    sitename: string
    url: string
}

export interface AutoSummaryState {
    update: () => void
}

export const AutoSummaryContext = createContext<AutoSummaryState | undefined>(undefined)

export interface AutoSummaryProviderProps {
    limit?: number
    children: JSX.Element | Array<JSX.Element | undefined>
}

export const AutoSummaryProvider = (props: AutoSummaryProviderProps): JSX.Element => {
    const ref = useRef<HTMLDivElement>(null)

    const [urls, setUrls] = useState<string[]>([])

    const extractUrls = (text: string): void => {
        // strip markdown image syntax
        let replaced = text.replace(/!\[.*\]\(.*\)/g, '')

        // strip codeblock
        replaced = replaced.replace(/```[\s\S]*?```/g, '')

        // strip inline code
        replaced = replaced.replace(/`[\s\S]*?`/g, '')

        // strip img tag
        replaced = replaced.replace(/<img.*?>/g, '')

        // strip social tag
        replaced = replaced.replace(/<social.*?>.*?<\/social>/g, '')

        // strip emojipack tag
        replaced = replaced.replace(/<emojipack.*?\/>/g, '')

        // replace markdown link syntax
        replaced = replaced.replace(/\[(.*)\]\((.*)\)/g, '$2')

        // strip a tag body
        replaced = replaced.replace(/<a(.*?)>.*?<\/a>/g, '$1')

        // extract urls
        const urls = replaced.match(/(https?:\/\/[\w.\-?=/&%#,@]+)/g) ?? []

        setUrls(urls)
    }

    useEffect(() => {
        if (!ref.current) return
        extractUrls(ref.current.innerText)
    }, [props.limit])

    const update = useCallback(() => {
        if (!ref.current) return
        extractUrls(ref.current.innerText)
    }, [])

    return (
        <AutoSummaryContext.Provider value={useMemo(() => ({ update }), [update])}>
            <Box ref={ref}>{props.children}</Box>
            <Box>
                {urls.slice(0, props.limit).map((url, i) => {
                    return <UrlSummaryCard key={i} url={url} />
                })}
            </Box>
        </AutoSummaryContext.Provider>
    )
}

export function useAutoSummary(): AutoSummaryState {
    const context = useContext(AutoSummaryContext) ?? { update: () => {} }
    return context
}
