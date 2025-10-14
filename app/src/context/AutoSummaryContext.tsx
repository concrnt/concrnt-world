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

                    const matchSpotifyLink = url?.match(
                        /https:\/\/open\.spotify\.com\/([-a-zA-Z0-9]+\/)?(track|album|playlist)\/([a-zA-Z0-9]+)/
                    )
                    if (matchSpotifyLink) {
                        const type = matchSpotifyLink[2]
                        const id = matchSpotifyLink[3]
                        return (
                            <Box
                                component="span"
                                sx={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    width: '100%',
                                    height: '152px',
                                    borderRadius: 1
                                }}
                            >
                                <iframe
                                    allowFullScreen
                                    src={`https://open.spotify.com/embed/${type}/${id}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none'
                                    }}
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                />
                            </Box>
                        )
                    }

                    const matchAppleMusicLink = url?.match(/https:\/\/music\.apple\.com\/([^\s]+)/)
                    if (matchAppleMusicLink) {
                        return (
                            <Box
                                component="span"
                                sx={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    width: '100%',
                                    height: '152px',
                                    borderRadius: 1
                                }}
                            >
                                <iframe
                                    allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                                    sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                                    src={`https://embed.music.apple.com/${matchAppleMusicLink[1]}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none'
                                    }}
                                />
                            </Box>
                        )
                    }

                    const matchSoundcloudLink = url?.match(/https:\/\/soundcloud\.com\/([^\s]+)/)
                    if (matchSoundcloudLink) {
                        return (
                            <Box
                                component="span"
                                sx={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    width: '100%',
                                    height: '152px',
                                    borderRadius: 1
                                }}
                            >
                                <iframe
                                    allowFullScreen
                                    src={`https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/${matchSoundcloudLink[1]}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
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
