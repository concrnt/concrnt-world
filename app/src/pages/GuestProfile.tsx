import { useEffect, useState } from 'react'
import { Box, Button, Divider, Paper, Typography } from '@mui/material'
import { useLocation, useParams, Link as NavLink, useNavigate } from 'react-router-dom'
import { RealtimeTimeline } from '../components/RealtimeTimeline'
import { Client, type User } from '@concrnt/worldlib'
import { FullScreenLoading } from '../components/ui/FullScreenLoading'
import { ClientProvider } from '../context/ClientContext'

import { TimelineHeader } from '../components/TimelineHeader'

import LockIcon from '@mui/icons-material/Lock'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import { Profile } from '../components/Profile'
import { GuestBase } from '../components/GuestBase'
import { MediaViewerProvider } from '../context/MediaViewer'
import { Helmet } from 'react-helmet-async'
import { loadPolicy } from '@concrnt/worldlib'
import { useTranslation } from 'react-i18next'

export default function GuestProfilePage(): JSX.Element {
    const [user, setUser] = useState<User | null | undefined>(null)
    const { t } = useTranslation('', { keyPrefix: 'pages.guestProfile' })
    const [targetStream, setTargetStream] = useState<string[]>([])
    const [isPrivateTimeline, setIsPrivateTimeline] = useState<boolean>(false)

    const path = useLocation()
    const { id, profileid } = useParams()
    const subProfileID = profileid ?? path.hash.replace('#', '')
    const navigate = useNavigate()

    const [client, initializeClient] = useState<Client>()

    useEffect(() => {
        if (!id) return

        Client.createAsGuest('ariake.concrnt.net').then((client) => {
            initializeClient(client)

            client.getUser(id).then((u) => {
                if (!u) return
                setUser(u)
                const timelineID = subProfileID
                    ? 'world.concrnt.t-subhome.' + subProfileID + '@' + u.ccid
                    : u.homeTimeline
                setTargetStream([timelineID])

                client.api.getTimeline(timelineID).then((t) => {
                    if (!t) return
                    const policy = loadPolicy(t.policy, t.policyParams)
                    setIsPrivateTimeline(!policy.isReadPublic())
                })
            })
        })
    }, [id, subProfileID])

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
                                    title={user.profile?.username || 'anonymous'}
                                    titleIcon={<AlternateEmailIcon />}
                                />

                                {isPrivateTimeline ? (
                                    <Box>
                                        <Profile
                                            user={user}
                                            guest={true}
                                            overrideSubProfileID={subProfileID}
                                            onSubProfileClicked={(subID) => {
                                                if (subID) {
                                                    navigate(`/${id}/profile/${subID}`)
                                                } else {
                                                    navigate(`/${id}`)
                                                }
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
                                            <Typography variant="h5">{t('privateTimeline')}</Typography>
                                            <Typography variant="caption">{t('loginToRequest')}</Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <RealtimeTimeline
                                        noRealtime
                                        timelineFQIDs={targetStream}
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
                                                    guest={true}
                                                    overrideSubProfileID={subProfileID}
                                                    onSubProfileClicked={(subID) => {
                                                        if (subID) {
                                                            navigate(`/${id}/profile/${subID}`)
                                                        } else {
                                                            navigate(`/${id}`)
                                                        }
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
