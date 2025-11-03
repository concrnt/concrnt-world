import {
    Box,
    Button,
    Typography,
    Link,
    Skeleton,
    useTheme,
    alpha,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Modal
} from '@mui/material'

import { CCAvatar } from '../components/ui/CCAvatar'
import { WatchButton } from '../components/WatchButton'
import { AckButton } from '../components/AckButton'

import { Link as NavLink } from 'react-router-dom'
import Tilt from 'react-parallax-tilt'
import { useEffect, useMemo, useState } from 'react'
import { type User } from '@concrnt/worldlib'
import { type CCDocument, type Profile as TypeProfile } from '@concrnt/client'
import { useClient } from '../context/ClientContext'
import { CCDrawer } from './ui/CCDrawer'
import { AckList } from '../components/AckList'
import { CCWallpaper } from './ui/CCWallpaper'
import { useTranslation } from 'react-i18next'
import { SubprofileBadge } from './ui/SubprofileBadge'
import { ProfileProperties } from './ui/ProfileProperties'
import { enqueueSnackbar } from 'notistack'
import { useMediaViewer } from '../context/MediaViewer'
import { CCIconButton } from './ui/CCIconButton'
import { useSearchDrawer } from '../context/SearchDrawer'
import { ProfileQRCard } from './ui/ProfileQRCard'
import ConcrntBG from '../resources/ConcrntBG.svg'

import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import IosShareIcon from '@mui/icons-material/IosShare'
import ReplayIcon from '@mui/icons-material/Replay'
import SearchIcon from '@mui/icons-material/Search'
import CancelIcon from '@mui/icons-material/Cancel'
import QrCodeIcon from '@mui/icons-material/QrCode'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import { usePreference } from '../context/PreferenceContext'
import { CfmRenderer } from './ui/CfmRenderer'

export interface ProfileProps {
    user: User
    guest?: boolean
    onSubProfileClicked?: (characterID: string) => void
    overrideSubProfileID?: string
}

type detail = 'none' | 'ack' | 'acker'

