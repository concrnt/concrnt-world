import { Box } from '@mui/material'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { UrlSummaryCard } from '../components/ui/UrlSummaryCard'

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
                    let matchYoutubeVideo = url?.match(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)
                    if (!matchYoutubeVideo) matchYoutubeVideo = url?.match(/https:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/)
                    if (matchYoutubeVideo) {
                        return (
                            <Box
                                component="span"
                                sx={{
                                    display: 'block',
                                    aspectRatio: '16 / 9',
                                    overflow: 'hidden',
                                    width: '100%',
                                    borderRadius: 1,
                                    maxWidth: '500px'
                                }}
                            >
                                <iframe
                                    allowFullScreen
                                    src={`https://www.youtube.com/embed/${matchYoutubeVideo[1]}`}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none'
                                    }}
                                />
                            </Box>
                        )
                    }
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
