import { Box, Button, Divider, Tab, Tabs, TextField, Typography, useTheme } from '@mui/material'
import { type CommunityTimelineSchema, Schemas, type CoreProfile, type Timeline } from '@concurrent-world/client'
import { useClient } from '../context/ClientContext'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Fuzzysort from 'fuzzysort'

import { CCDrawer } from '../components/ui/CCDrawer'
import { CCEditor } from '../components/ui/cceditor'
import { useSnackbar } from 'notistack'
import { StreamCard } from '../components/Stream/Card'
import { SubProfileCard } from '../components/SubProfileCard'
import { DomainCard } from '../components/ui/DomainCard'
import { Helmet } from 'react-helmet-async'

interface StreamWithDomain {
    domain: string
    stream: Timeline<CommunityTimelineSchema>
}

interface ProfileWithDomain {
    domain: string
    profile: CoreProfile<any>
}

export function Explorer(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'pages.explore' })
    const { client } = useClient()
    const theme = useTheme()
    const navigate = useNavigate()

    const { tab } = useParams()
    const path = useLocation()
    const hash = path.hash.replace('#', '')

    const hashQuery = useMemo(() => {
        const queries = hash.split('&')
        const result: Record<string, string> = {}
        queries.forEach((e) => {
            const [key, value] = e.split('=')
            if (!key || !value) return
            result[key] = value
        })
        return result
    }, [hash])

    const [itr, setItr] = useState<{ mode: 'since' | 'until'; cursor: string | null }>({
        mode: 'since',
        cursor: null
    })

    const profileSchema = hashQuery.schema ?? Schemas.profile

    const [domains, setDomains] = useState<string[]>([])

    const [streams, setStreams] = useState<StreamWithDomain[]>([])
    const [searchResult, setSearchResult] = useState<StreamWithDomain[]>([])
    const [search, setSearch] = useState<string>('')
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
    const [profiles, setProfiles] = useState<ProfileWithDomain[]>([])
    const [timelineDraft, setTimelineDraft] = useState<CommunityTimelineSchema>()

    const { enqueueSnackbar } = useSnackbar()

    const selectedDomains = useMemo(() => {
        return hashQuery.domains?.split(',') ?? [client.api.host]
    }, [hashQuery, client.api.host])

    const updateHash = (key: string, value: string): void => {
        hashQuery[key] = value
        const queries = Object.entries(hashQuery)
            .map((e) => e.join('='))
            .join('&')
        navigate(`/classicexplorer/${tab}#${queries}`)
    }

    const load = (): void => {
        client.api.getDomains().then((e) => {
            if (!client.api.host) return
            const domains = [client.host, ...e.filter((e) => e.fqdn !== client.host).map((e) => e.fqdn)]
            setDomains(domains)
        })
    }

    useEffect(() => {
        if (tab !== 'timelines') return
        if (selectedDomains.length === 0) {
            setStreams([])
            setSearchResult([])
            return
        }
        let unmounted = false
        Promise.all(
            selectedDomains.map(async (e) => {
                const streams = await client.getTimelinesBySchema<CommunityTimelineSchema>(e, Schemas.communityTimeline)
                return streams.map((stream) => {
                    return {
                        domain: e,
                        stream
                    }
                })
            })
        ).then((e) => {
            if (unmounted) return
            const streams = e.flat()
            setStreams(streams)
            setSearchResult(streams)
        })
        return () => {
            unmounted = true
        }
    }, [selectedDomains, tab])

    useEffect(() => {
        if (tab !== 'users') return
        if (profileSchema === '') return
        let unmounted = false
        const timer = setTimeout(() => {
            Promise.all(
                selectedDomains.map(async (e) => {
                    const query: Record<string, any> = { schema: profileSchema, domain: e, limit: 12 }
                    if (itr.cursor) {
                        query[itr.mode] = Math.floor(new Date(itr.cursor).getTime() / 1000)
                    }
                    const profiles = await client.api.getProfiles<any>(query)
                    return profiles.map((profile) => {
                        return {
                            domain: e,
                            profile
                        }
                    })
                })
            ).then((e) => {
                if (unmounted) return
                setProfiles(
                    e
                        .flat()
                        .reverse()
                        .filter((e) => {
                            return 'username' in e.profile.document.body && 'avatar' in e.profile.document.body
                        })
                        .sort((a, b) => {
                            if (a.profile.cdate < b.profile.cdate) return 1
                            if (a.profile.cdate > b.profile.cdate) return -1
                            return 0
                        })
                )
            })
        }, 500)

        return () => {
            unmounted = true
            clearTimeout(timer)
        }
    }, [profileSchema, selectedDomains, tab, itr])

    const createNewTimeline = (body: CommunityTimelineSchema): void => {
        client
            .createCommunityTimeline(body)
            .then((e: any) => {
                const id: string = e.id
                if (id) navigate('/timeline/' + id)
                else enqueueSnackbar('コミュニティの作成に失敗しました', { variant: 'error' })
            })
            .catch((e) => {
                console.error(e)
                enqueueSnackbar('コミュニティの作成に失敗しました', { variant: 'error' })
            })
    }

    useEffect(() => {
        load()
    }, [])

    useEffect(() => {
        if (search === '') {
            setSearchResult(streams)
            return
        }
        setSearchResult(
            Fuzzysort.go(search, streams, {
                keys: ['stream.document.body.name', 'stream.document.body.description']
            }).map((e) => e.obj)
        )
    }, [search])

    if (!client.api.host) return <>loading...</>

    return (
        <>
            <Helmet>
                <title>{t('title')} - Concrnt</title>
                <meta name="description" content={t('description')} />
            </Helmet>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    paddingX: 1,
                    paddingTop: 1,
                    background: theme.palette.background.paper,
                    minHeight: '100%',
                    overflowY: 'scroll'
                }}
            >
                <Box>
                    <Box sx={{ display: 'flex' }}>
                        <Typography variant="h2">{t('title')}</Typography>
                        <Button
                            component={NavLink}
                            to={'/explorer/timelines'}
                            sx={{ ml: 'auto' }}
                            size={'small'}
                            disableElevation
                        >
                            グローバルビュー
                        </Button>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                </Box>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 2
                    }}
                >
                    {domains.map((e) => (
                        <DomainCard
                            key={e}
                            domainFQDN={e}
                            selected={selectedDomains.includes(e)}
                            onClick={() => {
                                updateHash('domains', e)
                            }}
                            onCheck={(state) => {
                                if (state) updateHash('domains', [...new Set([...selectedDomains, e])].join(','))
                                else updateHash('domains', selectedDomains.filter((f) => f !== e).join(','))
                            }}
                        />
                    ))}
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Tabs
                    value={tab}
                    onChange={(_, v) => {
                        navigate(`/classicexplorer/${v}#${hash}`)
                    }}
                >
                    <Tab value={'timelines'} label={t('communities')} />
                    <Tab value={'users'} label={t('peoples')} />
                </Tabs>
                <Divider sx={{ mb: 2 }} />
                {tab === 'timelines' && (
                    <>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <Typography variant="h3" gutterBottom>
                                {t('communities')}
                            </Typography>
                            <Button
                                onClick={() => {
                                    setDrawerOpen(true)
                                }}
                            >
                                {t('createNew')}
                            </Button>
                        </Box>
                        <TextField
                            label="search"
                            variant="outlined"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                            }}
                        />
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: 2
                            }}
                        >
                            {searchResult.map((value) => {
                                return (
                                    <StreamCard
                                        key={value.stream.id}
                                        streamID={value.stream.id}
                                        name={value.stream.document.body.name}
                                        description={value.stream.document.body.description ?? 'no description'}
                                        banner={value.stream.document.body.banner ?? ''}
                                        domain={value.domain}
                                        isOwner={value.stream.author === client.ccid}
                                    />
                                )
                            })}
                        </Box>
                        <CCDrawer
                            open={drawerOpen}
                            onClose={() => {
                                setDrawerOpen(false)
                            }}
                        >
                            <Box p={1}>
                                <Typography variant="h3" gutterBottom>
                                    {t('createNewCommunity.title')}
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {t('createNewCommunity.desc1')}
                                    {client.api.host}
                                    {t('createNewCommunity.desc2')}
                                </Typography>
                                <Divider />
                                <CCEditor
                                    schemaURL={Schemas.communityTimeline}
                                    value={timelineDraft}
                                    setValue={setTimelineDraft}
                                />
                                <Button
                                    onClick={() => {
                                        if (timelineDraft) createNewTimeline(timelineDraft)
                                    }}
                                >
                                    作成
                                </Button>
                            </Box>
                        </CCDrawer>
                    </>
                )}
                {tab === 'users' && (
                    <>
                        <Typography variant="h3" gutterBottom>
                            {t('peoples')}
                        </Typography>
                        <TextField
                            label="search"
                            variant="outlined"
                            value={profileSchema}
                            onChange={(e) => {
                                updateHash('schema', e.target.value)
                            }}
                        />
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: 2
                            }}
                        >
                            {profiles.map((p) => (
                                <Box
                                    key={p.profile.id}
                                    sx={{
                                        contentVisibility: 'auto'
                                    }}
                                >
                                    <SubProfileCard showccid character={p.profile} resolveHint={p.domain} />
                                </Box>
                            ))}
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '1em'
                            }}
                        >
                            <Button
                                onClick={() => {
                                    setItr({ mode: 'since', cursor: profiles[0]?.profile.cdate ?? null })
                                }}
                            >
                                prev
                            </Button>
                            <Button
                                onClick={() => {
                                    setItr({
                                        mode: 'until',
                                        cursor: profiles[profiles.length - 1]?.profile.cdate ?? null
                                    })
                                }}
                            >
                                next
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </>
    )
}
