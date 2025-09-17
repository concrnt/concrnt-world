import { Badge, Box, ButtonBase, Divider, IconButton } from '@mui/material'
import CreateIcon from '@mui/icons-material/Create'
import { Link } from 'react-router-dom'

import HomeIcon from '@mui/icons-material/Home'
import ExploreIcon from '@mui/icons-material/Explore'
import SettingsIcon from '@mui/icons-material/Settings'
import ContactsIcon from '@mui/icons-material/Contacts'
import NotificationsIcon from '@mui/icons-material/Notifications'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'

import { memo } from 'react'
import { CCAvatar } from '../ui/CCAvatar'
import { useClient } from '../../context/ClientContext'
import { usePreference } from '../../context/PreferenceContext'
import { useGlobalActions } from '../../context/GlobalActions'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { MinimalListsMenu } from '../ListsMenu/minimal'
import TerminalIcon from '@mui/icons-material/Terminal'
import { useEditorModal } from '../EditorModal'
import { useGlobalState } from '../../context/GlobalState'
import { MenuProps } from './Menu'

export const ThinMenu = memo<MenuProps>((props: MenuProps): JSX.Element => {
    const { client } = useClient()
    const actions = useGlobalActions()
    const editorModal = useEditorModal()
    const [devMode] = usePreference('devMode')
    const [showEditorOnTop] = usePreference('showEditorOnTop')

    const { isMasterSession } = useGlobalState()
    const [progress] = usePreference('tutorialProgress')
    const [tutorialCompleted] = usePreference('tutorialCompleted')
    const [latestSeenNotification] = usePreference('lastSeenNotification')

    return (
        <Box
            sx={{
                height: '100%',
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    color: 'background.contrastText'
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ButtonBase
                        component={Link}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1
                        }}
                        to={'/' + (client.ccid ?? '')}
                        onClick={props.onClick}
                    >
                        <CCAvatar
                            avatarURL={client.user?.profile?.avatar}
                            identiconSource={client.ccid}
                            sx={{
                                width: '40px',
                                height: '40px'
                            }}
                        />
                    </ButtonBase>
                </Box>
                <Divider sx={{ mt: 1 }} />
                <Box display="flex" flexDirection="column" alignItems="center">
                    <IconButton
                        sx={{ p: 0.5 }}
                        component={Link}
                        to="/"
                        onClick={(e) => {
                            props.onClick?.()
                            const res = actions.onHomeButtonClick()
                            if (res) e.preventDefault()
                        }}
                    >
                        <HomeIcon
                            sx={{
                                color: 'background.contrastText'
                            }}
                        />
                    </IconButton>
                    <IconButton sx={{ p: 0.5 }} component={Link} to="/notifications" onClick={props.onClick}>
                        <Badge
                            color="secondary"
                            variant="dot"
                            invisible={latestSeenNotification >= props.latestNotification}
                        >
                            <NotificationsIcon
                                sx={{
                                    color: 'background.contrastText'
                                }}
                            />
                        </Badge>
                    </IconButton>
                    <IconButton sx={{ p: 0.5 }} component={Link} to="/contacts" onClick={props.onClick}>
                        <ContactsIcon
                            sx={{
                                color: 'background.contrastText'
                            }}
                        />
                    </IconButton>
                    <IconButton sx={{ p: 0.5 }} component={Link} to="/explorer/timelines" onClick={props.onClick}>
                        <ExploreIcon
                            sx={{
                                color: 'background.contrastText'
                            }}
                        />
                    </IconButton>
                    {!tutorialCompleted && (
                        <IconButton sx={{ p: 0.5 }} component={Link} to="/tutorial" onClick={props.onClick}>
                            <Badge color="secondary" variant="dot" invisible={progress !== 0 || !isMasterSession}>
                                <MenuBookIcon
                                    sx={{
                                        color: 'background.contrastText'
                                    }}
                                />
                            </Badge>
                        </IconButton>
                    )}

                    {devMode && (
                        <IconButton sx={{ p: 0.5 }} component={Link} to="/devtool" onClick={props.onClick}>
                            <TerminalIcon
                                sx={{
                                    color: 'background.contrastText'
                                }}
                            />
                        </IconButton>
                    )}

                    <IconButton sx={{ p: 0.5 }} component={Link} to="/deck" onClick={props.onClick}>
                        <ViewColumnIcon
                            sx={{
                                color: 'background.contrastText'
                            }}
                        />
                    </IconButton>

                    <IconButton sx={{ p: 0.5 }} component={Link} to="/settings" onClick={props.onClick}>
                        <SettingsIcon
                            sx={{
                                color: 'background.contrastText'
                            }}
                        />
                    </IconButton>
                </Box>
                <Divider sx={{ mt: 1 }} />
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                        overflowX: 'hidden',
                        overflowY: 'hidden',
                        '&:hover': {
                            overflowY: 'auto'
                        }
                    }}
                >
                    <MinimalListsMenu />
                </Box>
                <Divider />
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                    {!showEditorOnTop && (
                        <IconButton
                            onClick={() => {
                                editorModal.open()
                            }}
                            sx={{
                                color: 'background.contrastText'
                            }}
                        >
                            <CreateIcon />
                        </IconButton>
                    )}
                    <IconButton
                        sx={{
                            color: 'background.contrastText'
                        }}
                        onClick={() => {
                            actions.openMobileMenu()
                        }}
                    >
                        <KeyboardArrowRightIcon />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    )
})

ThinMenu.displayName = 'ThinMenu'
