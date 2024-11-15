import { useEffect, useRef, useState } from 'react'
import { Box, Button, Divider, Paper, Typography } from '@mui/material'
import { useLocation, useParams, Link as NavLink } from 'react-router-dom'
import { Timeline } from '../components/Timeline/main'
import { Client, type User } from '@concurrent-world/client'
import { FullScreenLoading } from '../components/ui/FullScreenLoading'
import { ClientProvider } from '../context/ClientContext'
import TickerProvider from '../context/Ticker'

import { type VListHandle } from 'virtua'
import { TimelineHeader } from '../components/TimelineHeader'

import TagIcon from '@mui/icons-material/Tag'
import LockIcon from '@mui/icons-material/Lock'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import { Profile } from '../components/Profile'
import { MessageContainer } from '../components/Message/MessageContainer'
import { GuestBase } from '../components/GuestBase'
import { StreamInfo } from '../components/StreamInfo'
import { MediaViewerProvider } from '../context/MediaViewer'

export interface GuestPageProps {
    page: 'timeline' | 'entity' | 'message'
}

export default function GuestTimelinePage(props: GuestPageProps): JSX.Element {
    const reactlocation = useLocation()
    const [title, setTitle] = useState<string>('')
    const [user, setUser] = useState<User | null | undefined>(null)
    const [targetStream, setTargetStream] = useState<string[]>([])
    const [isPrivateTimeline, setIsPrivateTimeline] = useState<boolean>(false)

    const { id, authorID, messageID } = useParams()

    const timelineRef = useRef<VListHandle>(null)

    const [client, initializeClient] = useState<Client>()
    useEffect(() => {
        switch (props.page) {
            case 'timeline':
                {
                    if (!id) return
                    setTargetStream([id])
                    const resolver = id.split('@')[1]
                    const client = new Client(resolver)
                    initializeClient(client)

                    client.api.getTimeline(id).then((e) => {
                        setTitle(e?.document.body.name ?? '')

                        if (e?.policy === 'https://policy.concrnt.world/t/inline-read-write.json' && e?.policyParams) {
                            try {
                                const params = JSON.parse(e.policyParams)
                                setIsPrivateTimeline(!params.isReadPublic)
                            } catch (e) {
                                setIsPrivateTimeline(true)
                            }
                        }
                    })
                    setUser(undefined)
                }
                break
            case 'entity':
                {
                    if (!id) return
                    const client = new Client('ariake.concrnt.net')
                    initializeClient(client)

                    client.getUser(id).then((e) => {
                        setUser(e)
                        setTitle(e?.profile?.username ?? '')
                        setTargetStream([e?.homeTimeline ?? ''])
                    })
                }
                break
            case 'message':
                {
                    if (!authorID || !messageID) return
                    const client = new Client('ariake.concrnt.net')
                    initializeClient(client)

                    client.getUser(authorID).then((e) => {
                        setUser(e)
                        setTitle(e?.profile?.username ?? '')
                        setTargetStream([e?.homeTimeline ?? ''])
                    })
                }
                break
        }
    }, [props.page, id, reactlocation.hash])

    const scrollParentRef = useRef<HTMLDivElement>(null)

    if (!client) return <FullScreenLoading message="Loading..." />

    const providers = (childs: JSX.Element): JSX.Element => (
        <TickerProvider>
            <MediaViewerProvider>{childs}</MediaViewerProvider>
        </TickerProvider>
    )

    return providers(
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
                        if (props.page === 'timeline' && id) {
                            localStorage.setItem('preferredTimeline', id)
                        }
                    }}
                >
                    はじめる
                </Button>
            }
        >
            <ClientProvider client={client}>
                <>
                    {props.page === 'message' && messageID && authorID && (
                        <Paper
                            sx={{
                                margin: { xs: 0.5, sm: 1 },
                                display: 'flex',
                                flexFlow: 'column',
                                p: 2
                            }}
                        >
                            <MessageContainer messageID={messageID} messageOwner={authorID} />
                        </Paper>
                    )}

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
                                title={title}
                                titleIcon={
                                    isPrivateTimeline ? (
                                        <LockIcon />
                                    ) : props.page === 'entity' ? (
                                        <AlternateEmailIcon />
                                    ) : (
                                        <TagIcon />
                                    )
                                }
                            />

                            {isPrivateTimeline ? (
                                <Box>
                                    {id && <StreamInfo id={id} />}
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
                                    </Box>
                                </Box>
                            ) : (
                                <Timeline
                                    ref={timelineRef}
                                    streams={targetStream}
                                    header={
                                        <Box
                                            sx={{
                                                overflowX: 'hidden',
                                                overflowY: 'auto',
                                                overscrollBehaviorY: 'contain'
                                            }}
                                            ref={scrollParentRef}
                                        >
                                            {user && (
                                                <>
                                                    <Profile user={user} id={id} guest={true} />
                                                    <Divider />
                                                </>
                                            )}
                                        </Box>
                                    }
                                />
                            )}
                        </Box>
                    </Paper>
                </>
            </ClientProvider>
        </GuestBase>
    )
}
