import { useMemo, useRef, useState, useEffect } from 'react'
import {
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    Chip,
    FormControl,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography
} from '@mui/material'
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded'
import PushPinIcon from '@mui/icons-material/PushPin'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'
import LinkIcon from '@mui/icons-material/Link'
import EditIcon from '@mui/icons-material/Edit'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import ReplayIcon from '@mui/icons-material/Replay'
import SettingsIcon from '@mui/icons-material/Settings'
import { useTranslation } from 'react-i18next'
import { enqueueSnackbar } from 'notistack'

import { type ItemKind, type LibraryItem, useLibrary } from '../context/LibraryContext'
import { useManagedOperations } from '../hooks/useManagedOperations'
import { WatchButton } from '../components/WatchButton'
import { AckButton } from '../components/AckButton'
import { KeepItemDrawer } from '../components/KeepItemDrawer'
import { FolderManager } from '../components/FolderManager'
import { TagRuleManager } from '../components/TagRuleManager'
import { CCDrawer } from '../components/ui/CCDrawer'
import { useClient } from '../context/ClientContext'
import { type User } from '@concrnt/worldlib'

const kinds: ItemKind[] = ['user', 'timeline', 'message']

const formatRef = (item: LibraryItem): string => {
    if (item.kind === 'user') {
        const user = item.ref as { ccid: string; hint?: string }
        return `${user.hint ? `${user.hint} (${user.ccid})` : user.ccid}`
    }
    if (item.kind === 'timeline') {
        return (item.ref as { fqid: string }).fqid
    }
    const message = item.ref as { author: string; messageId: string; hint?: string }
    return `${message.author}/${message.messageId}${message.hint ? ` @${message.hint}` : ''}`
}

const resolveUserLabel = (user: User | null): string | undefined => {
    if (!user) return
    return user.profile?.username || (user as { username?: string }).username
}

const resolveTimelineLabel = (
    timeline: { document?: { body?: { name?: string } }; _parsedDocument?: { body?: { name?: string } } } | null
): string | undefined => {
    if (!timeline) return
    return timeline.document?.body?.name
        || timeline._parsedDocument?.body?.name
}

const sortItems = (items: LibraryItem[]): LibraryItem[] => {
    return [...items].sort((a, b) => {
        if ((a.pinned ?? false) !== (b.pinned ?? false)) {
            return b.pinned ? 1 : -1
        }
        if ((a.marked ?? false) !== (b.marked ?? false)) {
            return b.marked ? 1 : -1
        }
        return (b.updatedAt ?? b.keptAt) - (a.updatedAt ?? a.keptAt)
    })
}

const UserItemActions = ({ item }: { item: LibraryItem }): JSX.Element | null => {
    const { client } = useClient()
    const [user, setUser] = useState<User | null>(null)
    const userRef = item.ref as { ccid: string }
    const timelineID = user?.homeTimeline ?? ''

    useEffect(() => {
        client.getUser(userRef.ccid).then((u) => {
            if (u) setUser(u)
        })
    }, [userRef.ccid])

    if (!user) return null

    return (
        <Stack direction="row" spacing={0.5} alignItems="center">
            <AckButton user={user} managed />
            {timelineID && <WatchButton timelineFQID={timelineID} managed small />}
        </Stack>
    )
}

const TimelineItemActions = ({ item }: { item: LibraryItem }): JSX.Element => {
    const timelineRef = item.ref as { fqid: string }
    return (
        <Stack direction="row" spacing={0.5} alignItems="center">
            <WatchButton timelineFQID={timelineRef.fqid} managed small />
        </Stack>
    )
}