export function Profile(props: ProfileProps): JSX.Element {
    const { client } = useClient()
    const theme = useTheme()
    const mediaViewer = useMediaViewer()
    const isSelf = props.user.ccid === client.ccid

    const searchDrawer = useSearchDrawer()

    const [detailMode, setDetailMode] = useState<detail>('none')

    const [ackingUserCount, setAckingUserCount] = useState<number | undefined>(undefined)
    const [ackerUserCount, setAckerUserCount] = useState<number | undefined>(undefined)

    const [subProfile, setSubProfile] = useState<TypeProfile<any> | null>(null)

    const { t } = useTranslation('', { keyPrefix: 'common' })
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
    const [openQR, setOpenQR] = useState(false)

    const timelineID = props.overrideSubProfileID
        ? 'world.concrnt.t-subhome.' + props.overrideSubProfileID + '@' + props.user.ccid
        : props.user.homeTimeline

    const [muteTimelines, setMuteTimelines] = usePreference('muteTimelines')
    const muted = muteTimelines.includes(timelineID)

    useEffect(() => {
        let unmounted = false
        if (!props.user) return
        client.api.getAcking(props.user.ccid).then((ackers) => {
            if (unmounted) return
            setAckingUserCount(ackers.length)
        })
        client.api.getAcker(props.user.ccid).then((ackers) => {
            if (unmounted) return
            setAckerUserCount(ackers.length)
        })
        return () => {
            unmounted = true
        }
    }, [props.user])

    const affiliationDate = useMemo(() => {
        try {
            const document = props.user.affiliationDocument
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
        client.api.getProfile(props.overrideSubProfileID, props.user.ccid).then((character) => {
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
                override={subProfile?.parsedDoc.body.banner ?? props.user.profile?.banner}
                sx={{
                    height: '150px'
                }}
                isLoading={!props.user}
            />

            <Box
                sx={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1,
                    display: 'flex',
                    gap: 1
                }}
            >
                <CCIconButton
                    sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.5),
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.7)
                        }
                    }}
                    onClick={() => {
                        searchDrawer.open(props.user.homeTimeline ?? '')
                    }}
                >
                    <SearchIcon
                        sx={{
                            color: theme.palette.primary.contrastText
                        }}
                    />
                </CCIconButton>

                <CCIconButton
                    sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.5),
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.7)
                        }
                    }}
                    onClick={(e) => {
                        setMenuAnchor(e.currentTarget)
                    }}
                >
                    <MoreHorizIcon
                        sx={{
                            color: theme.palette.primary.contrastText
                        }}
                    />
                </CCIconButton>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    position: 'absolute',
                    top: '90px',
                    p: 1
                }}
                onClick={() => {
                    if (subProfile) {
                        subProfile.parsedDoc.body.avatar && mediaViewer.openSingle(subProfile.parsedDoc.body.avatar)
                    } else {
                        props.user.profile?.avatar && mediaViewer.openSingle(props.user.profile?.avatar)
                    }
                }}
            >
                <CCAvatar
                    isLoading={!props.user}
                    alt={props.user.profile?.username}
                    avatarURL={props.user.profile?.avatar}
                    identiconSource={props.user.ccid}
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
                    <Box
                        sx={{
                            flexGrow: 1
                        }}
                    />
                    <Box
                        sx={{
                            gap: 1,
                            flexGrow: 1,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            minHeight: '32.5px'
                        }}
                    >
                        {client.user && (
                            <>
                                {!isSelf && <AckButton user={props.user} />}
                                <WatchButton timelineFQID={timelineID} />
                            </>
                        )}
                        {isSelf && (
                            <Button variant="outlined" component={NavLink} to="/settings/profile">
                                Edit Profile
                            </Button>
                        )}
                    </Box>
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
                            mt: 1,
                            textDecoration: muted ? 'line-through' : 'none'
                        }}
                    >
                        {subProfile?.parsedDoc.body.username ?? props.user.profile?.username ?? 'anonymous'}
                    </Typography>
                    {props.user.alias && <Typography variant="caption">{props.user.alias}</Typography>}
                </Box>
                <Typography
                    onClick={() => {
                        if (props.user) {
                            navigator.clipboard.writeText(props.user.ccid)
                            enqueueSnackbar(t('ccidCopied'), { variant: 'success' })
                        }
                    }}
                    sx={{
                        cursor: 'pointer'
                    }}
                    variant="caption"
                >
                    {props.user.ccid}
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}
                >
                    <CfmRenderer
                        messagebody={subProfile?.parsedDoc.body.description ?? props.user.profile?.description ?? ''}
                        emojiDict={{}}
                    />
                </Box>

                <Box>
                    <Typography variant="caption">
                        {props.user ? (
                            `${t('currentAddress')}: ${props.user.domain !== '' ? props.user.domain : client.host}` +
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
                        {ackingUserCount === undefined ? (
                            <Skeleton variant="text" width={80} />
                        ) : (
                            <Typography>
                                {ackingUserCount} {t('follow')}
                            </Typography>
                        )}
                    </Typography>
                    <Typography
                        component={Link}
                        underline="hover"
                        onClick={() => {
                            setDetailMode('acker')
                        }}
                    >
                        {ackerUserCount === undefined ? (
                            <Skeleton variant="text" width={80} />
                        ) : (
                            <Typography>
                                {ackerUserCount} {t('followers')}
                            </Typography>
                        )}
                    </Typography>
                </Box>

                {subProfile && <ProfileProperties showCreateLink character={subProfile} />}
            </Box>
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null)
                }}
            >
                {window.navigator.share && (
                    <MenuItem
                        onClick={() => {
                            if (props.user) {
                                navigator.share({
                                    title: props.user.alias ?? props.user.ccid,
                                    text: props.user.profile?.description ?? '',
                                    url:
                                        'https://concrnt.world/' +
                                        (props.user.alias ?? props.user.ccid) +
                                        (props.overrideSubProfileID ? '/profile/' + props.overrideSubProfileID : '')
                                })
                                setMenuAnchor(null)
                            }
                        }}
                    >
                        <ListItemIcon>
                            <IosShareIcon
                                sx={{
                                    color: 'text.primary'
                                }}
                            />
                        </ListItemIcon>
                        <ListItemText>Share</ListItemText>
                    </MenuItem>
                )}
                <MenuItem
                    onClick={() => {
                        if (props.user) {
                            const id = props.user.alias ?? props.user.ccid
                            navigator.clipboard.writeText(
                                'https://concrnt.world/' +
                                    id +
                                    (props.overrideSubProfileID ? '/profile/' + props.overrideSubProfileID : '')
                            )
                            enqueueSnackbar(t('linkCopied'), { variant: 'success' })
                            setMenuAnchor(null)
                        }
                    }}
                >
                    <ListItemIcon>
                        <ContentPasteIcon
                            sx={{
                                color: 'text.primary'
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText>Copy Share Link</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setOpenQR(true)
                        setMenuAnchor(null)
                    }}
                >
                    <ListItemIcon>
                        <QrCodeIcon
                            sx={{
                                color: 'text.primary'
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText>Show QR Code</ListItemText>
                </MenuItem>
                {muted ? (
                    <MenuItem
                        onClick={() => {
                            setMuteTimelines(muteTimelines.filter((id) => id !== timelineID))
                            enqueueSnackbar(t('timelineUnmuted'), { variant: 'success' })
                            setMenuAnchor(null)
                        }}
                    >
                        <ListItemIcon>
                            <VisibilityIcon
                                sx={{
                                    color: 'text.primary'
                                }}
                            />
                        </ListItemIcon>
                        <ListItemText>Unmute</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem
                        onClick={() => {
                            if (!muteTimelines.includes(timelineID)) {
                                setMuteTimelines([...muteTimelines, timelineID])
                            }
                            enqueueSnackbar(t('timelineMuted'), { variant: 'success' })
                            setMenuAnchor(null)
                        }}
                    >
                        <ListItemIcon>
                            <VisibilityOffIcon
                                sx={{
                                    color: 'text.primary'
                                }}
                            />
                        </ListItemIcon>
                        <ListItemText>Mute</ListItemText>
                    </MenuItem>
                )}
            </Menu>
            <Modal
                open={openQR}
                onClose={() => {
                    setOpenQR(false)
                }}
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'background.default'
                        }
                    }
                }}
            >
                <Box
                    sx={{
                        width: '100vw',
                        height: '100dvh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundImage: `url(${ConcrntBG})`,
                        backgroundRepeat: 'repeat',
                        backgroundSize: '400px'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setOpenQR(false)
                    }}
                >
                    <Box maxWidth="90vw">
                        {props.user && (
                            <Tilt glareEnable={true} glareBorderRadius="1%">
                                <ProfileQRCard user={props.user} />
                            </Tilt>
                        )}
                    </Box>
                    <CCIconButton
                        sx={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px'
                        }}
                        onClick={() => {
                            setOpenQR(false)
                        }}
                    >
                        <CancelIcon
                            sx={{
                                color: 'text.primary'
                            }}
                        />
                    </CCIconButton>
                </Box>
            </Modal>

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
