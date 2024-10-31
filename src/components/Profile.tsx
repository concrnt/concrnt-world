import { Box, Button, Typography, Link, Divider, Skeleton, useTheme, alpha } from '@mui/material'

import { CCAvatar } from '../components/ui/CCAvatar'
import { WatchButton } from '../components/WatchButton'
import { AckButton } from '../components/AckButton'
import { MarkdownRenderer } from '../components/ui/MarkdownRenderer'

import { Link as NavLink } from 'react-router-dom'

import { useEffect, useMemo, useState } from 'react'
import { type CCDocument, type CoreProfile, type User } from '@concurrent-world/client'
import { useClient } from '../context/ClientContext'
import { CCDrawer } from './ui/CCDrawer'
import { AckList } from '../components/AckList'
import { CCWallpaper } from './ui/CCWallpaper'
import { useTranslation } from 'react-i18next'
import { SubprofileBadge } from './ui/SubprofileBadge'
import { ProfileProperties } from './ui/ProfileProperties'
import { enqueueSnackbar } from 'notistack'
import { useMediaViewer } from '../context/MediaViewer'
import IosShareIcon from '@mui/icons-material/IosShare'
import { CCIconButton } from './ui/CCIconButton'
import ReplayIcon from '@mui/icons-material/Replay'

export interface ProfileProps {
    user?: User
    id?: string
    guest?: boolean
    onSubProfileClicked?: (characterID: string) => void
    overrideSubProfileID?: string
}

type detail = 'none' | 'ack' | 'acker'

