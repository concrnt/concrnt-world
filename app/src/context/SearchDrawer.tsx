import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useClient } from './ClientContext'
import { CCDrawer } from '../components/ui/CCDrawer'
import { Box, Button, Divider, Typography } from '@mui/material'
import { MessageContainer } from '../components/Message/MessageContainer'
import { Timeline } from '@concrnt/worldlib'
import { fetchWithTimeout } from '@concrnt/client'
import { SearchBox } from '../components/ui/SearchBox'
import { useTranslation } from 'react-i18next'

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
    const { t } = useTranslation('', { keyPrefix: 'ui.timelineInfo' })
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
                            searchService === null ? t('searchNotAvailable', { host: timeline?.host }) : t('search')
                        }
                        onClear={() => {
                            setSearchResult(null)
                            setSearchedQuery('')
                        }}
                    />

                    {searchResult === null ? (
                        <Box>
                            <Typography variant="caption">{t('searchResultPlaceholder')}</Typography>
                        </Box>
                    ) : (
                        <>
                            {!searchResult.content || searchResult.content.length === 0 ? (
                                <Box>
                                    <Typography>{t('searchResultEmpty')}</Typography>
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
                                        <Typography variant="h3">
                                            {t('searchResultTitle', { query: searchedQuery })}
                                        </Typography>
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
                                            {t('prev')}
                                        </Button>
                                        <Typography>{searchPage + 1}</Typography>
                                        <Button
                                            disabled={searchResult.content.length < (searchResult.limit ?? 0)}
                                            onClick={() => {
                                                setSearchPage((e) => e + 1)
                                            }}
                                        >
                                            {t('next')}
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
