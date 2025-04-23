import { useEffect, useState } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import { useParams, Link as NavLink } from 'react-router-dom'
import { Timeline } from '../components/Timeline/main'
import { Client } from '@concrnt/worldlib'
import { type Timeline as CoreTimeline } from '@concrnt/client'
import { FullScreenLoading } from '../components/ui/FullScreenLoading'
import { ClientProvider } from '../context/ClientContext'
import { TimelineHeader } from '../components/TimelineHeader'

import TagIcon from '@mui/icons-material/Tag'
import LockIcon from '@mui/icons-material/Lock'
import { GuestBase } from '../components/GuestBase'
import { StreamInfo } from '../components/StreamInfo'
import { MediaViewerProvider } from '../context/MediaViewer'
import { Helmet } from 'react-helmet-async'
import { loadPolicy } from '@concrnt/worldlib'

export default function GuestTimelinePage(): JSX.Element {
    const [timeline, setTimeline] = useState<CoreTimeline<any> | null | undefined>(null)
    const [targetStream, setTargetStream] = useState<string[]>([])
    const [isPrivateTimeline, setIsPrivateTimeline] = useState<boolean>(false)

    const { id } = useParams()

    const [client, initializeClient] = useState<Client>()

    useEffect(() => {
        if (!id) return
        setTargetStream([id])
        const resolver = id.split('@')[1]

        Client.createAsGuest(resolver).then((client) => {
            initializeClient(client)

            client.api.getTimeline(id).then((e) => {
                if (!e) return
                setTimeline(e)
                const policy = loadPolicy(e.policy, e.policyParams)
                setIsPrivateTimeline(!policy.isReadPublic())
            })
        })
    }, [id])

    if (!client || !timeline) return <FullScreenLoading message="Loading..." />

    return (
        <MediaViewerProvider>
            <>
                <Helmet>
                    <title>{`#${timeline.parsedDoc.body.name || 'No Title'} - Concrt`}</title>
                    <meta
                        name="description"
                        content={
                            timeline.parsedDoc.body.description ||
                            `Concrnt timeline ${timeline.parsedDoc.body.name || 'No Title'}`
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
                            はじめる
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
                                    title={timeline.parsedDoc.body.name || 'No Title'}
                                    titleIcon={isPrivateTimeline ? <LockIcon /> : <TagIcon />}
                                />

                                {isPrivateTimeline ? (
                                    <Box>
                                        <StreamInfo id={timeline.id} />
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
                                            <Typography variant="h5">このコミュニティはプライベートです。</Typography>
                                            <Typography variant="caption">
                                                ログインすると、閲覧申請を送信できます。
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Timeline
                                        noRealtime
                                        timelineFQIDs={targetStream}
                                        header={<StreamInfo id={timeline.id} />}
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
