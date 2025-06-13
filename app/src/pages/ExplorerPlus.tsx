import { Helmet } from 'react-helmet-async'
import {
    Avatar,
    Box,
    Button,
    Card,
    CardActionArea,
    CardActions,
    CardMedia,
    Divider,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CCWallpaper } from '../components/ui/CCWallpaper'
import { WatchButton } from '../components/WatchButton'
import FindInPageIcon from '@mui/icons-material/FindInPage'
import { CCIconButton } from '../components/ui/CCIconButton'
import { useTimelineDrawer } from '../context/TimelineDrawer'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useUserDrawer } from '../context/UserDrawer'
import { CCAvatar } from '../components/ui/CCAvatar'
import CasinoIcon from '@mui/icons-material/Casino'
import AddIcon from '@mui/icons-material/Add'

import DnsIcon from '@mui/icons-material/Dns'
import ForumIcon from '@mui/icons-material/Forum'
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople'
import { useClient } from '../context/ClientContext'
import { useSnackbar } from 'notistack'
import { type CommunityTimelineSchema, Schemas } from '@concrnt/worldlib'
import { CCEditor } from '../components/ui/cceditor'
import { CCDrawer } from '../components/ui/CCDrawer'
import { CfmRenderer } from '../components/ui/CfmRenderer'

export interface Domain {
    fqdn: string
    ccid: string
    csid: string
    tag: string
    score: number
    meta?: DomainMeta
    isScoreFixed: boolean
    dimension: string
    cdate: string
    mdate: string
    lastScraped: string
}

export interface DomainMeta {
    nickname: string
    description: string
    logo: string
    wordmark: string
    themeColor: string
    maintainerName: string
    maintainerEmail: string
    registration: string
    version: string
    buildInfo: {
        BuildTime: string
        BuildMachine: string
        GoVersion: string
    }
    captchaSiteKey: string
    vapidKey: string
}

export interface Timeline {
    id: string
    indexable: boolean
    owner: string
    author: string
    schema: string
    policy: string
    policyParams: string
    document?: string
    _parsedDocument: {
        id: string
        owner: string
        signer: string
        type: string
        schema: string
        body: {
            name: string
            shortname: string
            description: string
            banner: string
        }
        meta: {
            client: string
        }
        signAt: string
        indexable: boolean
        policy: string
        keyID: string
    }
    signature: string
    cdate: string
    mdate: string
    domainFQDN?: string
}

export interface User {
    id: string
    author: string
    schema: string
    document?: string
    _parsedDocument: {
        semanticID: string
        signer: string
        type: string
        schema: string
        body: {
            username: string
            description: string
            avatar: string
            banner: string
            badges: Array<{
                badgeId: string
                seriesId: string
            }>
        }
        meta: {
            client: string
        }
        signedAt: string
        KeyID: string
    }
    signature: string
    cdate: string
    mdate: string
    fqdn?: string
}

