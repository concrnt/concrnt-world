import { Helmet } from 'react-helmet-async'
import { Avatar, Box, Card, CardMedia, Divider, TextField, Tooltip, Typography, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useCallback, useEffect, useState } from 'react'
import { CCWallpaper } from '../components/ui/CCWallpaper'
import { WatchButton } from '../components/WatchButton'
import FindInPageIcon from '@mui/icons-material/FindInPage'
import { CCIconButton } from '../components/ui/CCIconButton'
import { useTimelineDrawer } from '../context/TimelineDrawer'

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

export function ExplorerPlusPage(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'pages.explore' })
    const theme = useTheme()
    const { open } = useTimelineDrawer()

    const [timelines, setTimelines] = useState<Timeline[]>([])
    const [domains, setDomains] = useState<Domain[]>([])
    const [stat, setStat] = useState<{ domains: number; timelines: number }>({ domains: 0, timelines: 0 })

    const [query, setQuery] = useState('')

    const [textArea, setTextArea] = useState('')

    useEffect(() => {
        fetch('https://explorer.concrnt.world/stat').then(async (result) => {
            setStat(await result.json())
        })
    }, [])

    useEffect(() => {
        // fetch
        if (query === '') {
            fetch('https://explorer.concrnt.world/timeline?random=true&limit=30').then(async (result) => {
                setTimelines(await result.json())
            })
        } else {
            fetch('https://explorer.concrnt.world/timeline?limit=30&q=' + query).then(async (result) => {
                setTimelines(await result.json())
            })
        }

        fetch('https://explorer.concrnt.world/domain').then(async (result) => {
            setDomains(await result.json())
        })
    }, [query])

    const getDomainFromFQDN = useCallback(
        (fqdn: string | undefined) => {
            return domains.filter((d) => d.fqdn === fqdn)[0]
        },
        [domains]
    )

    return (
        <>
            <Helmet>
                <title>ExplorerPlus - Concrnt</title>
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                    <Typography variant="h2">new {t('title')}</Typography>
                    <Divider sx={{ mb: 1 }} />

                    <Typography variant={'caption'}>
                        現在 {stat.domains} のアクティブなドメイン {stat.timelines} のアクティブなタイムライン
                    </Typography>

                    <Typography variant="h3">タイムライン</Typography>
                    <Divider />

                    <TextField
                        value={textArea}
                        onChange={(e) => {
                            setTextArea(e.target.value)
                            setQuery(e.target.value)
                        }}
                        label={'ここに入力してタイムラインを検索'}
                        variant={'outlined'}
                        fullWidth
                        sx={{ marginY: 1 }}
                    />

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(384px, 1fr))',
                            gap: 1
                        }}
                    >
                        {timelines.map((t) => {
                            return (
                                <Card key={t.id} sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                                    <CardMedia sx={{ height: '100px', width: '100px' }}>
                                        <CCWallpaper
                                            sx={{
                                                height: '100px',
                                                width: '100px'
                                            }}
                                            override={t._parsedDocument.body.banner}
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
                                            <Typography variant={'h4'}>{t._parsedDocument.body.name}</Typography>
                                            <Typography
                                                variant={'caption'}
                                                sx={{
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    display: 'block',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {t._parsedDocument.body.description}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', marginTop: 'auto' }}>
                                            <Avatar
                                                src={getDomainFromFQDN(t.domainFQDN)?.meta?.logo}
                                                sx={{ height: 18, width: 18 }}
                                            />
                                            <Typography variant="caption">
                                                {getDomainFromFQDN(t.domainFQDN)?.meta?.nickname}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, marginLeft: 'auto' }}>
                                                <WatchButton minimal small timelineID={t.id} />
                                                <Tooltip title={'みてみる'} placement={'top'} arrow>
                                                    <CCIconButton
                                                        size={'small'}
                                                        onClick={() => {
                                                            open(t.id)
                                                        }}
                                                    >
                                                        <FindInPageIcon />
                                                    </CCIconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Card>
                            )
                        })}
                    </Box>
                </Box>
            </Box>
        </>
    )
}
