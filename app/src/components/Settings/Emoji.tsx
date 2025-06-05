import {
    Box,
    Button,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    TextField,
    Typography
} from '@mui/material'
import { useEffect, useState } from 'react'

import { type EmojiPackage, type RawEmojiPackage } from '../../model'

import AddCircleIcon from '@mui/icons-material/AddCircle'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { useSnackbar } from 'notistack'
import { useLocation } from 'react-router-dom'

import { useTranslation } from 'react-i18next'
import { useEmojiPicker } from '../../context/EmojiPickerContext'

import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import CachedIcon from '@mui/icons-material/Cached'
import { useGlobalActions } from '../../context/GlobalActions'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'

export const EmojiSettings = (): JSX.Element => {
    const picker = useEmojiPicker()
    const path = useLocation()
    const actions = useGlobalActions()
    const { enqueueSnackbar } = useSnackbar()

    const [addingPackageURL, setAddingPackageURL] = useState<string>('')
    const [preview, setPreview] = useState<Partial<EmojiPackage> | null>(null)

    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
    const [selectedPackageURL, setSelectedPackageURL] = useState<null | string>(null)

    const { t } = useTranslation('', { keyPrefix: 'settings.emoji' })

    useEffect(() => {
        const emojiURL = path.hash.slice(1)
        if (emojiURL?.startsWith('http')) {
            setAddingPackageURL(emojiURL)
        }
    }, [path.hash])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (addingPackageURL) {
                fetch(addingPackageURL)
                    .then((j) => j.json())
                    .then((p: RawEmojiPackage) => {
                        setPreview({
                            ...p,
                            packageURL: addingPackageURL
                        })
                    })
                    .catch(() => {
                        setPreview(null)
                        enqueueSnackbar(t('packageNotFound'), { variant: 'error' })
                    })
            } else {
                setPreview(null)
            }
        }, 500)
        return () => {
            clearTimeout(timer)
        }
    }, [addingPackageURL])

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                <Typography variant="h3">{t('emojiPackage')}</Typography>
                <Button
                    onClick={() => {
                        Object.keys(localStorage)
                            .filter((k) => k.startsWith('emojiPackage:'))
                            .forEach((k) => {
                                localStorage.removeItem(k)
                            })
                        window.location.reload()
                    }}
                >
                    {t('updateAll')}
                </Button>
            </Box>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 2
                }}
            >
                {picker.packages.map((e) => {
                    return (
                        <Paper
                            key={e.iconURL}
                            variant="outlined"
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: '10px',
                                gap: 1,
                                height: '80px',
                                position: 'relative',
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                actions.openEmojipack(e)
                                // navigator.clipboard.writeText(e.packageURL)
                                // enqueueSnackbar(t('copied'), { variant: 'success' })
                            }}
                        >
                            <Box display="flex">
                                <Box component="img" src={e.iconURL} alt={e.name} height="60px" />
                            </Box>
                            <Box display="flex" flexDirection="column" flexGrow={1}>
                                <Typography variant="h4" gutterBottom>
                                    {e.name}
                                </Typography>
                                <Typography variant="caption">
                                    {t('fetchedAt', { date: e.fetchedAt && new Date(e.fetchedAt).toLocaleString() })}
                                </Typography>
                            </Box>
                            <IconButton
                                onClick={(a) => {
                                    a.stopPropagation()
                                    setMenuAnchor(a.currentTarget)
                                    setSelectedPackageURL(e.packageURL)
                                }}
                                sx={{}}
                            >
                                <MoreHorizIcon />
                            </IconButton>
                        </Paper>
                    )
                })}
            </Box>
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null)
                }}
            >
                <MenuItem
                    onClick={() => {
                        if (selectedPackageURL) picker.updateEmojiPackage(selectedPackageURL)
                        setMenuAnchor(null)
                    }}
                >
                    <ListItemIcon>
                        <CachedIcon sx={{ color: 'text.primary' }} />
                    </ListItemIcon>
                    <ListItemText>{t('update')}</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (selectedPackageURL) navigator.clipboard.writeText(selectedPackageURL)
                        enqueueSnackbar(t('copied'), { variant: 'success' })
                        setMenuAnchor(null)
                    }}
                >
                    <ListItemIcon>
                        <ContentPasteIcon sx={{ color: 'text.primary' }} />
                    </ListItemIcon>
                    <ListItemText>{t('copyURL')}</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (selectedPackageURL) picker.removeEmojiPackage(selectedPackageURL)
                        setMenuAnchor(null)
                    }}
                >
                    <ListItemIcon>
                        <DeleteForeverIcon sx={{ color: 'text.primary' }} />
                    </ListItemIcon>
                    <ListItemText>{t('delete')}</ListItemText>
                </MenuItem>
            </Menu>

            {preview && (
                <Paper
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: '10px',
                        gap: 1,
                        height: '80px',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box display="flex">
                        <Box component="img" src={preview.iconURL} alt={preview.name} height="60px" />
                    </Box>
                    <Typography variant="h4" gutterBottom>
                        {preview.name}
                    </Typography>
                    <IconButton
                        onClick={() => {
                            if (preview.packageURL) picker.addEmojiPackage(preview.packageURL)
                            setAddingPackageURL('')
                            setPreview(null)
                        }}
                    >
                        <AddCircleIcon />
                    </IconButton>
                </Paper>
            )}

            <TextField
                label={t('emojiPackageURL')}
                placeholder="https://example.com/emoji.zip"
                value={addingPackageURL}
                onChange={(e) => {
                    setAddingPackageURL(e.target.value)
                }}
            />
        </Box>
    )
}
