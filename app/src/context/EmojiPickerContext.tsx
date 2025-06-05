import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
    Popover,
    TextField,
    Box,
    Tabs,
    Tab,
    Typography,
    Divider,
    IconButton,
    alpha,
    Button,
    Slide,
    Modal,
    useTheme
} from '@mui/material'
import { usePreference } from './PreferenceContext'
import { type EmojiPackage, type Emoji, type RawEmojiPackage } from '../model'
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
import SearchIcon from '@mui/icons-material/Search'
import { usePersistent } from '../hooks/usePersistent'
import { Link as RouterLink } from 'react-router-dom'

import Fuzzysort from 'fuzzysort'
import { experimental_VGrid as VGrid, type VGridHandle, VList } from 'virtua'
import { fetchWithTimeout } from '../util'
import { useGlobalState } from './GlobalState'
import { useTranslation } from 'react-i18next'

export interface EmojiPickerState {
    open: (anchor: HTMLElement, onSelected: (selected: Emoji) => void) => void
    close: () => void
    search: (input: string, limit?: number) => Emoji[]
    packages: EmojiPackage[]
    addEmojiPackage: (url: string) => void
    removeEmojiPackage: (url: string) => void
    updateEmojiPackage: (url: string) => void
}

const EmojiPickerContext = createContext<EmojiPickerState | undefined>(undefined)

interface EmojiPickerProps {
    children: JSX.Element | JSX.Element[]
}

