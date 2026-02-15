import { useMemo, useState } from 'react'
import { Box, Button, ButtonGroup, Chip, Paper, Stack, Tab, Tabs, Typography } from '@mui/material'
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded'
import PushPinIcon from '@mui/icons-material/PushPin'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'
import LinkIcon from '@mui/icons-material/Link'
import { useTranslation } from 'react-i18next'

import { type ItemKind, type LibraryItem, useLibrary } from '../context/LibraryContext'
import { useManagedOperations } from '../hooks/useManagedOperations'

const kinds: ItemKind[] = ['user', 'timeline', 'message']

const formatRef = (item: LibraryItem): string => {
    if (item.kind === 'user') {
        const user = item.ref as { ccid: string; hint?: string }
        return `${user.ccid}${user.hint ? ` @${user.hint}` : ''}`
    }
    if (item.kind === 'timeline') {
        return (item.ref as { fqid: string }).fqid
    }
    const message = item.ref as { author: string; messageId: string; hint?: string }
    return `${message.author}/${message.messageId}${message.hint ? ` @${message.hint}` : ''}`
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

export const KeepPage = (): JSX.Element => {
    const { items, togglePin, toggleMark } = useLibrary()
    const { removeWithCleanup } = useManagedOperations()
    const { t } = useTranslation('', { keyPrefix: 'pages.library' })
    const [tab, setTab] = useState<ItemKind>('user')

    const kindLabel: Record<ItemKind, string> = {
        user: t('users'),
        timeline: t('communities'),
        message: t('messages')
    }

    const visibleItems = useMemo(() => sortItems(items.filter((item) => item.kind === tab)), [items, tab])

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
            <Typography variant="h5" sx={{ p: 2 }}>
                {t('title')}
            </Typography>
            <Tabs value={tab} onChange={(_, value) => setTab(value as ItemKind)} sx={{ px: 1 }}>
                {kinds.map((kind) => (
                    <Tab key={kind} value={kind} label={kindLabel[kind]} />
                ))}
            </Tabs>
            <Box sx={{ overflowY: 'auto', flex: 1, p: 1 }}>
                {visibleItems.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                        {t('noItems')}
                    </Paper>
                ) : (
                    visibleItems.map((item) => (
                        <Paper key={item.id} variant="outlined" sx={{ p: 1, mb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography fontWeight="bold">[{kindLabel[item.kind]}]</Typography>
                                    {item.managed && (
                                        <Chip icon={<LinkIcon />} size="small" label="managed" color="info" variant="outlined" />
                                    )}
                                </Stack>
                                <Typography>{formatRef(item)}</Typography>
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
                            <Stack direction="row" justifyContent="flex-end" spacing={1}>
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
                                        startIcon={item.pinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
                                        color={item.pinned ? 'secondary' : 'inherit'}
                                        variant={item.pinned ? 'contained' : 'outlined'}
                                        onClick={() => {
                                            togglePin(item.id)
                                        }}
                                    >
                                        {item.pinned ? t('pinned') : t('pin')}
                                    </Button>
                                    <Button
                                        startIcon={<BookmarkAddedIcon />}
                                        color="error"
                                        variant="outlined"
                                        onClick={() => {
                                            removeWithCleanup(item.id).catch((e) => {
                                                console.error('failed to remove item with cleanup', e)
                                            })
                                        }}
                                    >
                                        {t('unkeep')}
                                    </Button>
                                </ButtonGroup>
                            </Stack>
                        </Paper>
                    ))
                )}
            </Box>
        </Box>
    )
}
