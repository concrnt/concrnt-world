import { Box, Divider, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Typography } from '@mui/material'
import { type Timeline, type CommunityTimelineSchema } from '@concrnt/worldlib'
import { CCWallpaper } from './ui/CCWallpaper'
import { WatchButton } from './WatchButton'
import { CCIconButton } from './ui/CCIconButton'
import { useSnackbar } from 'notistack'
import { useState } from 'react'

import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import IosShareIcon from '@mui/icons-material/IosShare'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { usePreference } from '../context/PreferenceContext'
import { DomainChip } from './ui/DomainChip'
import { useTranslation } from 'react-i18next'

export interface TimelineBannerProps {
    timeline: Timeline<CommunityTimelineSchema>
    children?: JSX.Element | JSX.Element[] | boolean
}

export function TimelineBanner(props: TimelineBannerProps): JSX.Element {
    const { enqueueSnackbar } = useSnackbar()
    const { t } = useTranslation('', { keyPrefix: 'common' })
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
    const [muteTimelines, setMuteTimelines] = usePreference('muteTimelines')
    const [devMode] = usePreference('devMode')

    const muted = muteTimelines.includes(props.timeline.fqid)

    return (
        <>
            <CCWallpaper
                override={props.timeline.document.body.banner}
                sx={{
                    minHeight: '150px'
                }}
                innerSx={{
                    display: 'flex',
                    padding: 2,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 1
                }}
            >
                <>
                    <Paper sx={{ flex: 2, padding: 2, userSelect: 'text' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <Typography
                                variant="h1"
                                sx={{
                                    textDecoration: muted ? 'line-through' : 'none'
                                }}
                            >
                                {props.timeline.document.body.name}
                            </Typography>
                            <WatchButton minimal timelineFQID={props.timeline.fqid} />
                            <CCIconButton
                                onClick={(e) => {
                                    setMenuAnchor(e.currentTarget)
                                }}
                            >
                                <MoreHorizIcon
                                    sx={{
                                        color: 'text.primary'
                                    }}
                                />
                            </CCIconButton>
                        </Box>
                        <DomainChip small fqdn={props.timeline.host} />
                        <Divider
                            sx={{
                                my: 1
                            }}
                        />
                        <Typography>{props.timeline.document.body.description || t('noDescription')}</Typography>
                    </Paper>
                    {props.children}
                </>
            </CCWallpaper>
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null)
                }}
            >
                <MenuItem
                    onClick={() => {
                        navigator.clipboard.writeText(`https://concrnt.world/timeline/${props.timeline.fqid}`)
                        enqueueSnackbar(t('linkCopied'), { variant: 'success' })
                        setMenuAnchor(null)
                    }}
                >
                    <ListItemIcon>
                        <IosShareIcon
                            sx={{
                                color: 'text.primary'
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText>Copy Share Link</ListItemText>
                </MenuItem>
                {devMode && (
                    <MenuItem
                        onClick={() => {
                            navigator.clipboard.writeText(props.timeline.fqid)
                            enqueueSnackbar('Copied!', { variant: 'success' })
                            setMenuAnchor(null)
                        }}
                    >
                        <ListItemIcon>
                            <ContentPasteIcon
                                sx={{
                                    color: 'text.primary'
                                }}
                            />
                        </ListItemIcon>
                        <ListItemText>Copy ID</ListItemText>
                    </MenuItem>
                )}
                {muted ? (
                    <MenuItem
                        onClick={() => {
                            setMuteTimelines(muteTimelines.filter((id) => id !== props.timeline.fqid))
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
                            if (!muteTimelines.includes(props.timeline.id)) {
                                setMuteTimelines([...muteTimelines, props.timeline.fqid])
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
        </>
    )
}
