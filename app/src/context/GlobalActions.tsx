import { Box, Paper, Modal, Typography, Divider, Button, Drawer, useTheme, Tooltip } from '@mui/material'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useClient } from './ClientContext'
import { isNonNull, Schemas } from '@concrnt/worldlib'
import { usePreference } from './PreferenceContext'
import { ProfileEditor } from '../components/ProfileEditor'
import { Menu } from '../components/Menu/Menu'
import { CCDrawer } from '../components/ui/CCDrawer'
import { type EmojiPackage } from '../model'
import { experimental_VGrid as VGrid } from 'virtua'
import { useSnackbar } from 'notistack'
import { LogoutButton } from '../components/Settings/LogoutButton'
import { useGlobalState } from './GlobalState'

import GroupsIcon from '@mui/icons-material/Groups'
import HikingIcon from '@mui/icons-material/Hiking'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

export interface GlobalActionsState {
    openMobileMenu: (open?: boolean) => void
    openEmojipack: (url: EmojiPackage) => void
    onHomeButtonClick: () => boolean
    registerHomeButtonCallBack: (callback: () => boolean) => void
}

const GlobalActionsContext = createContext<GlobalActionsState | undefined>(undefined)

interface GlobalActionsProps {
    children: JSX.Element | JSX.Element[]
}

const style = {
    position: 'absolute',
    top: '10%',
    left: '50%',
    transform: 'translate(-50%, 0%)',
    width: '700px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflowY: 'auto'
}

const RowEmojiCount = 6