export const EmojiPickerProvider = (props: EmojiPickerProps): JSX.Element => {
    const { t } = useTranslation('', { keyPrefix: 'ui.emoji' })

    const theme = useTheme()
    const [emojiPackageURLs, setEmojiPackageURLs] = usePreference('emojiPackages')
    const { getImageURL, isMobileSize } = useGlobalState()

    const [viewportHeight, setViewportHeight] = useState<number>(visualViewport?.height ?? 0)
    useEffect(() => {
        function handleResize(): void {
            setViewportHeight(visualViewport?.height ?? 0)
        }
        visualViewport?.addEventListener('resize', handleResize)
        return () => visualViewport?.removeEventListener('resize', handleResize)
    }, [])

    const RowEmojiCount = 6
    const MobileRowEmojiCount = Math.floor(window.innerWidth / 50)

    const [anchor, setAnchor] = useState<HTMLElement | null>(null)
    const onSelectedRef = useRef<((selected: Emoji) => void) | null>(null)
    const [frequentEmojis, setFrequentEmojis] = usePersistent<Emoji[]>('FrequentEmojis', [])
    const [query, setQuery] = useState<string>('')
    const [emojiPackages, setEmojiPackages] = useState<EmojiPackage[]>([])
    const [allemojis, setAllEmojis] = useState<Emoji[]>([])
    const [emojiPickerTab, setEmojiPickerTab] = useState<number>(0)
    const [searchResults, setSearchResults] = useState<Emoji[]>([])
    const [selected, setSelected] = useState<number>(0)
    const [searchBoxFocused, setSearchBoxFocused] = useState<boolean>(false)

    const gridRef = useRef<VGridHandle>(null)

    const title: string = useMemo(() => {
        if (query.length > 0) {
            return 'Search Result'
        } else {
            if (emojiPickerTab === 0) {
                return 'Frequently Used'
            } else {
                return emojiPackages[emojiPickerTab - 1]?.name ?? t('letsAddEmojiPack')
            }
        }
    }, [emojiPickerTab, emojiPackages, query])

    const displayEmojis: Emoji[] = useMemo(() => {
        if (query.length > 0) {
            return searchResults
        } else {
            if (emojiPickerTab === 0) {
                return frequentEmojis
            } else {
                return emojiPackages[emojiPickerTab - 1]?.emojis ?? []
            }
        }
    }, [emojiPickerTab, emojiPackages, frequentEmojis, query, searchResults])

    const open = useCallback((anchor: HTMLElement, onSelected: (selected: Emoji) => void) => {
        setAnchor(anchor)
        setEmojiPickerTab(frequentEmojis.length > 0 ? 0 : 1)
        onSelectedRef.current = onSelected
    }, [])

    const close = useCallback(() => {
        setAnchor(null)
        setQuery('')
        setSearchBoxFocused(false)
        onSelectedRef.current = null
    }, [])

    const search = useCallback(
        (input: string, limit: number = 10) => {
            const results = Fuzzysort.go(input, allemojis, {
                limit,
                threshold: -10000,
                keys: ['shortcode', 'keywords']
            }).map((result) => result.obj)

            return results.filter(
                (elem, index) => results.findIndex((e: Emoji) => e.imageURL === elem.imageURL) === index
            )
        },
        [allemojis]
    )

    const onSelectEmoji = useCallback(
        (emoji: Emoji) => {
            const newFrequentEmojis = frequentEmojis.filter(
                (frequentEmoji) => frequentEmoji.shortcode !== emoji.shortcode
            )
            newFrequentEmojis.unshift(emoji)
            setFrequentEmojis(newFrequentEmojis.slice(0, 60))
            onSelectedRef.current?.(emoji)
        },
        [frequentEmojis]
    )

    const addEmojiPackage = useCallback(
        (url: string) => {
            if (emojiPackageURLs.includes(url)) return
            setEmojiPackageURLs([...emojiPackageURLs, url])
        },
        [emojiPackageURLs]
    )

    const removeEmojiPackage = useCallback(
        (url: string) => {
            setEmojiPackageURLs(emojiPackageURLs.filter((u) => u !== url))
        },
        [emojiPackageURLs]
    )

    const updateEmojiPackage = useCallback((url: string) => {
        const cacheKey = `emojiPackage:${url}`
        localStorage.removeItem(cacheKey)
        setEmojiPackages((prev) => prev.filter((pkg) => pkg.packageURL !== url))
        fetchWithTimeout(
            url,
            {
                cache: 'no-cache'
            },
            3000
        )
            .then((j) => j.json())
            .then((p: RawEmojiPackage) => {
                const packages: EmojiPackage = {
                    ...p,
                    packageURL: url,
                    fetchedAt: new Date()
                }
                setEmojiPackages((prev) => [...prev, packages])
                setAllEmojis((prev) => [...prev, ...packages.emojis])
                localStorage.setItem(cacheKey, JSON.stringify(packages))
            })
            .catch(() => {
                console.error('Failed to fetch emoji package', url)
            })
    }, [])

    useEffect(() => {
        setEmojiPackages([])
        setAllEmojis([])
        let unmounted = false
        emojiPackageURLs.forEach((url) => {
            const cacheKey = `emojiPackage:${url}`
            // check cache
            const cache = localStorage.getItem(cacheKey)
            if (cache) {
                const pkg = JSON.parse(cache)
                if (unmounted) return
                setEmojiPackages((prev) => [...prev, pkg])
                setAllEmojis((prev) => [...prev, ...pkg.emojis])
            } else {
                fetchWithTimeout(url, {}, 3000)
                    .then((j) => j.json())
                    .then((p: RawEmojiPackage) => {
                        const packages: EmojiPackage = {
                            ...p,
                            packageURL: url,
                            fetchedAt: new Date()
                        }
                        if (unmounted) return
                        setEmojiPackages((prev) => [...prev, packages])
                        setAllEmojis((prev) => [...prev, ...packages.emojis])
                        localStorage.setItem(cacheKey, JSON.stringify(packages))
                    })
                    .catch(() => {
                        console.error('Failed to fetch emoji package', url)
                    })
            }
        })
        return () => {
            unmounted = true
        }
    }, [emojiPackageURLs])

    useEffect(() => {
        if (query.length > 0) {
            setSearchResults(search(query, 64))
        } else {
            setSearchResults([])
        }
    }, [query])

    const tabsx = {
        minWidth: '10%'
    }

    return (
        <EmojiPickerContext.Provider
            value={useMemo(() => {
                return {
                    open,
                    close,
                    search,
                    packages: emojiPackages,
                    addEmojiPackage,
                    removeEmojiPackage,
                    updateEmojiPackage
                }
            }, [open, close, search, emojiPackages])}
        >
            <>
                {props.children}
                {isMobileSize ? (
                    <Modal
                        open={!!anchor}
                        onClose={() => {
                            close()
                        }}
                        sx={{
                            '& .MuiBackdrop-root': {
                                backgroundColor: 'unset'
                            }
                        }}
                    >
                        <Slide in={!!anchor} direction="up" mountOnEnter unmountOnExit>
                            <Box
                                position="fixed"
                                bottom={`calc(100dvh - ${viewportHeight}px)`}
                                right="0"
                                width="100vw"
                                display="flex"
                                flexDirection="column"
                                overflow="hidden"
                                sx={{
                                    backgroundColor: 'background.paper',
                                    borderRadius: '10px 10px 0 0'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                            >
                                <Box // header
                                    display="flex"
                                    flexDirection="column"
                                    width="100%"
                                >
                                    <Box
                                        display={searchBoxFocused ? 'none' : 'flex'}
                                        flexDirection="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        width="100%"
                                    >
                                        <Tabs
                                            value={query.length === 0 ? emojiPickerTab : 0}
                                            onChange={(_, newValue) => {
                                                setQuery('')
                                                setEmojiPickerTab(newValue)
                                            }}
                                            variant="scrollable"
                                            scrollButtons="auto"
                                            textColor="secondary"
                                            indicatorColor="secondary"
                                        >
                                            {query.length === 0 ? (
                                                <Tab
                                                    key="frequent"
                                                    aria-label="Frequently Used"
                                                    icon={<AccessTimeFilledIcon />}
                                                    sx={tabsx}
                                                    onClick={() => {
                                                        gridRef.current?.scrollTo(0, 0)
                                                    }}
                                                />
                                            ) : (
                                                <Tab
                                                    key="search"
                                                    aria-label="Search Result"
                                                    icon={<SearchIcon />}
                                                    sx={tabsx}
                                                />
                                            )}
                                            {emojiPackages.map((emojiPackage, _index) => (
                                                <Tab
                                                    key={emojiPackage.packageURL}
                                                    aria-label={emojiPackage.name}
                                                    icon={
                                                        <img
                                                            src={getImageURL(emojiPackage.iconURL, { maxHeight: 128 })}
                                                            alt={emojiPackage.name}
                                                            height="20px"
                                                        />
                                                    }
                                                    sx={tabsx}
                                                    onClick={() => {
                                                        gridRef.current?.scrollTo(0, 0)
                                                    }}
                                                />
                                            ))}
                                        </Tabs>
                                    </Box>
                                    <Box
                                        display={searchBoxFocused ? 'flex' : 'none'}
                                        flexDirection="row"
                                        alignItems="center"
                                        width="100%"
                                        gap={1}
                                    >
                                        <VList horizontal style={{ height: '50px', width: '100%' }}>
                                            {displayEmojis.map((emoji, _) => (
                                                <IconButton
                                                    key={emoji.imageURL}
                                                    onMouseDown={() => {
                                                        onSelectEmoji(emoji)
                                                    }}
                                                >
                                                    <img
                                                        src={getImageURL(emoji.imageURL, { maxHeight: 128 })}
                                                        alt={emoji.shortcode}
                                                        height="30px"
                                                        width="30px"
                                                    />
                                                </IconButton>
                                            ))}
                                        </VList>
                                    </Box>
                                    <Divider />
                                    <TextField
                                        placeholder="Search emoji"
                                        value={query}
                                        onChange={(e) => {
                                            setQuery(e.target.value)
                                        }}
                                        onFocus={(e) => {
                                            setTimeout(() => {
                                                window.scrollTo(0, 0)
                                            }, 100)
                                            setSearchBoxFocused(true)
                                        }}
                                        sx={{
                                            flexGrow: 1,
                                            m: 1
                                        }}
                                        onBlur={() => {
                                            close()
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (displayEmojis.length > 0) {
                                                    e.preventDefault()
                                                    onSelectEmoji(displayEmojis[selected])
                                                    close()
                                                }
                                            }
                                        }}
                                    />
                                </Box>
                                <Box // body
                                    flexGrow={1}
                                    overflow="hidden"
                                    display={searchBoxFocused ? 'none' : 'flex'}
                                    flexDirection="column"
                                    width="100%"
                                    pb={2}
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <VGrid
                                        row={Math.max(Math.ceil(displayEmojis.length / MobileRowEmojiCount), 4)} // HACK: 画面の高さを割るとvirtuaが壊れる
                                        col={MobileRowEmojiCount}
                                        style={{
                                            overflowX: 'hidden',
                                            overflowY: 'auto',
                                            width: `${50 * MobileRowEmojiCount}px`,
                                            height: '190px'
                                        }}
                                        cellHeight={50}
                                        cellWidth={50}
                                        ref={gridRef}
                                    >
                                        {({ colIndex, rowIndex }) => {
                                            const emoji = displayEmojis[rowIndex * MobileRowEmojiCount + colIndex]
                                            if (!emoji) {
                                                return null
                                            }
                                            return (
                                                <IconButton
                                                    onMouseDown={() => {
                                                        onSelectEmoji(emoji)
                                                    }}
                                                >
                                                    <img
                                                        src={getImageURL(emoji.imageURL, { maxHeight: 128 })}
                                                        alt={emoji.shortcode}
                                                        height="30px"
                                                        width="30px"
                                                    />
                                                </IconButton>
                                            )
                                        }}
                                    </VGrid>
                                </Box>
                            </Box>
                        </Slide>
                    </Modal>
                ) : (
                    <Popover
                        open={!!anchor}
                        anchorEl={anchor}
                        onClose={() => {
                            close()
                        }}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center'
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center'
                        }}
                        PaperProps={{
                            style: {
                                width: '320px',
                                height: '400px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }
                        }}
                    >
                        <Box // header
                            display="flex"
                            flexDirection="column"
                        >
                            <Tabs
                                value={query.length === 0 ? emojiPickerTab : 0}
                                onChange={(_, newValue) => {
                                    setQuery('')
                                    setEmojiPickerTab(newValue)
                                }}
                                variant="scrollable"
                                scrollButtons="auto"
                                textColor="secondary"
                                indicatorColor="secondary"
                            >
                                {query.length === 0 ? (
                                    <Tab
                                        key="frequent"
                                        aria-label="Frequently Used"
                                        icon={<AccessTimeFilledIcon />}
                                        sx={tabsx}
                                        onClick={() => {
                                            gridRef.current?.scrollTo(0, 0)
                                        }}
                                    />
                                ) : (
                                    <Tab key="search" aria-label="Search Result" icon={<SearchIcon />} sx={tabsx} />
                                )}
                                {emojiPackages.map((emojiPackage, _index) => (
                                    <Tab
                                        key={emojiPackage.packageURL}
                                        aria-label={emojiPackage.name}
                                        icon={
                                            <img
                                                src={getImageURL(emojiPackage.iconURL, { maxHeight: 128 })}
                                                alt={emojiPackage.name}
                                                height="20px"
                                            />
                                        }
                                        sx={tabsx}
                                        onClick={() => {
                                            gridRef.current?.scrollTo(0, 0)
                                        }}
                                    />
                                ))}
                            </Tabs>
                            <Divider />
                            <TextField
                                autoFocus
                                placeholder="Search emoji"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value)
                                }}
                                sx={{
                                    flexGrow: 1,
                                    m: 1
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (displayEmojis.length > 0) {
                                            e.preventDefault()
                                            setAnchor(null)
                                            onSelectEmoji(displayEmojis[selected])
                                        }
                                    }
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault()
                                        const next = Math.min(selected + RowEmojiCount, displayEmojis.length - 1)
                                        setSelected(next)
                                    }
                                    if (e.key === 'ArrowUp') {
                                        e.preventDefault()
                                        const next = Math.max(selected - RowEmojiCount, 0)
                                        setSelected(next)
                                    }
                                    if (e.key === 'ArrowLeft') {
                                        e.preventDefault()
                                        const next = Math.max(selected - 1, 0)
                                        setSelected(next)
                                    }
                                    if (e.key === 'ArrowRight') {
                                        e.preventDefault()
                                        const next = Math.min(selected + 1, displayEmojis.length - 1)
                                        setSelected(next)
                                    }
                                }}
                                onFocus={() => {
                                    setSelected(0)
                                    setSearchBoxFocused(true)
                                }}
                                onBlur={() => {
                                    setSearchBoxFocused(false)
                                }}
                            />
                        </Box>
                        <Box // body
                            flexGrow={1}
                            overflow="hidden"
                            display="flex"
                            flexDirection="column"
                            padding={1}
                        >
                            <Box // Header
                                display="flex"
                            >
                                <Typography>{title}</Typography>
                            </Box>
                            <VGrid
                                row={Math.max(Math.ceil(displayEmojis.length / RowEmojiCount), 4)} // HACK: 画面の高さを割るとvirtuaが壊れる
                                col={RowEmojiCount}
                                style={{
                                    overflowX: 'hidden',
                                    overflowY: 'auto',
                                    width: '310px',
                                    height: '190px'
                                }}
                                cellHeight={50}
                                cellWidth={50}
                                ref={gridRef}
                            >
                                {({ colIndex, rowIndex }) => {
                                    const index = rowIndex * RowEmojiCount + colIndex
                                    const emoji = displayEmojis[rowIndex * RowEmojiCount + colIndex]
                                    if (!emoji) {
                                        return null
                                    }
                                    return (
                                        <IconButton
                                            onMouseDown={() => {
                                                onSelectEmoji(emoji)
                                            }}
                                            onMouseOver={() => {
                                                setSelected(index)
                                            }}
                                            sx={{
                                                bgcolor:
                                                    selected === index && searchBoxFocused
                                                        ? alpha(theme.palette.primary.main, 0.3)
                                                        : 'transparent',
                                                '&:hover': {
                                                    bgcolor: alpha(theme.palette.primary.main, 0.5)
                                                }
                                            }}
                                        >
                                            <img
                                                src={getImageURL(emoji.imageURL, { maxHeight: 128 })}
                                                alt={emoji.shortcode}
                                                height="30px"
                                                width="30px"
                                            />
                                        </IconButton>
                                    )
                                }}
                            </VGrid>
                        </Box>
                        <Divider />
                        <Box display="flex" padding={1} justifyContent="space-between" alignItems="center">
                            <Box display="flex" alignItems="center" gap={1}>
                                <Box /* preview */
                                    component="img"
                                    src={getImageURL(displayEmojis[selected]?.imageURL, { maxHeight: 128 })}
                                    alt={displayEmojis[selected]?.shortcode}
                                    height="30px"
                                    width="30px"
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'inline-block',
                                        width: '100px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {displayEmojis[selected]?.shortcode}
                                </Typography>
                            </Box>
                            <Button
                                component={RouterLink}
                                variant="outlined"
                                to="/settings/emoji"
                                onClick={() => {
                                    setAnchor(null)
                                }}
                            >
                                {t('addEmojis')}
                            </Button>
                        </Box>
                    </Popover>
                )}
            </>
        </EmojiPickerContext.Provider>
    )
}

export function useEmojiPicker(): EmojiPickerState {
    return useContext(EmojiPickerContext) as EmojiPickerState
}
