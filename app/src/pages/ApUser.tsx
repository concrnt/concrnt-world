import {
    Alert,
    alpha,
    Box,
    Button,
    Collapse,
    Divider,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Typography,
    useTheme
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { TimelineHeader } from '../components/TimelineHeader'
import { useClient } from '../context/ClientContext'
import { CCWallpaper } from '../components/ui/CCWallpaper'
import { CCIconButton } from '../components/ui/CCIconButton'
import { CCAvatar } from '../components/ui/CCAvatar'
import { enqueueSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'

import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import GfmRenderer from '../components/ui/GfmRenderer'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

interface Stats {
    follows: string[]
    followers: string[]
}

export function ApUserPage(): JSX.Element {
    const { client } = useClient()
    const { t } = useTranslation('', { keyPrefix: 'pages.apUser' })
    const { id } = useParams()
    const theme = useTheme()

    const [person, setPerson] = useState<any>(null)
    const [showHeader, setShowHeader] = useState(false)
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

    const name = person?.name || person?.preferredUsername || id

    const [stats, setStats] = useState<Stats | null>(null)

    const getStats = (): void => {
        client.api.fetchWithCredential<Stats>(client.host, `/ap/api/stats`, {}).then((data) => {
            setStats(data.content)
        })
    }

    useEffect(() => {
        getStats()
    }, [])

    const follow = (target: string): void => {
        client.api
            .fetchWithCredential(client.host, `/ap/api/follow/${target}`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                }
            })
            .then((_data) => {
                getStats()
            })
    }

    const unFollow = (target: string): void => {
        client.api
            .fetchWithCredential(client.host, `/ap/api/follow/${target}`, {
                method: 'DELETE',
                headers: {
                    'content-type': 'application/json'
                }
            })
            .then((_data) => {
                getStats()
            })
    }

    const following = stats?.follows.includes(person?.id || '') || false
    const followed = stats?.followers.includes(person?.id || '') || false

    useEffect(() => {
        if (!id) return
        client.api
            .fetchWithCredential(client.host, `/ap/api/resolve/${encodeURIComponent(id)}`, {
                method: 'GET',
                headers: {
                    accept: 'application/ld+json'
                },
                cache: 'force-cache'
            })
            .then((data) => {
                setPerson(data.content)
            })
    }, [id])

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'background.paper',
                minHeight: '100%',
                position: 'relative',
                overflowY: 'auto'
            }}
        >
            <Box position="absolute" top="0" left="0" width="100%" zIndex="1">
                <Collapse in={showHeader}>
                    <TimelineHeader title={name} titleIcon={<AlternateEmailIcon />} />
                </Collapse>
            </Box>

            <Box
                sx={{
                    position: 'relative'
                }}
            >
                <CCWallpaper
                    override={person?.image?.url}
                    sx={{
                        height: '150px'
                    }}
                    isLoading={!person}
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
                >
                    <CCAvatar
                        isLoading={!person}
                        alt={name}
                        avatarURL={person?.icon?.url}
                        identiconSource={id}
                        sx={{
                            width: '100px',
                            height: '100px'
                        }}
                    />
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
                            <Button
                                sx={{
                                    flexShrink: 0
                                }}
                                variant={following ? 'outlined' : 'contained'}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (!id) return
                                    if (following) {
                                        unFollow(id)
                                    } else {
                                        follow(id)
                                    }
                                }}
                            >
                                {following ? t('following') : t('follow')}
                            </Button>
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
                                mt: 1
                            }}
                        >
                            {name}
                        </Typography>
                        <Typography variant="caption">{person?.preferredUsername}</Typography>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap'
                        }}
                    >
                        <Typography
                            onClick={() => {
                                if (id) {
                                    navigator.clipboard.writeText(id)
                                    enqueueSnackbar(t('idCopied'), { variant: 'success' })
                                }
                            }}
                            sx={{
                                cursor: 'pointer'
                            }}
                            variant="caption"
                        >
                            {id}
                        </Typography>
                        {followed && <Typography variant="caption">{t('followed')}</Typography>}
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }}
                    >
                        <GfmRenderer messagebody={person?.summary || person?.description || ''} />
                    </Box>
                </Box>
                <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => {
                        setMenuAnchor(null)
                    }}
                >
                    <MenuItem
                        onClick={() => {
                            setMenuAnchor(null)
                            if (person?.url) {
                                window.open(person.url, '_blank', 'noopener,noreferrer')
                            }
                        }}
                    >
                        <ListItemIcon>
                            <OpenInNewIcon
                                sx={{
                                    color: 'text.primary'
                                }}
                            />
                        </ListItemIcon>
                        <ListItemText>{t('openRemote')}</ListItemText>
                    </MenuItem>
                </Menu>
            </Box>
            <Divider />

            <Alert
                sx={{
                    margin: 2
                }}
                severity="info"
                action={
                    <Button
                        variant="text"
                        color="inherit"
                        size="small"
                        onClick={() => {
                            if (person.url) {
                                window.open(person.url, '_blank', 'noopener,noreferrer')
                            }
                        }}
                    >
                        {t('openRemote')}
                    </Button>
                }
            >
                {t('isApUser')}
            </Alert>
        </Box>
    )
}
