import { useEffect, useRef, Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { darken, Box, Paper, Typography, Modal, useTheme, Button } from '@mui/material'
import { SnackbarProvider, closeSnackbar, enqueueSnackbar } from 'notistack'
import { ConcordProvider } from './context/ConcordContext'

import { Menu } from './components/Menu/Menu'
import { Explorer, Notifications, Settings, StreamPage, EntityPage, MessagePage, ListPage, Devtool } from './pages'

import useSound from 'use-sound'
import { MobileMenu } from './components/Menu/MobileMenu'
import { useClient } from './context/ClientContext'
import { GlobalActionsProvider } from './context/GlobalActions'
import { EmojiPickerProvider } from './context/EmojiPickerContext'

import { ThinMenu } from './components/Menu/ThinMenu'
import { usePreference } from './context/PreferenceContext'
import TickerProvider from './context/Ticker'
import { ContactsPage } from './pages/Contacts'
import {
    Schemas,
    type Subscription,
    type ProfileSchema,
    type ReplyAssociationSchema,
    type TimelineEvent,
    type CCDocument
} from '@concurrent-world/client'
import { UrlSummaryProvider } from './context/urlSummaryContext'
import { StorageProvider } from './context/StorageContext'
import { MarkdownRendererLite } from './components/ui/MarkdownRendererLite'
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

const SwitchMasterToSub = lazy(() => import('./components/SwitchMasterToSub'))

function App(): JSX.Element {
    const { client } = useClient()
    const { isMobileSize, isMasterSession, isCanonicalUser, isDomainOffline, setSwitchToSub, switchToSubOpen } =
        useGlobalState()
    const [sound] = usePreference('sound')

    const theme = useTheme<ConcurrentTheme>()

    const subscription = useRef<Subscription>()

    const identity = JSON.parse(localStorage.getItem('Identity') || 'null')
    const [progress] = usePreference('tutorialProgress')

    const { t } = useTranslation()

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

            setInterval(() => {
                registration.update()
            }, 1000 * 60 * 10) // 10 minutes
        })
    }, [])

    useEffect(() => {
        if (!client) return
        client.newSubscription().then((sub) => {
            subscription.current = sub
            subscription.current.listen([
                ...(client?.user?.notificationTimeline ? [client?.user?.notificationTimeline] : [])
            ])
            sub.on('AssociationCreated', (event: TimelineEvent) => {
                const a = event.document as CCDocument.Association<any>

                if (!a) return
                if (a.schema === Schemas.replyAssociation) {
                    const replyassociation = a as CCDocument.Association<ReplyAssociationSchema>
                    client?.api
                        .getMessageWithAuthor(replyassociation.body.messageId, replyassociation.body.messageAuthor)
                        .then((m) => {
                            m &&
                                client?.api
                                    .getProfileBySemanticID<ProfileSchema>('world.concrnt.p', a.signer)
                                    .then((c) => {
                                        playNotificationRef.current()
                                        const profile = c?.document.body
                                        enqueueSnackbar(
                                            <Box display="flex" flexDirection="column">
                                                <Typography>
                                                    {profile?.username ?? 'anonymous'} replied to your message:{' '}
                                                </Typography>
                                                <MarkdownRendererLite
                                                    messagebody={m.document.body.body as string}
                                                    emojiDict={m.document.body.emojis ?? {}}
                                                    limit={128}
                                                />
                                            </Box>
                                        )
                                    })
                        })
                    return
                }

                if (a.schema === Schemas.rerouteAssociation) {
                    client?.api.getMessageWithAuthor(a.target, event.item.owner).then((m) => {
                        m &&
                            client?.api.getProfileBySemanticID<ProfileSchema>('world.concrnt.p', a.signer).then((c) => {
                                playNotificationRef.current()
                                const profile = c?.document.body
                                enqueueSnackbar(
                                    <Box display="flex" flexDirection="column">
                                        <Typography>
                                            {profile?.username ?? 'anonymous'} rerouted to your message:{' '}
                                        </Typography>
                                        <MarkdownRendererLite
                                            messagebody={m.document.body.body as string}
                                            emojiDict={m.document.body.emojis ?? {}}
                                            limit={128}
                                        />
                                    </Box>
                                )
                            })
                    })
                    return
                }

                if (a.schema === Schemas.likeAssociation) {
                    client?.api.getMessageWithAuthor(a.target, event.item.owner).then(async (m) => {
                        if (!m) return
                        let username = a.body.profileOverride?.username
                        if (!username) {
                            const profile = await client.api.getProfileBySemanticID<ProfileSchema>(
                                'world.concrnt.p',
                                a.signer
                            )
                            username = profile?.document.body.username
                        }

                        playNotificationRef.current()
                        enqueueSnackbar(
                            <Box display="flex" flexDirection="column">
                                <Typography>{username ?? 'anonymous'} liked your message: </Typography>
                                <MarkdownRendererLite
                                    messagebody={m.document.body.body as string}
                                    emojiDict={m.document.body.emojis ?? {}}
                                    limit={128}
                                />
                            </Box>
                        )
                    })
                    return
                }

                if (a.schema === Schemas.reactionAssociation) {
                    client.api.getMessageWithAuthor(a.target, event.item.owner).then(async (m) => {
                        if (!m) return
                        let username = a.body.profileOverride?.username
                        if (!username) {
                            const profile = await client.api.getProfileBySemanticID<ProfileSchema>(
                                'world.concrnt.p',
                                a.signer
                            )
                            username = profile?.document.body.username
                        }

                        playNotificationRef.current()
                        enqueueSnackbar(
                            <Box display="flex" flexDirection="column">
                                <Typography>
                                    {username ?? 'anonymous'} reacted{' '}
                                    <img src={a.body.imageUrl as string} style={{ height: '1em' }} />
                                </Typography>
                                <MarkdownRendererLite
                                    messagebody={m.document.body.body as string}
                                    emojiDict={m.document.body.emojis ?? {}}
                                    limit={128}
                                />
                            </Box>
                        )
                    })
                }

                if (a.schema === Schemas.mentionAssociation) {
                    client?.api.getMessageWithAuthor(a.target, event.item.owner).then((m) => {
                        m &&
                            client.api.getProfileBySemanticID<ProfileSchema>('world.concrnt.p', a.signer).then((c) => {
                                playNotificationRef.current()
                                const profile = c?.document.body
                                enqueueSnackbar(
                                    <Box display="flex" flexDirection="column">
                                        {profile?.username ?? 'anonymous'} mentioned you:{' '}
                                        <MarkdownRendererLite
                                            messagebody={m.document.body.body as string}
                                            emojiDict={m.document.body.emojis ?? {}}
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
                                                <ConfirmProvider>
                                                    <GlobalActionsProvider>{childs}</GlobalActionsProvider>
                                                </ConfirmProvider>
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
                            現在所属ドメインではないドメインにログインしています。引っ越し作業が完了次第、再ログインしてください。
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
                            あなたのドメイン{client.api.host}
                            は現在オフラインの為、読み込み専用モードです。復旧までしばらくお待ちください。
                        </Typography>
                    )}
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                        maxWidth: '1280px',
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
                                md: 'block'
                            },
                            width: '200px',
                            m: 1
                        }}
                    >
                        <Menu />
                    </Box>
                    <Box
                        sx={{
                            display: {
                                xs: 'none',
                                sm: 'block',
                                md: 'none'
                            },
                            width: '50px',
                            m: 1
                        }}
                    >
                        <ThinMenu />
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
                            sx={{
                                flexGrow: '1',
                                margin: { xs: 0.5, sm: 1 },
                                mb: { xs: 0, sm: '10px' },
                                display: 'flex',
                                flexFlow: 'column',
                                borderRadius: 2,
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
                                <Route path="/:authorID/:messageID" element={<MessagePage />} />
                                <Route path="/timeline/:id" element={<StreamPage />} />
                                <Route path="/contacts" element={<ContactsPage />} />
                                <Route path="/explorer/:tab" element={<ExplorerPlusPage />} />
                                <Route path="/classicexplorer/:tab" element={<Explorer />} />
                                <Route path="/notifications" element={<Notifications />} />
                                <Route path="/devtool" element={<Devtool />} />
                                <Route path="/subscriptions" element={<ManageSubsPage />} />
                                <Route path="/concord/*" element={<ConcordPage />} />
                                <Route path="/tutorial" element={<Tutorial />} />
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
                            <MobileMenu />
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
