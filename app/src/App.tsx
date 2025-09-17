import { useEffect, useRef, Suspense, lazy, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { darken, Box, Paper, Typography, Modal, useTheme, Button } from '@mui/material'
import { SnackbarProvider, closeSnackbar, enqueueSnackbar } from 'notistack'
import { ConcordProvider } from './context/ConcordContext'

import { Menu } from './components/Menu/Menu'
import { Explorer, Notifications, Settings, TimelinePage, EntityPage, MessagePage, ListPage, Devtool } from './pages'

import useSound from 'use-sound'
import { MobileMenu } from './components/Menu/MobileMenu'
import { useClient } from './context/ClientContext'
import { GlobalActionsProvider } from './context/GlobalActions'
import { EmojiPickerProvider } from './context/EmojiPickerContext'

import { ThinMenu } from './components/Menu/ThinMenu'
import { usePreference } from './context/PreferenceContext'
import TickerProvider from './context/Ticker'
import { ContactsPage } from './pages/Contacts'
import { type TimelineEvent, type CCDocument, type SocketListener } from '@concrnt/client'
import { UrlSummaryProvider } from './context/urlSummaryContext'
import { StorageProvider } from './context/StorageContext'
import { CfmRendererLite } from './components/ui/CfmRendererLite'
import { useTranslation } from 'react-i18next'
import { ManageSubsPage } from './pages/ManageSubs'
import { ExplorerPlusPage } from './pages/ExplorerPlus'
import { UseSoundFormats } from './constants'
import { useGlobalState } from './context/GlobalState'
import { ConcrntLogo } from './components/theming/ConcrntLogo'
import { ConcordPage } from './pages/Concord'
import { EditorModalProvider } from './components/EditorModal'
import { MediaViewerProvider } from './context/MediaViewer'
import { Tutorial } from './pages/Tutorial'
import { LogoutButton } from './components/Settings/LogoutButton'
import { ConfirmProvider } from './context/Confirm'
import { type ConcurrentTheme } from './model'
import { TimelineDrawerProvider } from './context/TimelineDrawer'
import { UserDrawerProvider } from './context/UserDrawer'
import { Schemas } from '@concrnt/worldlib'
import type { ProfileSchema, ReplyAssociationSchema } from '@concrnt/worldlib'
import { SearchDrawerProvider } from './context/SearchDrawer'
import { CommandPaletteProvider } from './context/CommandPalette'
import { ApUserPage } from './pages/ApUser'
import { DeckPage } from './pages/Deck'
import { TimelineProvider } from './context/TimelineProvider'
import { InspectorProvider } from './context/Inspector'
import { ProfileProvider } from './context/ProfileContext'

const SwitchMasterToSub = lazy(() => import('./components/SwitchMasterToSub'))

function App(): JSX.Element {
    const { client } = useClient()
    const { isMobileSize, isMasterSession, isCanonicalUser, isDomainOffline, setSwitchToSub, switchToSubOpen } =
        useGlobalState()
    const [sound] = usePreference('sound')

    const theme = useTheme<ConcurrentTheme>()
    const navigate = useNavigate()
    const listener = useRef<SocketListener>()

    const identity = JSON.parse(localStorage.getItem('Identity') || 'null')
    const [progress] = usePreference('tutorialProgress')

    const { t } = useTranslation()

    const [latestNotificationDate, setLatestNotificationDate] = useState<number>(0)

    const location = useLocation()
    const isDeckPage = location.pathname === '/deck'

    useEffect(() => {
        if (!client.user) return
        client.api.getTimelineRecent([client.user.notificationTimeline], client.host).then((e) => {
            if (e.length < 1) return
            setLatestNotificationDate(e[0].created.getTime())
        })
    }, [client])

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return

        const doUpdate = (): void => {
            enqueueSnackbar(t('app.updateAvailable'), {
                persist: true,
                variant: 'info',
                anchorOrigin: {
                    horizontal: 'center',
                    vertical: 'top'
                },
                action: (key) => (
                    <Button
                        onClick={() => {
                            navigator.serviceWorker.getRegistration().then((registration) => {
                                key && closeSnackbar(key)
                                console.log('registration', registration)
                                if (!registration) {
                                    console.error('No active service worker')
                                    return
                                }
                                registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
                                registration.waiting?.addEventListener('statechange', (e: any) => {
                                    if (e.target?.state === 'activated') {
                                        if (window.caches) {
                                            caches.keys().then((names) => {
                                                // Delete all the cache files
                                                names.forEach((name) => {
                                                    caches.delete(name)
                                                })
                                            })
                                        }

                                        window.location.reload()
                                    } else {
                                        console.log('State Change', e.target?.state)
                                    }
                                })
                            })
                        }}
                    >
                        {t('app.updateNow')}
                    </Button>
                )
            })
        }

        navigator.serviceWorker.addEventListener('message', (e) => {
            switch (e.data.type) {
                case 'navigate':
                    navigate(e.data.url)
                    break
                default:
                    console.log('Unknown message type', e.type ?? 'null')
            }
        })

        navigator.serviceWorker.ready.then((registration) => {
            console.log('Service Worker Ready', registration)

            if (registration.waiting) {
                doUpdate()
            }

            registration.addEventListener('updatefound', () => {
                console.log('Update Found')
                const installingWorker = registration.installing
                if (installingWorker == null) return

                installingWorker.addEventListener('statechange', () => {
                    console.log('State Change', installingWorker.state)
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('New update available')
                        doUpdate()
                    }
                })
            })

            setInterval(
                () => {
                    registration.update()
                },
                1000 * 60 * 10
            ) // 10 minutes
        })
    }, [])

    useEffect(() => {
        if (!client) return
        client.newSocketListener().then((l) => {
            listener.current = l
            l.listen([...(client?.user?.notificationTimeline ? [client?.user?.notificationTimeline] : [])])
            l.on('AssociationCreated', (event: TimelineEvent) => {
                const a = event.parsedDoc as CCDocument.Association<any>
                setLatestNotificationDate(new Date(a.signedAt).getTime())

                if (!a) return
                if (a.schema === Schemas.replyAssociation) {
                    const replyassociation = a as CCDocument.Association<ReplyAssociationSchema>
                    client?.api
                        .getMessageWithAuthor<any>(replyassociation.body.messageId, replyassociation.body.messageAuthor)
                        .then((m) => {
                            m &&
                                client?.api
                                    .getProfileBySemanticID<ProfileSchema>('world.concrnt.p', a.signer)
                                    .then((c) => {
                                        playNotificationRef.current()
                                        const profile = c?.parsedDoc.body
                                        enqueueSnackbar(
                                            <Box display="flex" flexDirection="column">
                                                <Typography>
                                                    {profile?.username ?? 'anonymous'} replied to your message:{' '}
                                                </Typography>
                                                <CfmRendererLite
                                                    messagebody={m.parsedDoc.body.body as string}
                                                    emojiDict={m.parsedDoc.body.emojis ?? {}}
                                                    limit={128}
                                                />
                                            </Box>
                                        )
                                    })
                        })
                    return
                }

                if (a.schema === Schemas.rerouteAssociation) {
                    if (!event.item) return
                    client?.api.getMessageWithAuthor<any>(a.target, event.item.owner).then((m) => {
                        m &&
                            client?.api.getProfileBySemanticID<ProfileSchema>('world.concrnt.p', a.signer).then((c) => {
                                playNotificationRef.current()
                                const profile = c?.parsedDoc.body
                                enqueueSnackbar(
                                    <Box display="flex" flexDirection="column">
                                        <Typography>
                                            {profile?.username ?? 'anonymous'} rerouted to your message:{' '}
                                        </Typography>
                                        <CfmRendererLite
                                            messagebody={m.parsedDoc.body.body as string}
                                            emojiDict={m.parsedDoc.body.emojis ?? {}}
                                            limit={128}
                                        />
                                    </Box>
                                )
                            })
                    })
                    return
                }

                if (a.schema === Schemas.likeAssociation) {
                    if (!event.item) return
                    client?.api.getMessageWithAuthor<any>(a.target, event.item.owner).then(async (m) => {
                        if (!m) return
                        let username = a.body.profileOverride?.username
                        if (!username) {
                            const profile = await client.api.getProfileBySemanticID<ProfileSchema>(
                                'world.concrnt.p',
                                a.signer
                            )
                            username = profile?.parsedDoc.body.username
                        }

                        let medias = ''
                        if ('medias' in m.parsedDoc.body) {
                            for (const media of m.parsedDoc.body.medias) {
                                medias += `![${media.altText}](${media.mediaURL})`
                            }
                        }

                        playNotificationRef.current()
                        enqueueSnackbar(
                            <Box display="flex" flexDirection="column">
                                <Typography>{username ?? 'anonymous'} favorited your message: </Typography>
                                <CfmRendererLite
                                    messagebody={(m.parsedDoc.body.body as string) + medias}
                                    emojiDict={m.parsedDoc.body.emojis ?? {}}
                                    limit={128}
                                />
                            </Box>
                        )
                    })
                    return
                }

                if (a.schema === Schemas.reactionAssociation) {
                    if (!event.item) return
                    client.api.getMessageWithAuthor<any>(a.target, event.item.owner).then(async (m) => {
                        if (!m) return
                        let username = a.body.profileOverride?.username
                        if (!username) {
                            const profile = await client.api.getProfileBySemanticID<ProfileSchema>(
                                'world.concrnt.p',
                                a.signer
                            )
                            username = profile?.parsedDoc.body.username
                        }

                        let medias = ''
                        if ('medias' in m.parsedDoc.body) {
                            for (const media of m.parsedDoc.body.medias) {
                                medias += `![${media.altText}](${media.mediaURL})`
                            }
                        }

                        playNotificationRef.current()
                        enqueueSnackbar(
                            <Box display="flex" flexDirection="column">
                                <Typography>
                                    {username ?? 'anonymous'} reacted{' '}
                                    <img src={a.body.imageUrl as string} style={{ height: '1em' }} />
                                </Typography>
                                <CfmRendererLite
                                    messagebody={(m.parsedDoc.body.body as string) + medias}
                                    emojiDict={m.parsedDoc.body.emojis ?? {}}
                                    limit={128}
                                />
                            </Box>
                        )
                    })
                }

                if (a.schema === Schemas.mentionAssociation) {
                    if (!event.item) return
                    client?.api.getMessageWithAuthor<any>(a.target, event.item.owner).then((m) => {
                        m &&
                            client.api.getProfileBySemanticID<ProfileSchema>('world.concrnt.p', a.signer).then((c) => {
                                playNotificationRef.current()
                                const profile = c?.parsedDoc.body
                                enqueueSnackbar(
                                    <Box display="flex" flexDirection="column">
                                        {profile?.username ?? 'anonymous'} mentioned you:{' '}
                                        <CfmRendererLite
                                            messagebody={m.parsedDoc.body.body as string}
                                            emojiDict={m.parsedDoc.body.emojis ?? {}}
                                            limit={128}
                                        />
                                    </Box>
                                )
                            })
                    })
                }
            })
        })
    }, [client])

    const [playNotification] = useSound(sound.notification, { volume: sound.volume / 100, format: UseSoundFormats })
    const playNotificationRef = useRef(playNotification)
    useEffect(() => {
        playNotificationRef.current = playNotification
    }, [playNotification])

    if (!client) {
        return <>building api service...</>
    }

    const providers = (childs: JSX.Element): JSX.Element => (
        <SnackbarProvider
            preventDuplicate
            classes={isMobileSize ? { containerRoot: 'snackbar-container-mobile' } : undefined}
        >
            <TickerProvider>
                <UrlSummaryProvider host={client.host}>
                    <MediaViewerProvider>
                        <EmojiPickerProvider>
                            <StorageProvider>
                                <ConcordProvider>
                                    <EditorModalProvider>
                                        <TimelineDrawerProvider>
                                            <UserDrawerProvider>
                                                <ProfileProvider>
                                                    <SearchDrawerProvider>
                                                        <ConfirmProvider>
                                                            <InspectorProvider>
                                                                <GlobalActionsProvider>
                                                                    <TimelineProvider>
                                                                        <CommandPaletteProvider>
                                                                            {childs}
                                                                        </CommandPaletteProvider>
                                                                    </TimelineProvider>
                                                                </GlobalActionsProvider>
                                                            </InspectorProvider>
                                                        </ConfirmProvider>
                                                    </SearchDrawerProvider>
                                                </ProfileProvider>
                                            </UserDrawerProvider>
                                        </TimelineDrawerProvider>
                                    </EditorModalProvider>
                                </ConcordProvider>
                            </StorageProvider>
                        </EmojiPickerProvider>
                    </MediaViewerProvider>
                </UrlSummaryProvider>
            </TickerProvider>
        </SnackbarProvider>
    )

    return providers(
        <>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: `${theme.palette.background.default}, 
                                 linear-gradient(${theme.palette.background.default}, ${darken(
                                     theme.palette.background.default,
                                     0.1
                                 )})`,
                    width: '100vw',
                    height: '100dvh',
                    overflow: 'hidden',
                    userSelect: { xs: 'none', sm: 'text', md: 'text' }
                }}
            >
                <Box
                    sx={{
                        backgroundColor: 'error.main',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        flexDirection: 'column'
                    }}
                >
                    {!isCanonicalUser && (
                        <Typography
                            sx={{
                                textAlign: 'center',
                                color: 'error.contrastText',
                                fontSize: '0.8em',
                                fontWeight: 'bold',
                                padding: '10px'
                            }}
                        >
                            {t('app.isNotCanonicalUser')}
                        </Typography>
                    )}
                    {isMasterSession && isCanonicalUser && progress !== 0 && (
                        <Typography
                            sx={{
                                textAlign: 'center',
                                color: 'error.contrastText',
                                fontSize: '0.8em',
                                fontWeight: 'bold',
                                padding: '10px',
                                textDecoration: 'underline'
                            }}
                            onClick={() => {
                                setSwitchToSub(true)
                            }}
                        >
                            {' '}
                            {t('settings.identity.loginType.masterKey')}
                        </Typography>
                    )}
                    {isDomainOffline && (
                        <Typography
                            sx={{
                                textAlign: 'center',
                                color: 'error.contrastText',
                                fontSize: '0.8em',
                                fontWeight: 'bold',
                                padding: '10px'
                            }}
                        >
                            {t('app.domainIsOffline', { domain: client.host })}
                        </Typography>
                    )}
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                        maxWidth: isDeckPage ? undefined : '1280px',
                        width: '100%',
                        height: '100%',
                        marginLeft: 'env(safe-area-inset-left)',
                        marginRight: 'env(safe-area-inset-right)'
                    }}
                >
                    <Box
                        sx={{
                            display: {
                                xs: 'none',
                                sm: 'none',
                                md: isDeckPage ? 'none' : 'block'
                            },
                            width: '200px',
                            m: 1
                        }}
                    >
                        <Menu latestNotification={latestNotificationDate} />
                    </Box>
                    <Box
                        sx={{
                            display: {
                                xs: 'none',
                                sm: 'block',
                                md: isDeckPage ? 'block' : 'none'
                            },
                            width: '50px',
                            m: 1
                        }}
                    >
                        <ThinMenu latestNotification={latestNotificationDate} />
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            flexFlow: 'column',
                            overflow: 'hidden',
                            flex: 1
                        }}
                    >
                        <Paper
                            elevation={isDeckPage ? 0 : 3}
                            sx={{
                                flexGrow: '1',
                                margin: { xs: 0.5, sm: 1 },
                                mb: { xs: 0, sm: '10px' },
                                display: 'flex',
                                flexFlow: 'column',
                                borderRadius: isDeckPage ? 0 : 2,
                                overflow: 'hidden',
                                background: 'none'
                            }}
                        >
                            <Routes>
                                <Route index element={<ListPage />} />
                                <Route path="/:id" element={<EntityPage />} />
                                <Route path="/intent" element={<ListPage />} />
                                <Route path="/settings/*" element={<Settings />} />
                                <Route path="/:id/media" element={<EntityPage />} />
                                <Route path="/:id/activity" element={<EntityPage />} />
                                <Route path="/:id/profile/:profileid" element={<EntityPage />} />
                                <Route path="/:id/profile/:profileid/media" element={<EntityPage />} />
                                <Route path="/:id/profile/:profileid/activity" element={<EntityPage />} />
                                <Route path="/:authorID/:messageID" element={<MessagePage />} />
                                <Route path="/timeline/:id" element={<TimelinePage />} />
                                <Route path="/contacts" element={<ContactsPage />} />
                                <Route path="/explorer/:tab" element={<ExplorerPlusPage />} />
                                <Route path="/classicexplorer/:tab" element={<Explorer />} />
                                <Route
                                    path="/notifications"
                                    element={<Notifications latestNotification={latestNotificationDate} />}
                                />
                                <Route path="/ap/:id" element={<ApUserPage />} />
                                <Route path="/devtool" element={<Devtool />} />
                                <Route path="/subscriptions" element={<ManageSubsPage />} />
                                <Route path="/concord/*" element={<ConcordPage />} />
                                <Route path="/tutorial" element={<Tutorial />} />
                                <Route path="/deck" element={<DeckPage />} />
                            </Routes>
                        </Paper>
                        <Box
                            sx={{
                                display: {
                                    xs: 'block',
                                    sm: 'none',
                                    md: 'none'
                                }
                            }}
                        >
                            <MobileMenu latestNotification={latestNotificationDate} />
                        </Box>
                    </Box>
                </Box>
                <Box
                    id="emblem"
                    sx={{
                        position: 'fixed',
                        zIndex: '-1',
                        opacity: { xs: '0', sm: '0.1', md: '0.1' },
                        left: '-30px',
                        bottom: '-30px',
                        width: '300px',
                        height: '300px',
                        display: 'block'
                    }}
                >
                    <ConcrntLogo size="300px" color={theme.palette.background.contrastText} />
                </Box>
            </Box>
            <Modal
                open={switchToSubOpen}
                onClose={() => {
                    setSwitchToSub(false)
                }}
            >
                <Paper
                    sx={{
                        position: 'absolute',
                        top: '10%',
                        left: '50%',
                        transform: 'translate(-50%, 0%)',
                        width: '700px',
                        maxWidth: '90vw',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}
                >
                    <Box>
                        <Typography variant="h2">
                            {t('settings.identity.switchMasterToSub.exitPrivilegedMode')}
                        </Typography>
                        <Typography variant="caption">
                            {t('settings.identity.switchMasterToSub.privilegeModeDesc')}
                        </Typography>
                    </Box>
                    <Suspense fallback={<>loading...</>}>
                        <SwitchMasterToSub identity={identity} />
                    </Suspense>
                    <LogoutButton />
                </Paper>
            </Modal>
        </>
    )
}

export default App
