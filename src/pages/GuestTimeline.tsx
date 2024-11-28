import { useEffect, useRef, useState } from 'react'
import { Box, Button, Divider, Paper, Typography } from '@mui/material'
import { useLocation, useParams, Link as NavLink } from 'react-router-dom'
import { Timeline } from '../components/Timeline/main'
import { Client, type CoreTimeline, type User } from '@concurrent-world/client'
import { FullScreenLoading } from '../components/ui/FullScreenLoading'
import { ClientProvider } from '../context/ClientContext'
import TickerProvider from '../context/Ticker'

import { type VListHandle } from 'virtua'
import { TimelineHeader } from '../components/TimelineHeader'

import TagIcon from '@mui/icons-material/Tag'
import LockIcon from '@mui/icons-material/Lock'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import { Profile } from '../components/Profile'
import { GuestBase } from '../components/GuestBase'
import { StreamInfo } from '../components/StreamInfo'
import { MediaViewerProvider } from '../context/MediaViewer'
import { Helmet } from 'react-helmet-async'

export interface GuestPageProps {
    page: 'timeline' | 'entity'
}

export default function GuestTimelinePage(props: GuestPageProps): JSX.Element {
    const reactlocation = useLocation()
    const [title, setTitle] = useState<string>('')
    const [user, setUser] = useState<User | null | undefined>(null)
    const [timeline, setTimeline] = useState<CoreTimeline<any> | null | undefined>(null)
    const [targetStream, setTargetStream] = useState<string[]>([])
    const [isPrivateTimeline, setIsPrivateTimeline] = useState<boolean>(false)

    const { id } = useParams()

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
                        setTimeline(e)

                        if (e?.policy === 'https://policy.concrnt.world/t/inline-read-write.json' && e?.policyParams) {
                            try {
                                const params = JSON.parse(e.policyParams)
                                setIsPrivateTimeline(!params.isReadPublic)
                            } catch (e) {
                                setIsPrivateTimeline(true)
                            }
                        }
                    })
                    setUser(null)
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

                    setTimeline(null)
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

    const profilePageSchema = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        author: {
            '@type': 'Person',
            additionalName: user?.alias,
            description: user?.profile?.description,
            givenName: user?.profile?.username,
            identifier: user?.ccid,
            image: {
                '@type': 'ImageObject',
                contentUrl: user?.profile?.avatar,
                thumbnailUrl: user?.profile?.avatar
            },
            url: `https://concrnt.world/${user?.ccid}`
        }
    }

    return providers(
        <>
            <Helmet>
                <title>
                    {props.page === 'entity'
                        ? `${user?.profile?.username || 'anonymous'}${user?.alias ? `(@${user.alias})` : ''} - Concrnt`
                        : `#${title} - Concrt`}
                </title>
                <meta
                    name="description"
                    content={
                        props.page === 'entity'
                            ? user?.profile?.description || `Concrnt user ${title}`
                            : timeline?.document.body.description || `Concrnt timeline ${title}`
                    }
                />
                {user && <script type="application/ld+json">{JSON.stringify(profilePageSchema)}</script>}
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
                </ClientProvider>
            </GuestBase>
        </>
    )
}
