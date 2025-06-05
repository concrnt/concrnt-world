import { useEffect, useState } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import { useParams, Link as NavLink } from 'react-router-dom'
import { RealtimeTimeline } from '../components/RealtimeTimeline'
import { Client, CommunityTimelineSchema, type Timeline } from '@concrnt/worldlib'
import { FullScreenLoading } from '../components/ui/FullScreenLoading'
import { ClientProvider } from '../context/ClientContext'
import { TimelineHeader } from '../components/TimelineHeader'

import TagIcon from '@mui/icons-material/Tag'
import LockIcon from '@mui/icons-material/Lock'
import { GuestBase } from '../components/GuestBase'
import { MediaViewerProvider } from '../context/MediaViewer'
import { Helmet } from 'react-helmet-async'
import { TimelineBanner } from '../components/TimelineBanner'
import { useTranslation } from 'react-i18next'

export default function GuestTimelinePage(): JSX.Element {
    const [timeline, setTimeline] = useState<Timeline<CommunityTimelineSchema> | null | undefined>(null)
    const [targetStream, setTargetStream] = useState<string[]>([])

    const { id } = useParams()

    const [client, initializeClient] = useState<Client>()

    const { t } = useTranslation('', { keyPrefix: 'pages.guestMessage' })

    useEffect(() => {
        if (!id) return
        setTargetStream([id])
        const resolver = id.split('@')[1]

        Client.createAsGuest(resolver).then((client) => {
            initializeClient(client)

            client.getTimeline<CommunityTimelineSchema>(id).then((e) => {
                setTimeline(e)
            })
        })
    }, [id])

    if (!client || !timeline) return <FullScreenLoading message="Loading..." />

    const isPrivateTimeline = !timeline.policy.isReadPublic()

    return (
        <MediaViewerProvider>
            <>
                <Helmet>
                    <title>{`#${timeline.document.body.name || 'No Title'} - Concrt`}</title>
                    <meta
                        name="description"
                        content={
                            timeline.document.body.description ||
                            `Concrnt timeline ${timeline.document.body.name || 'No Title'}`
                        }
                    />
                    <link rel="canonical" href={`https://concrnt.com/timeline/${id}`} />
                </Helmet>
                <GuestBase
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        gap: 1,
                        flex: 1
                    }}
                    additionalButton={
                        <Button
                            component={NavLink}
                            to="/register"
                            onClick={() => {
                                if (id) localStorage.setItem('preferredTimeline', id)
                            }}
                        >
                            {t('getStarted')}
                        </Button>
                    }
                >
                    <ClientProvider client={client}>
                        <Paper
                            sx={{
                                flex: 1,
                                margin: { xs: 0.5, sm: 1 },
                                mb: { xs: 0, sm: '10px' },
                                display: 'flex',
                                flexFlow: 'column',
                                borderRadius: 2,
                                overflow: 'hidden',
                                background: 'none'
                            }}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    minHeight: '100%',
                                    backgroundColor: 'background.paper',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flex: 1
                                }}
                            >
                                <TimelineHeader
                                    title={timeline.document.body.name || 'No Title'}
                                    titleIcon={isPrivateTimeline ? <LockIcon /> : <TagIcon />}
                                />

                                {isPrivateTimeline ? (
                                    <Box>
                                        <TimelineBanner timeline={timeline} />
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                height: '100%',
                                                color: 'text.disabled',
                                                p: 2
                                            }}
                                        >
                                            <LockIcon
                                                sx={{
                                                    fontSize: '10rem'
                                                }}
                                            />
                                            <Typography variant="h5">{t('privateTimeline')}</Typography>
                                            <Typography variant="caption">{t('loginToRequest')}</Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <RealtimeTimeline
                                        noRealtime
                                        timelineFQIDs={targetStream}
                                        header={<TimelineBanner timeline={timeline} />}
                                    />
                                )}
                            </Box>
                        </Paper>
                    </ClientProvider>
                </GuestBase>
            </>
        </MediaViewerProvider>
    )
}