export const GlobalActionsProvider = (props: GlobalActionsProps): JSX.Element => {
    const { client } = useClient()
    const { isRegistered, isCanonicalUser, reloadList } = useGlobalState()
    const [lists, setLists] = usePreference('lists')
    const [emojiPackages, setEmojiPackages] = usePreference('emojiPackages')
    const { enqueueSnackbar } = useSnackbar()
    const theme = useTheme()
    const { t } = useTranslation('', { keyPrefix: 'globalActions' })

    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

    const [emojiPack, setEmojiPack] = useState<EmojiPackage>()
    const emojiPackAlreadyAdded = useMemo(() => {
        return emojiPackages.find((p) => p === emojiPack?.packageURL) !== undefined
    }, [emojiPack, emojiPackages])

    const setupAccountRequired = client?.user !== null && client?.user.profile === undefined
    const noListDetected = Object.keys(lists).length === 0

    const setupList = useCallback(
        (withCommunity: boolean) => {
            const preferredTimeline = localStorage.getItem('preferredTimeline')
            const timelines = [
                ...new Set([preferredTimeline, 'tar69vv26r5s4wk0r067v20bvyw@ariake.concrnt.net'].filter(isNonNull))
            ]

            client.api
                .upsertSubscription(
                    Schemas.listSubscription,
                    {
                        name: 'Home'
                    },
                    { indexable: false }
                )
                .then(async (sub) => {
                    if (withCommunity) {
                        await Promise.all(
                            timelines.map(async (timeline) => {
                                await client.api.subscribe(timeline, sub.id)
                            })
                        )
                    }

                    if (client.ccid) {
                        await client.api.subscribe('world.concrnt.t-home@' + client.ccid, sub.id)
                    }

                    const list = {
                        [sub.id]: {
                            pinned: true,
                            isIconTab: false,
                            expanded: false,
                            defaultPostHome: true,
                            defaultPostStreams: withCommunity ? [timelines[0]] : []
                        }
                    }
                    setLists(list)
                    reloadList()
                })
        },
        [client]
    )

    const openMobileMenu = useCallback((open?: boolean) => {
        setMobileMenuOpen(open ?? true)
    }, [])

    const openEmojipack = useCallback((pack: EmojiPackage) => {
        setEmojiPack(pack)
    }, [])

    const [onHomeButtonClickCallBack, setOnHomeButtonClickCallBack] = useState<() => boolean>(() => () => false)

    const onHomeButtonClick = useCallback(() => {
        if (onHomeButtonClickCallBack && location.pathname === '/') {
            return onHomeButtonClickCallBack()
        }
        return false
    }, [onHomeButtonClickCallBack, location.pathname])

    const registerHomeButtonCallBack = useCallback((callback: () => boolean) => {
        setOnHomeButtonClickCallBack(() => callback)
    }, [])

    return (
        <GlobalActionsContext.Provider
            value={useMemo(() => {
                return {
                    openMobileMenu,
                    openEmojipack,
                    onHomeButtonClick,
                    registerHomeButtonCallBack
                }
            }, [openMobileMenu, openEmojipack, onHomeButtonClick, registerHomeButtonCallBack])}
        >
            <>{props.children}</>
            <Modal open={!isRegistered} onClose={() => {}}>
                <Paper
                    sx={{
                        ...style,
                        padding: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                    }}
                >
                    <Typography variant="h2" component="div">
                        {t('noRegistration', { host: client.host })}
                    </Typography>
                    <LogoutButton />
                </Paper>
            </Modal>
            <Modal open={isCanonicalUser && setupAccountRequired && isRegistered} onClose={() => {}}>
                <Paper
                    sx={{
                        ...style,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <Typography variant="h2" component="div">
                        {t('completeAccountSetup')}
                    </Typography>
                    {t('foundIssues')}
                    <ul>{!client?.user?.profile && <li>{t('profileMissing')}</li>}</ul>
                    <ProfileEditor initial={client?.user?.profile} />
                </Paper>
            </Modal>
            <>
                {isCanonicalUser && noListDetected && (
                    <Modal open={true} onClose={() => {}}>
                        <Paper sx={style}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 1,
                                    overflowX: 'hidden'
                                }}
                            >
                                <Typography variant="h2" component="div" gutterBottom>
                                    {t('welcome')}
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        gap: 1
                                    }}
                                >
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 1,
                                            padding: 1,
                                            alignItems: 'center'
                                        }}
                                    >
                                        <GroupsIcon
                                            sx={{
                                                fontSize: '5rem'
                                            }}
                                        />
                                        <Typography variant="h3">{t('startWithCommunity')}</Typography>
                                        <Typography variant="caption">{t('startWithCommunityDesc')}</Typography>
                                        <Box flex={1} />
                                        <Button
                                            fullWidth
                                            onClick={() => {
                                                setupList(true)
                                            }}
                                        >
                                            {t('start')}
                                        </Button>
                                    </Paper>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 1,
                                            padding: 1,
                                            alignItems: 'center'
                                        }}
                                    >
                                        <HikingIcon
                                            sx={{
                                                fontSize: '5rem'
                                            }}
                                        />
                                        <Typography variant="h3">{t('startWithAlone')}</Typography>
                                        <Typography variant="caption">{t('startWithAloneDesc')}</Typography>
                                        <Box flex={1} />
                                        <Button
                                            fullWidth
                                            onClick={() => {
                                                setupList(false)
                                            }}
                                        >
                                            {t('start')}
                                        </Button>
                                    </Paper>
                                </Box>
                            </Box>
                        </Paper>
                    </Modal>
                )}
            </>
            <Drawer
                anchor={'left'}
                open={mobileMenuOpen}
                onClose={() => {
                    setMobileMenuOpen(false)
                }}
                PaperProps={{
                    sx: {
                        width: '200px',
                        pt: 1,
                        borderRadius: `0 ${theme.shape.borderRadius * 2}px ${theme.shape.borderRadius * 2}px 0`,
                        backgroundColor: 'background.default'
                    }
                }}
            >
                <Menu
                    latestNotification={0}
                    onClick={() => {
                        setMobileMenuOpen(false)
                    }}
                />
            </Drawer>
            <CCDrawer
                open={!!emojiPack}
                onClose={() => {
                    setEmojiPack(undefined)
                }}
            >
                <Box p={2}>
                    {emojiPack && (
                        <>
                            <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
                                <Typography variant="h1">{emojiPack.name}</Typography>
                                <img src={emojiPack.iconURL} alt={emojiPack.name} height="30px" />
                            </Box>
                            <Typography variant="h3">{emojiPack.description}</Typography>
                            <Typography variant="h4">by {emojiPack.credits}</Typography>
                            <Divider />
                            <Typography variant="h2">preview</Typography>
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                gap={1}
                            >
                                <VGrid
                                    row={Math.max(Math.ceil(emojiPack.emojis.length / RowEmojiCount), 4)} // HACK: 画面の高さを割るとvirtuaが壊れる
                                    col={RowEmojiCount}
                                    style={{
                                        overflowX: 'hidden',
                                        overflowY: 'auto',
                                        width: '310px',
                                        height: '300px'
                                    }}
                                    cellHeight={50}
                                    cellWidth={50}
                                >
                                    {({ colIndex, rowIndex }) => {
                                        const emoji = emojiPack.emojis[rowIndex * RowEmojiCount + colIndex]
                                        if (!emoji) {
                                            return null
                                        }
                                        return (
                                            <Tooltip
                                                arrow
                                                placement="top"
                                                title={
                                                    <Box display="flex" flexDirection="column" alignItems="center">
                                                        <img
                                                            src={emoji?.animURL ?? emoji?.imageURL ?? ''}
                                                            style={{
                                                                height: '5em'
                                                            }}
                                                        />
                                                        <Divider />
                                                        <Typography variant="caption" align="center">
                                                            {emoji.shortcode}
                                                        </Typography>
                                                    </Box>
                                                }
                                            >
                                                <img
                                                    src={emoji.imageURL}
                                                    alt={emoji.shortcode}
                                                    height="30px"
                                                    width="30px"
                                                />
                                            </Tooltip>
                                        )
                                    }}
                                </VGrid>
                                <Button
                                    fullWidth
                                    onClick={() => {
                                        setEmojiPackages([...emojiPackages, emojiPack.packageURL])
                                        setEmojiPack(undefined)
                                        enqueueSnackbar('added!', { variant: 'success' })
                                    }}
                                    disabled={emojiPackAlreadyAdded}
                                >
                                    {emojiPackAlreadyAdded ? ' (already added)' : 'Add to your collection'}
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </CCDrawer>
        </GlobalActionsContext.Provider>
    )
}

export function useGlobalActions(): GlobalActionsState {
    const actions = useContext(GlobalActionsContext)
    if (!actions) {
        return {
            openMobileMenu: () => {},
            openEmojipack: () => {},
            onHomeButtonClick: () => false,
            registerHomeButtonCallBack: () => {}
        }
    }
    return actions
}
