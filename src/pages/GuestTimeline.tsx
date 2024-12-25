import { useEffect, useState } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import { useParams, Link as NavLink } from 'react-router-dom'
import { Timeline } from '../components/Timeline/main'
import { Client, type CoreTimeline } from '@concurrent-world/client'
import { FullScreenLoading } from '../components/ui/FullScreenLoading'
import { ClientProvider } from '../context/ClientContext'
import { TimelineHeader } from '../components/TimelineHeader'

import TagIcon from '@mui/icons-material/Tag'
import LockIcon from '@mui/icons-material/Lock'
import { GuestBase } from '../components/GuestBase'
import { StreamInfo } from '../components/StreamInfo'
import { MediaViewerProvider } from '../context/MediaViewer'
import { Helmet } from 'react-helmet-async'

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
        const client = new Client(resolver)
        initializeClient(client)

        client.api.getTimeline(id).then((e) => {
            if (!e) return
            setTimeline(e)

            if (e.policy === 'https://policy.concrnt.world/t/inline-read-write.json' && e?.policyParams) {
                try {
                    const params = JSON.parse(e.policyParams)
                    setIsPrivateTimeline(!params.isReadPublic)
                } catch (e) {
                    setIsPrivateTimeline(true)
                }
            }
        })
    }, [id])

    if (!client || !timeline) return <FullScreenLoading message="Loading..." />

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
                                localStorage.setItem('preferredTimeline', timeline.id)
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
                                    title={timeline.document.body.name || 'No Title'}
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
                                        streams={targetStream}
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
