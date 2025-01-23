import { Box, Paper, Modal, Typography, Divider, Button, Drawer, useTheme, Tooltip } from '@mui/material'
import { InspectorProvider } from '../context/Inspector'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useClient } from './ClientContext'
import { type CommunityTimelineSchema, Schemas, type CoreTimeline } from '@concurrent-world/client'
import { usePreference } from './PreferenceContext'
import { ProfileEditor } from '../components/ProfileEditor'
import { Menu } from '../components/Menu/Menu'
import { CCDrawer } from '../components/ui/CCDrawer'
import { type EmojiPackage } from '../model'
import { experimental_VGrid as VGrid } from 'virtua'
import { useSnackbar } from 'notistack'
import { StreamCard } from '../components/Stream/Card'
import { LogoutButton } from '../components/Settings/LogoutButton'
import { useGlobalState } from './GlobalState'

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

    const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

    const [emojiPack, setEmojiPack] = useState<EmojiPackage>()
    const emojiPackAlreadyAdded = useMemo(() => {
        return emojiPackages.find((p) => p === emojiPack?.packageURL) !== undefined
    }, [emojiPack, emojiPackages])

    const setupAccountRequired = client?.user !== null && client?.user.profile === undefined
    const noListDetected = Object.keys(lists).length === 0

    const [timelines, setTimelines] = useState<Array<CoreTimeline<CommunityTimelineSchema>>>([])
    const [selectedTieline, setSelectedTimeline] = useState<string | undefined>(undefined)

    const setupList = useCallback(
        (timeline?: string) => {
            client.api
                .upsertSubscription(
                    Schemas.listSubscription,
                    {
                        name: 'Home'
                    },
                    { indexable: false }
                )
                .then(async (sub) => {
                    if (timeline) {
                        await client.api.subscribe(timeline, sub.id)
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
                            defaultPostStreams: timeline ? [timeline] : []
                        }
                    }
                    setLists(list)
                    reloadList()
                })
        },
        [client]
    )

    useEffect(() => {
        if (noListDetected) {
            client
                .getTimelinesBySchema<CommunityTimelineSchema>(client.host, Schemas.communityTimeline)
                .then((timelines) => {
                    const preferredTimeline = localStorage.getItem('preferredTimeline')
                    if (preferredTimeline && timelines.find((t) => t.id === preferredTimeline)) {
                        setSelectedTimeline(preferredTimeline)
                        // move to the top
                        const t = timelines.find((t) => t.id === preferredTimeline)
                        if (t) {
                            timelines.splice(timelines.indexOf(t), 1)
                            timelines.unshift(t)
                        }
                    }

                    setTimelines(timelines)
                })
        }
    }, [])

    const openMobileMenu = useCallback((open?: boolean) => {
        setMobileMenuOpen(open ?? true)
    }, [])

    const openEmojipack = useCallback((pack: EmojiPackage) => {
        setEmojiPack(pack)
    }, [])

    const [onHomeButtonClickCallBack, setOnHomeButtonClickCallBack] = useState<() => boolean>(() => () => false)

    const onHomeButtonClick = useCallback(() => {
        if (onHomeButtonClickCallBack) {
            return onHomeButtonClickCallBack()
        }
        return false
    }, [onHomeButtonClickCallBack])

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
            <InspectorProvider>
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
                            {client.host}に登録情報が見つかりません
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
                            アカウント設定を完了させましょう！
                        </Typography>
                        見つかった問題:
                        <ul>{!client?.user?.profile && <li>プロフィールが存在していません</li>}</ul>
                        <ProfileEditor initial={client?.user?.profile} />
                    </Paper>
                </Modal>

                <Modal open={isCanonicalUser && noListDetected} onClose={() => {}}>
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
                                コンカレントへようこそ！
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflowX: 'hidden',
                                    gap: 2
                                }}
                            >
                                <Typography variant="h3" component="div">
                                    ウォッチするコミュニティを選ぶ(任意)
                                </Typography>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        overflowX: 'auto'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            flex: 1,
                                            gap: 2,
                                            py: 1
                                        }}
                                    >
                                        {timelines.map((timeline) => (
                                            <StreamCard
                                                key={timeline.id}
                                                streamID={timeline.id}
                                                name={timeline.document.body.name}
                                                description={timeline.document.body.description ?? 'no description'}
                                                banner={timeline.document.body.banner ?? ''}
                                                domain={client.host}
                                                onClick={() => {
                                                    if (selectedTieline === timeline.id) {
                                                        setSelectedTimeline(undefined)
                                                    } else {
                                                        setSelectedTimeline(timeline.id)
                                                    }
                                                }}
                                                sx={{
                                                    outline:
                                                        timeline.id === selectedTieline
                                                            ? `2px solid ${theme.palette.primary.main}`
                                                            : 'none',
                                                    width: '300px'
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>

                                <Button
                                    fullWidth
                                    onClick={() => {
                                        setupList(selectedTieline)
                                    }}
                                >
                                    はじめる
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Modal>

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
            </InspectorProvider>
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
