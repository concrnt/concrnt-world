import {
    Box,
    Button,
    ButtonBase,
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    Link,
    Badge
} from '@mui/material'
import CreateIcon from '@mui/icons-material/Create'
import { Link as NavLink } from 'react-router-dom'
import HomeIcon from '@mui/icons-material/Home'
import TerminalIcon from '@mui/icons-material/Terminal'
import ExploreIcon from '@mui/icons-material/Explore'
import SettingsIcon from '@mui/icons-material/Settings'
import NotificationsIcon from '@mui/icons-material/Notifications'
import ContactsIcon from '@mui/icons-material/Contacts'
import CellTowerIcon from '@mui/icons-material/CellTower'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'

import { memo } from 'react'
import { ListsMenu } from '../ListsMenu/main'
import { CCAvatar } from '../ui/CCAvatar'
import { useClient } from '../../context/ClientContext'
import { usePreference } from '../../context/PreferenceContext'
import { useTranslation } from 'react-i18next'
import { useEditorModal } from '../EditorModal'
import { useGlobalState } from '../../context/GlobalState'
import { useGlobalActions } from '../../context/GlobalActions'

export interface MenuProps {
    onClick?: () => void
    latestNotification: number
}

export const Menu = memo<MenuProps>((props: MenuProps): JSX.Element => {
    const { client } = useClient()
    const editorModal = useEditorModal()
    const { onHomeButtonClick } = useGlobalActions()
    const { t } = useTranslation('', { keyPrefix: 'pages' })
    const [devMode] = usePreference('devMode')
    const [enableConcord] = usePreference('enableConcord')
    const [showEditorOnTop] = usePreference('showEditorOnTop')
    const { isMasterSession, isMobileSize } = useGlobalState()
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
                <Box sx={{ px: 2, pb: 1 }}>
                    <ButtonBase
                        component={NavLink}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'left',
                            gap: 1
                        }}
                        to={'/' + (client.ccid ?? '')}
                        onClick={props.onClick}
                    >
                        <CCAvatar
                            avatarURL={client?.user?.profile?.avatar}
                            identiconSource={client.ccid}
                            sx={{
                                width: '40px',
                                height: '40px'
                            }}
                        />
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', flexFlow: 'column' }}>
                            <Typography color="contrastText">{client?.user?.profile?.username}</Typography>
                            <Typography variant="caption" color="background.contrastText">
                                {client.host}
                            </Typography>
                        </Box>
                    </ButtonBase>
                </Box>
                <Divider />
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}
                >
                    <List dense sx={{ py: 0.5, width: '100%' }}>
                        <ListItem disablePadding>
                            <ListItemButton
                                sx={{ gap: 1 }}
                                component={NavLink}
                                to="/"
                                onClick={(event) => {
                                    props.onClick?.()
                                    const res = onHomeButtonClick()
                                    if (res) event.preventDefault()
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '1.75rem',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <HomeIcon sx={{ color: 'background.contrastText' }} />
                                </Box>
                                <ListItemText primary={t('home.title')} />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton
                                sx={{ gap: 1 }}
                                component={NavLink}
                                to="/notifications"
                                onClick={props.onClick}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '1.75rem',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Badge
                                        color="secondary"
                                        variant="dot"
                                        invisible={latestSeenNotification >= props.latestNotification}
                                    >
                                        <NotificationsIcon sx={{ color: 'background.contrastText' }} />
                                    </Badge>
                                </Box>
                                <ListItemText primary={t('notifications.title')} />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton sx={{ gap: 1 }} component={NavLink} to="/contacts" onClick={props.onClick}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '1.75rem',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <ContactsIcon
                                        sx={{
                                            color: 'background.contrastText',
                                            fontSize: '1.5rem'
                                        }}
                                    />
                                </Box>
                                <ListItemText primary={t('contacts.title')} />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton
                                sx={{ gap: 1 }}
                                component={NavLink}
                                to="/explorer/timelines"
                                onClick={props.onClick}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '1.75rem',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <ExploreIcon
                                        sx={{
                                            color: 'background.contrastText',
                                            fontSize: '1.65rem'
                                        }}
                                    />
                                </Box>
                                <ListItemText primary={t('explore.title')} />
                            </ListItemButton>
                        </ListItem>
                        {enableConcord && (
                            <ListItem disablePadding>
                                <ListItemButton
                                    sx={{ gap: 1 }}
                                    component={NavLink}
                                    to="/concord/assets"
                                    onClick={props.onClick}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            width: '1.75rem',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <CellTowerIcon sx={{ color: 'background.contrastText' }} />
                                    </Box>
                                    <ListItemText primary={'Concord'} />
                                </ListItemButton>
                            </ListItem>
                        )}
                        {!tutorialCompleted && (
                            <ListItem disablePadding>
                                <ListItemButton
                                    sx={{ gap: 1 }}
                                    component={NavLink}
                                    to="/tutorial"
                                    onClick={props.onClick}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            width: '1.75rem',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Badge
                                            color="secondary"
                                            variant="dot"
                                            invisible={progress !== 0 || !isMasterSession}
                                        >
                                            <MenuBookIcon
                                                sx={{
                                                    color: 'background.contrastText',
                                                    fontSize: '1.57rem'
                                                }}
                                            />
                                        </Badge>
                                    </Box>
                                    <ListItemText primary={t('tutorial.title')} />
                                </ListItemButton>
                            </ListItem>
                        )}
                        {devMode && (
                            <ListItem disablePadding>
                                <ListItemButton
                                    sx={{ gap: 1 }}
                                    component={NavLink}
                                    to="/devtool"
                                    onClick={props.onClick}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            width: '1.75rem',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <TerminalIcon sx={{ color: 'background.contrastText' }} />
                                    </Box>
                                    <ListItemText primary={t('devtool.title')} />
                                </ListItemButton>
                            </ListItem>
                        )}
                        <ListItem disablePadding>
                            <ListItemButton sx={{ gap: 1 }} component={NavLink} to="/deck" onClick={props.onClick}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '1.75rem',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <ViewColumnIcon sx={{ color: 'background.contrastText' }} />
                                </Box>
                                <ListItemText primary={t('deck.title')} />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton sx={{ gap: 1 }} component={NavLink} to="/settings" onClick={props.onClick}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '1.75rem',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <SettingsIcon sx={{ color: 'background.contrastText' }} />
                                </Box>
                                <ListItemText primary={t('settings.title')} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
                <Divider />
                <Box
                    sx={{
                        flex: 1,
                        scrollbarGutter: 'stable',
                        overflowX: 'hidden',
                        overflowY: isMobileSize ? 'auto' : 'hidden',
                        '&:hover': {
                            overflowY: 'auto'
                        }
                    }}
                >
                    <ListsMenu />
                </Box>
                {!showEditorOnTop && (
                    <Button
                        endIcon={<CreateIcon />}
                        onClick={() => {
                            editorModal.open()
                        }}
                        sx={{
                            display: { xs: 'none', sm: 'flex' },
                            height: 36,
                            borderRadius: `100px`
                        }}
                    >
                        {t('main.post')}
                    </Button>
                )}
                <Divider />
                <Box
                    sx={{
                        textAlign: 'left',
                        fontWeight: 400,
                        fontSize: '0.7rem',
                        marginBottom: '10px',
                        p: 1
                    }}
                >
                    <Box sx={{ textAlign: 'center', fontWeight: 600, mb: 'env(safe-area-inset-bottom)' }}>
                        {t('main.title')}
                        <br />
                        <Link
                            underline="hover"
                            color="background.contrastText"
                            href="https://square.concrnt.net/"
                            target="_blank"
                        >
                            {t('main.document')}
                        </Link>
                        {' / '}
                        <Link
                            underline="hover"
                            color="background.contrastText"
                            href="https://github.com/orgs/concrnt/discussions"
                            target="_blank"
                        >
                            {t('main.forum')}
                        </Link>
                        {' / '}
                        <Link
                            underline="hover"
                            color="background.contrastText"
                            href="https://github.com/totegamma/concurrent-world"
                            target="_blank"
                        >
                            GitHub
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
})

Menu.displayName = 'Menu'
