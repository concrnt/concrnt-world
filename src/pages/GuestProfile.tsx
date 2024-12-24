import { useEffect, useState } from 'react'
import { Box, Button, Divider, Paper, Typography } from '@mui/material'
import { useLocation, useParams, Link as NavLink } from 'react-router-dom'
import { Timeline } from '../components/Timeline/main'
import { Client, type User } from '@concurrent-world/client'
import { FullScreenLoading } from '../components/ui/FullScreenLoading'
import { ClientProvider } from '../context/ClientContext'

import { TimelineHeader } from '../components/TimelineHeader'

import LockIcon from '@mui/icons-material/Lock'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import { Profile } from '../components/Profile'
import { GuestBase } from '../components/GuestBase'
import { MediaViewerProvider } from '../context/MediaViewer'
import { Helmet } from 'react-helmet-async'

export default function GuestProfilePage(): JSX.Element {
    const [user, setUser] = useState<User | null | undefined>(null)
    const [targetStream, setTargetStream] = useState<string[]>([])
    const [isPrivateTimeline, setIsPrivateTimeline] = useState<boolean>(false)

    const path = useLocation()
    const { id } = useParams()
    const subProfileID = path.hash.replace('#', '')

    const [client, initializeClient] = useState<Client>()

    useEffect(() => {
        if (!id) return
        const client = new Client('ariake.concrnt.net')
        initializeClient(client)

        client.getUser(id).then((u) => {
            if (!u) return
            setUser(u)
            const timelineID = subProfileID ? 'world.concrnt.t-subhome.' + subProfileID + '@' + u.ccid : u.homeTimeline
            setTargetStream([timelineID])

            client.api.getTimeline(timelineID).then((t) => {
                if (!t) return
                if (t.policy !== 'https://policy.concrnt.world/t/inline-read-write.json' || !t.policyParams) {
                    setIsPrivateTimeline(false)
                    return
                }
                try {
                    const params = JSON.parse(t.policyParams)
                    setIsPrivateTimeline(params.isReadPublic === false)
                } catch (e) {
                    console.error(e)
                }
            })
        })
    }, [id, path.hash])

    const profilePageSchema = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
            '@type': 'Person',
            name: user?.profile?.username,
            alternateName: user?.alias,
            description: user?.profile?.description,
            identifier: user?.ccid,
            image: {
                '@type': 'ImageObject',
                contentUrl: user?.profile?.avatar,
                thumbnailUrl: user?.profile?.avatar
            },
            url: `https://concrnt.world/${user?.ccid}`
        }
    }

    if (!client || !user) return <FullScreenLoading message="Loading..." />

    return (
        <MediaViewerProvider>
            <>
                <Helmet>
                    <title>{`${user.profile?.username || 'anonymous'}${
                        user.alias ? `(@${user.alias})` : ''
                    } - Concrnt`}</title>
                    <meta
                        name="description"
                        content={user.profile?.description || `Concrnt user ${user.profile?.username}`}
                    />
                    {user?.alias && <link rel="canonical" href={`https://concrnt.com/${user.alias}`} />}
                    <script type="application/ld+json">{JSON.stringify(profilePageSchema)}</script>
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
                        <Button component={NavLink} to="/register">
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
                                    title={user.profile?.username || 'anonymous'}
                                    titleIcon={<AlternateEmailIcon />}
                                />

                                {isPrivateTimeline ? (
                                    <Box>
                                        <Profile
                                            user={user}
                                            id={id}
                                            guest={true}
                                            overrideSubProfileID={subProfileID}
                                            onSubProfileClicked={(id) => {
                                                window.location.hash = id
                                            }}
                                        />
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
                                            <Typography variant="h5">このタイムラインはプライベートです。</Typography>
                                            <Typography variant="caption">
                                                ログインすると、閲覧申請を送信できます。
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Timeline
                                        noRealtime
                                        streams={targetStream}
                                        header={
                                            <Box
                                                sx={{
                                                    overflowX: 'hidden',
                                                    overflowY: 'auto',
                                                    overscrollBehaviorY: 'contain'
                                                }}
                                            >
                                                <Profile
                                                    user={user}
                                                    id={id}
                                                    guest={true}
                                                    overrideSubProfileID={subProfileID}
                                                    onSubProfileClicked={(id) => {
                                                        window.location.hash = id
                                                    }}
                                                />
                                                <Divider />
                                            </Box>
                                        }
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
