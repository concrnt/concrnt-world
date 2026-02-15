import { useState } from 'react'
import {
    Box,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { CCDrawer } from './ui/CCDrawer'
import { useLibrary, type DisplayRule, type LibraryItem } from '../context/LibraryContext'
import { useTranslation } from 'react-i18next'

export interface KeepItemDrawerProps {
    item: LibraryItem | null
    onClose: () => void
}

const displayRuleOptions: DisplayRule[] = ['normal', 'blur', 'omit', 'hide']

export const KeepItemDrawer = ({ item, onClose }: KeepItemDrawerProps): JSX.Element => {
    const { folders, setFolder, setTags, setMemo, setDisplay } = useLibrary()
    const { t } = useTranslation('', { keyPrefix: 'pages.library' })
    const [tagInput, setTagInput] = useState('')

    if (!item) {
        return <CCDrawer open={false} onClose={onClose} />
    }

    const handleAddTag = (): void => {
        const trimmed = tagInput.trim()
        if (trimmed && !(item.tags ?? []).includes(trimmed)) {
            setTags(item.id, [...(item.tags ?? []), trimmed])
        }
        setTagInput('')
    }

    return (
        <CCDrawer open={!!item} onClose={onClose}>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">{t('edit')}</Typography>

                <FormControl size="small" fullWidth>
                    <InputLabel>{t('folder')}</InputLabel>
                    <Select
                        value={item.folderId ?? ''}
                        label={t('folder')}
                        onChange={(e) => {
                            const val = e.target.value
                            setFolder(item.id, val === '' ? undefined : val)
                        }}
                    >
                        <MenuItem value="">
                            <em>—</em>
                        </MenuItem>
                        {folders.map((folder) => (
                            <MenuItem key={folder.id} value={folder.id}>
                                {folder.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Box>
                    <Typography variant="subtitle2" gutterBottom>{t('tags')}</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 1 }}>
                        {(item.tags ?? []).map((tag) => (
                            <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                onDelete={() => {
                                    setTags(item.id, (item.tags ?? []).filter((t) => t !== tag))
                                }}
                            />
                        ))}
                    </Stack>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddTag()
                            }
                        }}
                    />
                </Box>

                <TextField
                    label={t('memo')}
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={5}
                    value={item.memo ?? ''}
                    onChange={(e) => setMemo(item.id, e.target.value || undefined)}
                />

                <FormControl size="small" fullWidth>
                    <InputLabel>{t('display')}</InputLabel>
                    <Select
                        value={item.display ?? 'normal'}
                        label={t('display')}
                        onChange={(e) => {
                            const val = e.target.value as DisplayRule
                            setDisplay(item.id, val === 'normal' ? undefined : val)
                        }}
                    >
                        {displayRuleOptions.map((rule) => (
                            <MenuItem key={rule} value={rule}>
                                {t(`display${rule.charAt(0).toUpperCase() + rule.slice(1)}`)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        </CCDrawer>
    )
}
