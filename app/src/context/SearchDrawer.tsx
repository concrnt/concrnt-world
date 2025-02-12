import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useClient } from './ClientContext'
import { CCDrawer } from '../components/ui/CCDrawer'
import { Box, Button, Divider, Typography } from '@mui/material'
import { MessageContainer } from '../components/Message/MessageContainer'
import { Timeline } from '@concrnt/worldlib'
import { fetchWithTimeout } from '@concrnt/client'
import { SearchBox } from '../components/ui/SearchBox'

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

interface SearchResult {
    content?: SearchEntry[]
    limit?: number
    offset?: number
}

export const SearchDrawerProvider = (props: SearchDrawerProps): JSX.Element => {
    const { client } = useClient()

    const [timelineID, setTimelineID] = useState<string | null>(null)

    const [searchResult, setSearchResult] = useState<null | SearchResult>(null)
    const [timeline, setTimeline] = useState<Timeline<any> | null>(null)
    const [searchService, setSearchService] = useState<string | null>(null)
    const [searchedQuery, setSearchedQuery] = useState<string>('')
    const [searchPage, setSearchPage] = useState(0)

    const open = useCallback((id: string) => {
        setSearchedQuery('')
        setTimeline(null)
        setSearchService(null)
        setTimelineID(id)
        setSearchResult(null)
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
        if (!searchService || !timelineID || !searchedQuery) return
        fetch(`${searchService}/timeline/${timelineID}?q=${searchedQuery}&limit=10&offset=${searchPage * 10}`)
            .then((res) => res.json())
            .then((data) => {
                setSearchResult(data)
            })
    }, [searchService, timelineID, searchedQuery, searchPage])

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
                    <SearchBox
                        onEnter={(query) => {
                            setSearchedQuery(query)
                        }}
                        disabled={searchService === null}
                        placeholder={
                            searchService === null ? `${timeline?.host}では検索が利用できません` : 'Search (beta)'
                        }
                        onClear={() => {
                            setSearchResult(null)
                            setSearchedQuery('')
                        }}
                    />

                    {searchResult === null ? (
                        <Box>
                            <Typography variant="caption">ここに検索結果が表示されます</Typography>
                        </Box>
                    ) : (
                        <>
                            {!searchResult.content || searchResult.content.length === 0 ? (
                                <Box>
                                    <Typography>見つかりませんでした</Typography>
                                </Box>
                            ) : (
                                <>
                                    <Box
                                        sx={{
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
                                        <Typography variant="h3">{searchedQuery}の検索結果</Typography>
                                        {searchResult.content.map((result) => (
                                            <>
                                                <MessageContainer
                                                    key={result.id}
                                                    messageID={result.id}
                                                    messageOwner={result.owner}
                                                    after={<Divider />}
                                                />
                                            </>
                                        ))}
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mt: 2
                                        }}
                                    >
                                        <Button
                                            disabled={searchPage === 0}
                                            onClick={() => {
                                                setSearchPage((e) => e - 1)
                                            }}
                                        >
                                            Prev
                                        </Button>
                                        <Typography>{searchPage + 1}</Typography>
                                        <Button
                                            disabled={searchResult.content.length < (searchResult.limit ?? 0)}
                                            onClick={() => {
                                                setSearchPage((e) => e + 1)
                                            }}
                                        >
                                            Next
                                        </Button>
                                    </Box>
                                </>
                            )}
                        </>
                    )}
                </Box>
            </CCDrawer>
        </SearchDrawerContext.Provider>
    )
}

export function useSearchDrawer(): SearchDrawerState {
    return useContext(SearchDrawerContext)
}