export const KeepPage = (): JSX.Element => {
    const { items, folders, togglePin, toggleMark, setFolder } = useLibrary()
    const { removeWithCleanup } = useManagedOperations()
    const { client } = useClient()
    const { t } = useTranslation('', { keyPrefix: 'pages.library' })
    const [tab, setTab] = useState<ItemKind>('user')
    const [editingItem, setEditingItem] = useState<LibraryItem | null>(null)
    const [manageOpen, setManageOpen] = useState(false)
    const [folderFilter, setFolderFilter] = useState<string>('')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [batchMode, setBatchMode] = useState(false)
    const [resolvedItemNames, setResolvedItemNames] = useState<Record<string, string>>({})
    const resolvingIdsRef = useRef<Set<string>>(new Set())

    const kindLabel: Record<ItemKind, string> = {
        user: t('users'),
        timeline: t('communities'),
        message: t('messages')
    }

    const visibleItems = useMemo(() => {
        let filtered = items.filter((item) => item.kind === tab)
        if (folderFilter) {
            filtered = filtered.filter((item) => item.folderId === folderFilter)
        }
        return sortItems(filtered)
    }, [items, tab, folderFilter])

    const getDisplayLabel = (item: LibraryItem): string => {
        const resolved = resolvedItemNames[item.id]
        if (resolved) return resolved
        if (item.kind === 'user') {
            return formatRef(item)
        }
        if (item.kind === 'timeline') {
            return formatRef(item)
        }
        return formatRef(item)
    }

    useEffect(() => {
        let disposed = false
        const entries = items

        entries.forEach((item) => {
            if (resolvingIdsRef.current.has(item.id)) return
            if (resolvedItemNames[item.id]) return

            if (item.kind === 'user') {
                const userRef = item.ref as { ccid: string }
                resolvingIdsRef.current.add(item.id)
                const fallbackUserLabel = formatRef(item)
                client
                    .getUser(userRef.ccid)
                    .then((user) => {
                        if (disposed) return
                        const name = resolveUserLabel(user)
                        if (name) {
                            setResolvedItemNames((prev) => ({ ...prev, [item.id]: `${name} (${userRef.ccid})` }))
                        } else {
                            setResolvedItemNames((prev) => ({ ...prev, [item.id]: fallbackUserLabel }))
                        }
                    })
                    .catch(() => {
                        if (disposed) return
                        setResolvedItemNames((prev) => ({ ...prev, [item.id]: fallbackUserLabel }))
                    })
                    .finally(() => {
                        resolvingIdsRef.current.delete(item.id)
                    })
            } else if (item.kind === 'timeline') {
                const timelineRef = item.ref as { fqid: string }
                resolvingIdsRef.current.add(item.id)
                const fallbackTimelineLabel = formatRef(item)
                client
                    .getTimeline(timelineRef.fqid)
                    .then((timeline: any) => {
                        if (disposed) return
                        const name = resolveTimelineLabel(timeline)
                        if (name) {
                            setResolvedItemNames((prev) => ({ ...prev, [item.id]: `${name} (${timelineRef.fqid})` }))
                        } else {
                            setResolvedItemNames((prev) => ({ ...prev, [item.id]: fallbackTimelineLabel }))
                        }
                    })
                    .catch(() => {
                        if (disposed) return
                        setResolvedItemNames((prev) => ({ ...prev, [item.id]: fallbackTimelineLabel }))
                    })
                    .finally(() => {
                        resolvingIdsRef.current.delete(item.id)
                    })
            }
        })

        return () => {
            disposed = true
        }
    }, [items, client, resolvedItemNames])

    const toggleSelect = (id: string): void => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const handleBatchMoveToFolder = (folderId: string): void => {
        for (const id of selectedIds) {
            setFolder(id, folderId || undefined)
        }
        enqueueSnackbar(`${selectedIds.size} items moved`, { variant: 'success' })
        setSelectedIds(new Set())
    }

    return (
        <Box
            sx={{
                height: '100%',
                overflow: 'hidden',
                backgroundColor: 'background.paper',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 1 }}>
                <Typography variant="h5" sx={{ flex: 1 }}>
                    {t('title')}
                </Typography>
                <Button
                    size="small"
                    variant={batchMode ? 'contained' : 'outlined'}
                    onClick={() => {
                        setBatchMode(!batchMode)
                        setSelectedIds(new Set())
                    }}
                >
                    {batchMode ? 'Done' : 'Select'}
                </Button>
                <IconButton onClick={() => setManageOpen(true)}>
                    <SettingsIcon />
                </IconButton>
            </Box>

            {folders.length > 0 && (
                <Box sx={{ px: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                            value={folderFilter}
                            displayEmpty
                            onChange={(e) => setFolderFilter(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {folders.map((f) => (
                                <MenuItem key={f.id} value={f.id}>
                                    {f.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            )}

            <Tabs value={tab} onChange={(_, value) => setTab(value as ItemKind)} sx={{ px: 1 }}>
                {kinds.map((kind) => (
                    <Tab key={kind} value={kind} label={kindLabel[kind]} />
                ))}
            </Tabs>

            {batchMode && selectedIds.size > 0 && (
                <Box sx={{ px: 1, py: 0.5, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="caption">{selectedIds.size} selected</Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                            value=""
                            displayEmpty
                            onChange={(e) => handleBatchMoveToFolder(e.target.value)}
                            renderValue={() => t('batchMove')}
                        >
                            <MenuItem value="">—</MenuItem>
                            {folders.map((f) => (
                                <MenuItem key={f.id} value={f.id}>
                                    {f.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            )}

            <Box sx={{ overflowY: 'auto', flex: 1, p: 1 }}>
                {visibleItems.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                        {t('noItems')}
                    </Paper>
                ) : (
                    visibleItems.map((item) => (
                        <Paper key={item.id} variant="outlined" sx={{ p: 1, mb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                {batchMode && (
                                    <Checkbox
                                        size="small"
                                        checked={selectedIds.has(item.id)}
                                        onChange={() => toggleSelect(item.id)}
                                    />
                                )}
                                <Box sx={{ flex: 1 }}>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Typography fontWeight="bold">[{kindLabel[item.kind]}]</Typography>
                                        {item.managed && (
                                            <Chip icon={<LinkIcon />} size="small" label="managed" color="info" variant="outlined" />
                                        )}
                                        {item.managed?.cleanupFailed && (
                                            <Chip icon={<ErrorOutlineIcon />} size="small" label={t('cleanupFailed')} color="warning" variant="outlined" />
                                        )}
                                    </Stack>
                                    <Typography>{getDisplayLabel(item)}</Typography>
                                    {(item.tags?.length ?? 0) > 0 && (
                                        <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
                                            {item.tags?.map((tag) => <Chip key={tag} size="small" label={tag} />)}
                                        </Stack>
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                        {t('keep')}: {new Date(item.keptAt).toLocaleString()}
                                    </Typography>
                                    {item.memo && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {t('memo')}: {item.memo}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {item.kind === 'user' && <UserItemActions item={item} />}
                            {item.kind === 'timeline' && <TimelineItemActions item={item} />}

                            {!batchMode && (
                                <Stack direction="row" justifyContent="flex-end" spacing={1} alignItems="center">
                                    <IconButton
                                        size="small"
                                        onClick={() => setEditingItem(item)}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <Tooltip title={item.pinned ? t('pinned') : t('pin')}>
                                        <IconButton size="small" onClick={() => togglePin(item.id)}>
                                            {item.pinned ? <PushPinIcon fontSize="small" color="primary" /> : <PushPinOutlinedIcon fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
                                    {item.managed?.cleanupFailed ? (
                                        <Button
                                            startIcon={<ReplayIcon />}
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                            onClick={() => {
                                                removeWithCleanup(item.id).then((result) => {
                                                    if (!result.success) {
                                                        enqueueSnackbar(t('cleanupFailed'), { variant: 'warning' })
                                                    }
                                                }).catch((e) => {
                                                    console.error('failed to retry cleanup', e)
                                                })
                                            }}
                                        >
                                            {t('retry')}
                                        </Button>
                                    ) : (
                                        <ButtonGroup size="small">
                                            <Button
                                                color={item.marked ? 'secondary' : 'inherit'}
                                                variant={item.marked ? 'contained' : 'outlined'}
                                                onClick={() => {
                                                    toggleMark(item.id)
                                                }}
                                            >
                                                {item.marked ? t('marked') : t('mark')}
                                            </Button>
                                            <Button
                                                startIcon={<BookmarkAddedIcon />}
                                                color="error"
                                                variant="outlined"
                                                onClick={() => {
                                                    removeWithCleanup(item.id).then((result) => {
                                                        if (!result.success) {
                                                            enqueueSnackbar(t('cleanupFailed'), { variant: 'warning' })
                                                        }
                                                    }).catch((e) => {
                                                        console.error('failed to remove item with cleanup', e)
                                                    })
                                                }}
                                            >
                                                {t('unkeep')}
                                            </Button>
                                        </ButtonGroup>
                                    )}
                                </Stack>
                            )}
                        </Paper>
                    ))
                )}
            </Box>

            <KeepItemDrawer
                item={editingItem}
                onClose={() => setEditingItem(null)}
            />

            <CCDrawer open={manageOpen} onClose={() => setManageOpen(false)}>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FolderManager />
                    <TagRuleManager />
                </Box>
            </CCDrawer>
        </Box>
    )
}
