import { Badge, Box, Button, alpha, useTheme } from '@mui/material'

import HomeIcon from '@mui/icons-material/Home'
import ContactsIcon from '@mui/icons-material/Contacts'
import ExploreIcon from '@mui/icons-material/Explore'
import CreateIcon from '@mui/icons-material/Create'
import MenuIcon from '@mui/icons-material/Menu'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { NavLink } from 'react-router-dom'
import { useGlobalActions } from '../../context/GlobalActions'
import type { ConcurrentTheme } from '../../model'
import { useEditorModal } from '../EditorModal'
import { useGlobalState } from '../../context/GlobalState'
import { usePreference } from '../../context/PreferenceContext'
import { MenuProps } from './Menu'

export const MobileMenu = (props: MenuProps): JSX.Element => {
    const theme = useTheme<ConcurrentTheme>()
    const actions = useGlobalActions()
    const editorModal = useEditorModal()

    const { isMasterSession } = useGlobalState()
    const { onHomeButtonClick } = useGlobalActions()
    const [progress] = usePreference('tutorialProgress')
    const [tutorialCompleted] = usePreference('tutorialCompleted')
    const [latestSeenNotification] = usePreference('lastSeenNotification')

    return (
        <Box
            sx={{
                display: 'flex',
                height: 49,
                color: 'white',
                justifyContent: 'space-around',
                marginBottom: 'env(safe-area-inset-bottom)',
                overflow: 'hidden'
            }}
        >
            <Button
                disableRipple
                variant="text"
                onClick={() => {
                    actions.openMobileMenu()
                }}
                sx={{
                    color: 'divider',
                    flex: 0.5,
                    minWidth: 0
                }}
            >
                <MenuIcon
                    fontSize="large"
                    sx={{
                        borderRadius: 1,
                        border: '1px solid',
                        padding: 0.3
                    }}
                />
            </Button>
            <Button
                variant="text"
                sx={{
                    color: 'background.contrastText',
                    flex: 1,
                    minWidth: 0
                }}
                component={NavLink}
                onClick={(event) => {
                    const res = onHomeButtonClick()
                    if (res) event.preventDefault()
                }}
                to="/"
            >
                <HomeIcon />
            </Button>
            <Button
                variant="text"
                sx={{
                    color: 'background.contrastText',
                    flex: 1,
                    minWidth: 0
                }}
                component={NavLink}
                to="/notifications"
            >
                <Badge color="secondary" variant="dot" invisible={latestSeenNotification >= props.latestNotification}>
                    <NotificationsIcon />
                </Badge>
            </Button>
            <Button
                variant="text"
                sx={{
                    color: 'background.contrastText',
                    flex: 1,
                    minWidth: 0
                }}
                component={NavLink}
                to="/contacts"
            >
                <ContactsIcon
                    sx={{
                        color: 'background.contrastText',
                        fontSize: '1.5rem'
                    }}
                />
            </Button>
            {!tutorialCompleted && (
                <Button
                    variant="text"
                    sx={{
                        color: 'background.contrastText',
                        flex: 1,
                        minWidth: 0
                    }}
                    component={NavLink}
                    to="/tutorial"
                >
                    <Badge color="secondary" variant="dot" invisible={progress !== 0 || !isMasterSession}>
                        <MenuBookIcon />
                    </Badge>
                </Button>
            )}
            <Button
                variant="text"
                sx={{
                    color: 'background.contrastText',
                    flex: 1,
                    minWidth: 0
                }}
                component={NavLink}
                to="/explorer/timelines"
            >
                <ExploreIcon />
            </Button>
            <Button
                variant="text"
                sx={{
                    height: 36,
                    my: 'auto',
                    flex: 0.5,
                    borderRadius: `20px 0 0 20px`,
                    backgroundColor: alpha(theme.palette.background.contrastText, 0.9),
                    ':hover': {
                        backgroundColor: alpha(theme.palette.background.contrastText, 1)
                    }
                }}
                onClick={() => {
                    editorModal.open()
                }}
            >
                <CreateIcon
                    sx={{
                        color: 'background.default'
                    }}
                />
            </Button>
        </Box>
    )
}