export function ExplorerPlusPage(): JSX.Element {
    const { tab } = useParams()
    const { client } = useClient()
    const { enqueueSnackbar } = useSnackbar()
    const { t } = useTranslation('', { keyPrefix: 'pages.explore' })
    const theme = useTheme()
    const { open } = useTimelineDrawer()
    const userDrawer = useUserDrawer()

    const EXPLORER_HOST = 'https://explorer.concrnt.world'
    // const EXPLORER_HOST = 'https://c.kokopi.me'
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
    const [timelineDraft, setTimelineDraft] = useState<CommunityTimelineSchema>()

    const [timelines, setTimelines] = useState<Timeline[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [domains, setDomains] = useState<Domain[]>([])
    const [stat, setStat] = useState<{ domains: number; timelines: number; users: number }>({
        domains: 0,
        timelines: 0,
        users: 0
    })

    const [timelineQuery, setTimelineQuery] = useState('')
    const [userQuery, setUserQuery] = useState('')
    const [rerollCount, reroll] = useState(0)

    useEffect(() => {
        fetch(EXPLORER_HOST + '/stat').then(async (result) => {
            setStat(await result.json())
        })
    }, [])

    useEffect(() => {
        // fetch
        if (tab !== 'timelines') return

        let unmounted = false
        const fetcher = setTimeout(() => {
            if (unmounted) return
            if (timelineQuery === '') {
                fetch(EXPLORER_HOST + '/timeline?random=true&limit=20').then(async (result) => {
                    if (unmounted) return
                    setTimelines(await result.json())
                })
            } else {
                fetch(EXPLORER_HOST + '/timeline?limit=20&q=' + timelineQuery).then(async (result) => {
                    if (unmounted) return
                    setTimelines(await result.json())
                })
            }
        }, 200)

        return () => {
            unmounted = true
            clearTimeout(fetcher)
        }
    }, [timelineQuery, rerollCount, tab])

    useEffect(() => {
        if (tab !== 'users') return

        let unmounted = false
        const fetcher = setTimeout(() => {
            if (unmounted) return

            if (userQuery === '') {
                fetch(EXPLORER_HOST + '/user?random=true&limit=20').then(async (result) => {
                    setUsers(await result.json())
                })
            } else {
                fetch(EXPLORER_HOST + '/user?limit=20&q=' + userQuery).then(async (result) => {
                    setUsers(await result.json())
                })
            }
        }, 200)

        return () => {
            unmounted = true
            clearTimeout(fetcher)
        }
    }, [userQuery, rerollCount, tab])

    useEffect(() => {
        fetch(EXPLORER_HOST + '/domain').then(async (result) => {
            setDomains(await result.json())
        })
    }, [])

    const getDomainFromFQDN = useCallback(
        (fqdn: string | undefined) => {
            return domains.filter((d) => d.fqdn === fqdn)[0]
        },
        [domains]
    )

    const navigate = useNavigate()

    const pageRef = useRef<HTMLDivElement>(null)

    const createNewTimeline = (body: CommunityTimelineSchema): void => {
        client
            .createCommunityTimeline(body)
            .then((e: any) => {
                const id: string = e.id
                if (id) navigate('/timeline/' + id)
                else enqueueSnackbar(t('createFailed'), { variant: 'error' })
            })
            .catch((e) => {
                console.error(e)
                enqueueSnackbar(t('createFailed'), { variant: 'error' })
            })
    }

    return (
        <>
            <Helmet>
                <title>Explorer - Concrnt</title>
            </Helmet>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    padding: 1,
                    background: theme.palette.background.paper,
                    minHeight: '100%',
                    overflowX: 'hidden',
                    overflowY: 'scroll'
                }}
                ref={pageRef}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                    <Box sx={{ display: 'flex' }}>
                        <Typography variant="h2">{t('title')}</Typography>
                        <Button
                            variant="text"
                            component={NavLink}
                            to={'/classicexplorer/timelines'}
                            sx={{ ml: 'auto' }}
                            size={'small'}
                            disableElevation
                        >
                            {t('classicEdition')}
                        </Button>
                    </Box>

                    <Divider />

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row-reverse',
                            gap: 1,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap'
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: 2,
                                alignItems: 'center',
                                justifyContent: 'flex-end'
                            }}
                        >
                            <Typography variant="caption" display="flex" flexDirection="row" gap={1}>
                                world stat:
                            </Typography>

                            <Typography variant="caption" display="flex" flexDirection="row" gap={1}>
                                <DnsIcon fontSize={'small'} /> {stat.domains}
                            </Typography>
                            <Typography variant="caption" display="flex" flexDirection="row" gap={1}>
                                <ForumIcon fontSize={'small'} /> {stat.timelines}
                            </Typography>
                            <Typography variant="caption" display="flex" flexDirection="row" gap={1}>
                                <EmojiPeopleIcon fontSize={'small'} /> {stat.users}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: 1,
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                flex: 1
                            }}
                        >
                            <Tabs
                                value={tab}
                                onChange={(_, v) => {
                                    navigate(`/explorer/${v}`)
                                }}
                            >
                                <Tab value={'timelines'} label={t('communities')} />
                                <Tab value={'users'} label={t('peoples')} />
                            </Tabs>
                        </Box>
                    </Box>

                    {tab === 'timelines' && (
                        <>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end'
                                }}
                            >
                                <Button
                                    variant="text"
                                    onClick={() => {
                                        setDrawerOpen(true)
                                    }}
                                    startIcon={<AddIcon />}
                                >
                                    {t('createNew')}
                                </Button>
                            </Box>

                            <TextField
                                value={timelineQuery}
                                onChange={(e) => {
                                    setTimelineQuery(e.target.value)
                                }}
                                label={t('searchForCommunities')}
                                variant={'outlined'}
                                fullWidth
                            />

                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                    gap: 1
                                }}
                            >
                                {timelines.map((tl) => {
                                    return (
                                        <Card
                                            key={tl.id}
                                            sx={{
                                                height: '100px'
                                            }}
                                        >
                                            <CardActionArea
                                                disableRipple
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'flex-start',
                                                    gap: 1
                                                }}
                                                //component={NavLink}
                                                //to={'/timeline/' + tl.id}
                                            >
                                                <CardMedia sx={{ height: '100px', width: '100px' }}>
                                                    <CCWallpaper
                                                        sx={{
                                                            height: '100px',
                                                            width: '100px'
                                                        }}
                                                        override={tl._parsedDocument.body.banner}
                                                    />
                                                </CardMedia>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        paddingY: 0.3,
                                                        paddingX: 0.5,
                                                        height: '100%',
                                                        flex: 1,
                                                        minWidth: 0
                                                    }}
                                                >
                                                    <Box flexGrow={1}>
                                                        <Typography
                                                            variant={'h4'}
                                                            sx={{
                                                                textOverflow: 'ellipsis',
                                                                overflow: 'hidden',
                                                                display: 'block',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {tl._parsedDocument.body.name}
                                                        </Typography>
                                                        <Typography
                                                            variant={'caption'}
                                                            sx={{
                                                                textOverflow: 'ellipsis',
                                                                overflow: 'hidden',
                                                                display: 'block',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {tl._parsedDocument.body.description}
                                                        </Typography>
                                                    </Box>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            gap: 1,
                                                            alignItems: 'center',
                                                            marginTop: 'auto'
                                                        }}
                                                    >
                                                        <Avatar
                                                            src={getDomainFromFQDN(tl.domainFQDN)?.meta?.logo}
                                                            sx={{ height: 18, width: 18 }}
                                                        />
                                                        <Typography variant="caption">
                                                            {getDomainFromFQDN(tl.domainFQDN)?.meta?.nickname}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, marginLeft: 'auto' }}>
                                                            <WatchButton minimal small timelineFQID={tl.id} />
                                                            <Tooltip title={t('quicklook')} placement={'top'} arrow>
                                                                <CCIconButton
                                                                    size={'small'}
                                                                    onClick={() => {
                                                                        open(tl.id)
                                                                    }}
                                                                >
                                                                    <FindInPageIcon />
                                                                </CCIconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </CardActionArea>
                                        </Card>
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
                                        {client.host}
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
                                        {t('create')}
                                    </Button>
                                </Box>
                            </CCDrawer>
                        </>
                    )}
                    {tab === 'users' && (
                        <>
                            <TextField
                                value={userQuery}
                                onChange={(e) => {
                                    setUserQuery(e.target.value)
                                }}
                                label={t('searchForPeoples')}
                                variant={'outlined'}
                                fullWidth
                                sx={{ marginY: 1 }}
                            />

                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                    gap: 1
                                }}
                            >
                                {users.map((u) => {
                                    return (
                                        <Card
                                            key={u.id}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'stretch'
                                            }}
                                        >
                                            <CardActionArea
                                                component={NavLink}
                                                to={'/' + u.author}
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'stretch',
                                                    flex: 1
                                                }}
                                            >
                                                <CCWallpaper
                                                    sx={{
                                                        height: '80px'
                                                    }}
                                                    override={u._parsedDocument.body.banner}
                                                />
                                                <Box position="relative" height={0}>
                                                    <Box
                                                        position="relative"
                                                        component={NavLink}
                                                        to={'/' + u.author}
                                                        sx={{
                                                            top: '-30px',
                                                            left: '10px'
                                                        }}
                                                    >
                                                        <CCAvatar
                                                            alt={u._parsedDocument.body.username}
                                                            avatarURL={u._parsedDocument.body.avatar}
                                                            identiconSource={u.author}
                                                            sx={{
                                                                width: '60px',
                                                                height: '60px'
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                                <Box mt="40px" mx={1}>
                                                    <Typography variant="h2">
                                                        {u._parsedDocument.body.username}
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        maxHeight: '100px',
                                                        overflowX: 'hidden',
                                                        overflowY: 'auto',
                                                        px: 1,
                                                        mb: 1,
                                                        flex: 1
                                                    }}
                                                >
                                                    <CfmRenderer
                                                        messagebody={u._parsedDocument.body.description ?? ''}
                                                        emojiDict={{}}
                                                    />
                                                </Box>
                                            </CardActionArea>
                                            <CardActions
                                                sx={{
                                                    justifyContent: 'flex-end'
                                                }}
                                            >
                                                <WatchButton
                                                    minimal
                                                    small
                                                    timelineFQID={'world.concrnt.t-home@' + u.author}
                                                />
                                                <Tooltip title={t('quicklook')} placement={'top'} arrow>
                                                    <CCIconButton
                                                        size={'small'}
                                                        onClick={() => {
                                                            userDrawer.open(u.author)
                                                        }}
                                                    >
                                                        <FindInPageIcon />
                                                    </CCIconButton>
                                                </Tooltip>
                                            </CardActions>
                                        </Card>
                                    )
                                })}
                            </Box>
                        </>
                    )}
                </Box>
                {((tab === 'timelines' && !timelineQuery) || (tab === 'users' && !userQuery)) && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                            variant={'outlined'}
                            onClick={() => {
                                reroll((prev) => prev + 1)
                                pageRef.current?.scrollTo({ top: 0 })
                            }}
                            startIcon={<CasinoIcon />}
                        >
                            {t('reroll')}
                        </Button>
                    </Box>
                )}
            </Box>
        </>
    )
}
