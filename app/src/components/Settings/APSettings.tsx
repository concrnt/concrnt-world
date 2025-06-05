import { Alert, AlertTitle, Box, Button, Divider, IconButton, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useClient } from '../../context/ClientContext'
import { type ApEntity } from '../../model'
import { ApSetup } from '../Activitypub/Setup'
import { ApFollowManager, APUserCard } from '../Activitypub/FollowManager'
import { CCDrawer } from '../ui/CCDrawer'
import { useNavigate } from 'react-router-dom'
import { WatchButton } from '../WatchButton'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import { useSnackbar } from 'notistack'
import SettingsIcon from '@mui/icons-material/Settings'
import { useGlobalState } from '../../context/GlobalState'
import { CommunityTimelineSchema, isFulfilled, Schemas, type Timeline } from '@concrnt/worldlib'
import { Message } from '@concrnt/client'
import { TimelinePicker } from '../ui/TimelinePicker'
import { useTranslation } from 'react-i18next'

export const APSettings = (): JSX.Element => {
    const { t } = useTranslation('', { keyPrefix: 'settings.ap' })
    const { client } = useClient()
    const [entity, setEntity] = useState<ApEntity | null | undefined>(undefined)
    const [openInquiry, setOpenInquiry] = useState(false)
    const [url, setUrl] = useState('')
    const navigate = useNavigate()
    const [openSettings, setOpenSettings] = useState(false)
    const { enqueueSnackbar } = useSnackbar()
    const [aliases, setAliases] = useState<string[]>([])
    const [newAlias, setNewAlias] = useState('')
    const [listenTimelines, setListenTimelines] = useState<Array<Timeline<any>>>([])
    const { allKnownTimelines } = useGlobalState()
    const [apTimeline, setApTimeline] = useState<Timeline<CommunityTimelineSchema> | null>(null)
    const [meta, setMeta] = useState<any>({})

    const timelineNGReason = (() => {
        if (!client.ccid) return null
        if (!apTimeline) return t('errApTimelineIsMissing')
        if (apTimeline.policy.getPolicySchemaURL() === 'https://policy.concrnt.world/t/inline-read-write.json') {
            if (!apTimeline.policy.getPolicyParams().writer.includes(client.ccid)) {
                return t('errApTimelineWriteSelf')
            }
            if (!apTimeline.policy.getPolicyParams().writer.includes(meta.metadata?.proxyCCID)) {
                return t('errApTimelineWriteProxy')
            }
        }

        return null
    })()

    useEffect(() => {
        client.api
            .fetchWithCredential(client.host, `/ap/api/settings`, {})
            .then(async (data: any) => {
                const requests = await Promise.allSettled(
                    data.content.listen_timelines.map((id: string) => {
                        return client.getTimeline(id)
                    })
                )

                const fulfilled = requests.filter(isFulfilled)
                setListenTimelines(fulfilled.map((r) => r.value))
            })
            .catch((e) => {
                console.error(e)
            })

        const requestOptions = {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            }
        }

        client.api
            .fetchWithCredential<ApEntity>(client.host, `/ap/api/entity/${client.ccid}`, requestOptions)
            .then((data) => {
                setEntity(data.content)
                if (data) setAliases(data.content.aliases ?? [])
            })
            .catch((_) => {
                setEntity(null)
            })

        client.getTimeline<CommunityTimelineSchema>('world.concrnt.t-ap@' + client.ccid).then((t) => {
            setApTimeline(t)
        })

        fetch(`https://${client.host}/ap/nodeinfo/2.0`)
            .then((res) => res.json())
            .then((res) => {
                setMeta(res)
            })
    }, [])

    const updateSettings = (): void => {
        client.api
            .fetchWithCredential(client.host, `/ap/api/settings`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    listen_timelines: listenTimelines.map((t) => t.id)
                })
            })
            .then(() => {
                enqueueSnackbar(t('updated'), {
                    variant: 'success'
                })
            })
    }

    const inquery = (url: string): void => {
        client.api
            .fetchWithCredential<Message<any>>(client.host, `/ap/api/import?note=${encodeURIComponent(url)}`, {
                method: 'GET',
                headers: {
                    'content-type': 'application/json'
                }
            })
            .then((data) => {
                navigate(`/${data.content.author}/${data.content.id}`)
            })
    }

    if (entity === undefined) {
        return <>loading...</>
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}
        >
            {entity === null ? (
                <ApSetup />
            ) : (
                <>
                    <Box
                        display="flex"
                        flexWrap="wrap"
                        flexDirection="row"
                        justifyContent="space-between"
                        gap={1}
                        width="100%"
                        alignItems="center"
                    >
                        <Box display="flex" flexDirection="row" gap={1} alignItems="center">
                            <Typography variant="h2">
                                @{entity.id}@{client.host}
                            </Typography>
                        </Box>
                        <Box display="flex" flexDirection="row" justifyContent="flex-end" flex="1" gap={1}>
                            <IconButton>
                                <TravelExploreIcon
                                    onClick={() => {
                                        setOpenInquiry(true)
                                    }}
                                />
                            </IconButton>
                            <WatchButton minimal timelineFQID={'world.concrnt.t-ap@' + entity.ccid} />
                            <IconButton>
                                <SettingsIcon
                                    onClick={() => {
                                        setOpenSettings(true)
                                    }}
                                />
                            </IconButton>
                        </Box>
                    </Box>
                    {timelineNGReason && (
                        <Alert
                            severity="warning"
                            action={
                                <Button
                                    variant="text"
                                    color="inherit"
                                    sx={{
                                        height: '100%'
                                    }}
                                    onClick={() => {
                                        if (meta.metadata?.proxyCCID === undefined) alert(t('serverBroken'))

                                        const base = apTimeline?.policy.getPolicyParams().writer ?? []
                                        const writers = [...new Set([...base, client.ccid, meta.metadata?.proxyCCID])]

                                        client.api
                                            .upsertTimeline(
                                                Schemas.communityTimeline,
                                                {
                                                    name: apTimeline?.document?.body?.name ?? 'ActivityPub',
                                                    shortname: apTimeline?.document?.body?.shortname ?? 'activitypub',
                                                    description:
                                                        apTimeline?.document?.body?.description ??
                                                        'ActivityPub home stream'
                                                },
                                                {
                                                    semanticID: 'world.concrnt.t-ap',
                                                    indexable: false,
                                                    policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                                                    policyParams: JSON.stringify({
                                                        isWritePublic: false,
                                                        isReadPublic: true,
                                                        writer: writers,
                                                        reader: []
                                                    })
                                                }
                                            )
                                            .then((_) => {
                                                window.location.reload()
                                            })
                                            .catch((e) => {
                                                alert(e)
                                            })
                                    }}
                                >
                                    {t('fix')}
                                </Button>
                            }
                        >
                            <AlertTitle>{t('settingsNG')}</AlertTitle>
                            <Typography>{timelineNGReason}</Typography>
                        </Alert>
                    )}

                    <ApFollowManager />
                </>
            )}
            <CCDrawer
                open={openInquiry}
                onClose={() => {
                    setOpenInquiry(false)
                }}
            >
                <Box display="flex" width="100%" gap={1} padding={1} flexDirection="column">
                    <Typography variant="h2">{t('inquery')}</Typography>
                    <Divider />
                    <Box display="flex" width="100%" gap={1} padding={1}>
                        <TextField
                            label={t('inquery')}
                            variant="outlined"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value)
                            }}
                            sx={{
                                flexGrow: 1
                            }}
                        />
                        <Button
                            onClick={() => {
                                inquery(url)
                            }}
                        >
                            {t('inquery')}
                        </Button>
                    </Box>
                </Box>
            </CCDrawer>
            <CCDrawer
                open={openSettings}
                onClose={() => {
                    setOpenSettings(false)
                }}
            >
                <Box display="flex" width="100%" gap={1} padding={1} flexDirection="column">
                    <Typography variant="h2">{t('settings')}</Typography>
                    <Typography variant="h2">{t('forwardTimeline')}</Typography>
                    {t('forwardTimelineDesc')}
                    <TimelinePicker
                        onlyCommunities
                        options={allKnownTimelines}
                        selected={listenTimelines}
                        setSelected={(streams) => {
                            setListenTimelines(streams)
                        }}
                        placeholder={t('addForwardTimeline')}
                    />
                    <Button
                        onClick={() => {
                            updateSettings()
                        }}
                    >
                        {t('update')}
                    </Button>
                    <Divider />
                    <Typography variant="h2">{t('moveOption')}</Typography>
                    <Divider />
                    <Box display="flex" width="100%" gap={1} padding={1}>
                        <TextField
                            label={t('addMoveOrigins')}
                            variant="outlined"
                            value={newAlias}
                            onChange={(e) => {
                                setNewAlias(e.target.value)
                            }}
                            sx={{
                                flexGrow: 1
                            }}
                        />
                        <Button
                            onClick={() => {
                                client.api
                                    .fetchWithCredential(
                                        client.host,
                                        `/ap/api/resolve/${encodeURIComponent(newAlias)}`,
                                        {
                                            method: 'GET',
                                            headers: {
                                                accept: 'application/ld+json'
                                            }
                                        }
                                    )
                                    .then((data: any) => {
                                        if (data.id) {
                                            const newAliases = [...new Set([...aliases, data.id])]

                                            client.api
                                                .fetchWithCredential(client.host, `/ap/api/entities/aliases`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'content-type': 'application/json'
                                                    },
                                                    body: JSON.stringify({
                                                        aliases: newAliases
                                                    })
                                                })
                                                .then((_) => {
                                                    enqueueSnackbar(t('updated'), {
                                                        variant: 'success'
                                                    })
                                                    setAliases(newAliases)
                                                })
                                        }
                                    })
                            }}
                        >
                            {t('add')}
                        </Button>
                    </Box>
                    <Box
                        display="flex"
                        flexDirection="column"
                        gap={1}
                        sx={{
                            flexGrow: 1
                        }}
                    >
                        {aliases.map((alias) => (
                            <>
                                <Typography>{alias}</Typography>
                                <APUserCard
                                    url={alias}
                                    remove={(body) => {
                                        const newAliases = aliases.filter((a) => a !== body.URL)
                                        client.api
                                            .fetchWithCredential(client.host, `/ap/api/entities/aliases`, {
                                                method: 'POST',
                                                headers: {
                                                    'content-type': 'application/json'
                                                },
                                                body: JSON.stringify({
                                                    aliases: newAliases
                                                })
                                            })
                                            .then((_) => {
                                                enqueueSnackbar(t('updated'), {
                                                    variant: 'success'
                                                })
                                                setAliases(newAliases)
                                            })
                                    }}
                                />
                            </>
                        ))}
                    </Box>
                </Box>
            </CCDrawer>
        </Box>
    )
}
