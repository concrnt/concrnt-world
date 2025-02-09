import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useClient } from './ClientContext'
import { CCDrawer } from '../components/ui/CCDrawer'
import { Box, Divider, TextField, Typography } from '@mui/material'
import { MessageContainer } from '../components/Message/MessageContainer'
import { Timeline } from '@concrnt/worldlib'
import { fetchWithTimeout } from '@concrnt/client'

export interface SearchDrawerState {
    open: (id: string) => void
}

const SearchDrawerContext = createContext<SearchDrawerState>({
    open: () => {}
})

interface SearchDrawerProps {
    children: JSX.Element | JSX.Element[]
}

interface SearchEntry {
    id: string
    owner: string
}

export const SearchDrawerProvider = (props: SearchDrawerProps): JSX.Element => {
    const { client } = useClient()

    const [timelineID, setTimelineID] = useState<string | null>(null)
    const [query, setQuery] = useState<string>('')
    const [results, setResults] = useState<SearchEntry[]>([])

    const [timeline, setTimeline] = useState<Timeline<any> | null>(null)
    const [searchService, setSearchService] = useState<string | null>(null)

    const open = useCallback((id: string) => {
        setQuery('')
        setResults([])
        setTimeline(null)
        setSearchService(null)
        setTimelineID(id)
    }, [])

    useEffect(() => {
        if (!timelineID) return
        client.getTimeline<any>(timelineID).then((t) => {
            if (!t) return
            setTimeline(t)
            fetchWithTimeout(`https://${t.host}/services`, {})
                .then((res) => res.json())
                .then((data) => {
                    if ('net.concrnt.search' in data) {
                        const service = data['net.concrnt.search']
                        setSearchService(`https://${t.host}${service.path}`)
                    }
                })
        })
    }, [timelineID])

    useEffect(() => {
        let mounted = true
        const search = setTimeout(() => {
            if (timeline && query) {
                fetch(`${searchService}/timeline/${timelineID}?q=${query}`)
                    .then((res) => res.json())
                    .then((data) => {
                        if (!mounted) return
                        setResults(data.content ?? [])
                    })
            } else {
                if (!mounted) return
                setResults([])
            }
        }, 300)

        return () => {
            mounted = false
            clearTimeout(search)
        }
    }, [query, timelineID, searchService])

    return (
        <SearchDrawerContext.Provider
            value={useMemo(() => {
                return {
                    open
                }
            }, [open])}
        >
            {props.children}
            <CCDrawer
                open={!!timelineID}
                onClose={() => {
                    setTimelineID(null)
                }}
            >
                <Box p={2}>
                    <Typography variant="h2">タイムライン内検索</Typography>
                    {searchService ? (
                        <>
                            <TextField
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value)
                                }}
                                variant="outlined"
                                fullWidth
                                placeholder="Search"
                            />
                            <Box
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    listStyle: 'none',
                                    overflowX: 'hidden',
                                    overflowY: 'auto',
                                    overscrollBehaviorY: 'none',
                                    scrollbarGutter: 'stable',
                                    gap: 1
                                }}
                            >
                                {results.map((result) => (
                                    <>
                                        <MessageContainer
                                            key={result.id}
                                            messageID={result.id}
                                            messageOwner={result.owner}
                                        />
                                        <Divider />
                                    </>
                                ))}
                            </Box>
                        </>
                    ) : (
                        <Typography>{timeline?.host ?? 'このユーザー'}は検索をサポートしていません</Typography>
                    )}
                </Box>
            </CCDrawer>
        </SearchDrawerContext.Provider>
    )
}

export function useSearchDrawer(): SearchDrawerState {
    return useContext(SearchDrawerContext)
}