export function Profile(props: ProfileProps): JSX.Element {
    const { client } = useClient()
    const theme = useTheme()
    const mediaViewer = useMediaViewer()
    const isSelf = props.id === client.ccid

    const [detailMode, setDetailMode] = useState<detail>('none')
    const [ackingUsers, setAckingUsers] = useState<User[] | undefined>(undefined)
    const [ackerUsers, setAckerUsers] = useState<User[] | undefined>(undefined)

    const [subProfile, setSubProfile] = useState<CoreProfile<any> | null>(null)

    const { t } = useTranslation('', { keyPrefix: 'common' })

    useEffect(() => {
        let unmounted = false
        if (!props.user) return
        props.user.getAcker().then((ackers) => {
            if (unmounted) return
            setAckerUsers(ackers)
        })
        props.user.getAcking().then((acking) => {
            if (unmounted) return
            setAckingUsers(acking)
        })
        return () => {
            unmounted = true
        }
    }, [props.user])

    const affiliationDate = useMemo(() => {
        try {
            const document = props.user?.affiliationDocument
            if (!document) return null

            const doc: CCDocument.Affiliation = JSON.parse(document)
            return new Date(doc.signedAt)
        } catch (e) {
            console.error(e)
        }
    }, [props.user])

    useEffect(() => {
        if (!client || !props.overrideSubProfileID || !props.user) {
            setSubProfile(null)
            return
        }
        client.api.getProfileByID(props.overrideSubProfileID, props.user.ccid).then((character) => {
            setSubProfile(character ?? null)
        })
    }, [client, props.overrideSubProfileID, props.user])

    return (
        <Box
            sx={{
                position: 'relative'
            }}
        >
            <CCWallpaper
                override={props.user?.profile?.banner}
                sx={{
                    height: '150px'
                }}
                isLoading={!props.user}
            />

            <CCIconButton
                sx={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1,
                    backgroundColor: alpha(theme.palette.primary.main, 0.5),
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.7)
                    }
                }}
                onClick={() => {
                    if (props.user) {
                        const id = props.user.alias ?? props.user.ccid
                        navigator.clipboard.writeText('https://concrnt.world/' + id)
                        enqueueSnackbar('リンクをコピーしました', { variant: 'success' })
                    }
                }}
            >
                <IosShareIcon
                    sx={{
                        color: theme.palette.primary.contrastText
                    }}
                />
            </CCIconButton>

            <Box
                sx={{
                    display: 'flex',
                    position: 'absolute',
                    top: '90px',
                    p: 1
                }}
                onClick={() => {
                    if (subProfile) {
                        subProfile.document.body.avatar && mediaViewer.openSingle(subProfile.document.body.avatar)
                    } else {
                        props.user?.profile?.avatar && mediaViewer.openSingle(props.user?.profile?.avatar)
                    }
                }}
            >
                <CCAvatar
                    isLoading={!props.user}
                    alt={props.user?.profile?.username}
                    avatarURL={props.user?.profile?.avatar}
                    avatarOverride={subProfile ? subProfile.document.body.avatar : undefined}
                    identiconSource={props.user?.ccid}
                    sx={{
                        width: '100px',
                        height: '100px'
                    }}
                />
                {props.overrideSubProfileID && (
                    <CCIconButton
                        sx={{
                            position: 'absolute',
                            right: 0,
                            bottom: 0,
                            padding: 0,
                            backgroundColor: alpha(theme.palette.primary.main, 0.5),
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.7)
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation()
                            props.onSubProfileClicked?.('')
                        }}
                    >
                        <ReplayIcon
                            sx={{
                                color: theme.palette.primary.contrastText
                            }}
                        />
                    </CCIconButton>
                )}
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    p: 1
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        flexWrap: 'wrap'
                    }}
                >
                    <Box
                        sx={{
                            width: '100px'
                        }}
                    />
                    {props.user && (
                        <>
                            {props.user.profile?.subprofiles?.map((id, _) => (
                                <SubprofileBadge
                                    key={id}
                                    characterID={id}
                                    authorCCID={props.user!.ccid}
                                    onClick={() => {
                                        props.onSubProfileClicked?.(id)
                                    }}
                                    enablePreview={id === props.overrideSubProfileID}
                                />
                            ))}
                        </>
                    )}
                    <Box
                        sx={{
                            flexGrow: 1
                        }}
                    />
                    {props.user && (
                        <Box
                            sx={{
                                gap: 1,
                                flexGrow: 1,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end'
                            }}
                        >
                            {!isSelf && <AckButton user={props.user} />}
                            <WatchButton timelineID={props.user.homeTimeline ?? ''} />
                            {isSelf && (
                                <Button variant="outlined" component={NavLink} to="/settings/profile">
                                    Edit Profile
                                </Button>
                            )}
                        </Box>
                    )}
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 1
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 'bold',
                            fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.5rem' },
                            cursor: 'pointer',
                            mt: 1
                        }}
                    >
                        {props.user ? (
                            subProfile?.document.body.username ?? props.user.profile?.username ?? 'anonymous'
                        ) : (
                            <Skeleton variant="text" width={200} />
                        )}
                    </Typography>
                    {props.user?.alias && <Typography variant="caption">{props.user?.alias}</Typography>}
                </Box>
                {props.user ? (
                    <Typography
                        onClick={() => {
                            if (props.user) {
                                navigator.clipboard.writeText(props.user.ccid)
                                enqueueSnackbar('CCIDをコピーしました', { variant: 'success' })
                            }
                        }}
                        sx={{
                            cursor: 'pointer'
                        }}
                        variant="caption"
                    >
                        {props.user.ccid}
                    </Typography>
                ) : (
                    <Skeleton variant="text" width={200} />
                )}

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}
                >
                    <MarkdownRenderer
                        messagebody={subProfile?.document.body.description ?? props.user?.profile?.description ?? ''}
                        emojiDict={{}}
                    />
                </Box>

                <Box>
                    <Typography variant="caption">
                        {props.user ? (
                            `現住所: ${props.user?.domain !== '' ? props.user.domain : client.api.host}` +
                            ` (${affiliationDate?.toLocaleDateString() ?? ''}~)`
                        ) : (
                            <Skeleton variant="text" width={200} />
                        )}
                    </Typography>
                </Box>

                <Box display="flex" gap={1}>
                    <Typography
                        component={Link}
                        underline="hover"
                        onClick={() => {
                            setDetailMode('ack')
                        }}
                    >
                        {ackingUsers ? (
                            <>
                                {ackingUsers.length} {t('follow')}
                            </>
                        ) : (
                            <Skeleton variant="text" width={80} />
                        )}
                    </Typography>
                    <Typography
                        component={Link}
                        underline="hover"
                        onClick={() => {
                            setDetailMode('acker')
                        }}
                    >
                        {ackerUsers ? (
                            <>
                                {ackerUsers.length} {t('followers')}
                            </>
                        ) : (
                            <Skeleton variant="text" width={80} />
                        )}
                    </Typography>
                </Box>

                {subProfile && (
                    <>
                        <Divider sx={{ mb: 1 }} />
                        <ProfileProperties showCreateLink character={subProfile} />
                        <Divider />
                    </>
                )}
            </Box>

            {props.user && (
                <CCDrawer
                    open={detailMode !== 'none'}
                    onClose={() => {
                        setDetailMode('none')
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexFlow: 'column',
                            gap: 1,
                            p: 1
                        }}
                    >
                        {detailMode !== 'none' && (
                            <AckList
                                initmode={detailMode === 'ack' ? 'acking' : 'acker'}
                                user={props.user}
                                onNavigated={() => {
                                    setDetailMode('none')
                                }}
                            />
                        )}
                    </Box>
                </CCDrawer>
            )}
        </Box>
    )
}
