import {
    Box,
    Button,
    IconButton,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    LinearProgress,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Typography
} from '@mui/material'

import { useMediaViewer } from '../../context/MediaViewer'

import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import CodeIcon from '@mui/icons-material/Code'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { useEffect, useState } from 'react'
import { useClient } from '../../context/ClientContext'
import { useTranslation } from 'react-i18next'

interface File {
    id: string
    url: string
    ownerId: string
    size: number
    cdate: string
}

interface FileResponse {
    content: File[]
    next?: string
    prev?: string
}

interface StorageUser {
    id: string
    totalBytes: number
    quota: number
    cdate: string
    mdate: string
}

export const MediaServerInventory = (): JSX.Element => {
    const { client } = useClient()
    const mediaViewer = useMediaViewer()
    const { t } = useTranslation('', { keyPrefix: 'settings.media' })

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [deleteMenu, setDeleteMenu] = useState<null | HTMLElement>(null)
    const [fileResponse, setFileResponse] = useState<FileResponse | null>(null)
    const [storageUser, setStorageUser] = useState<StorageUser | null>(null)

    const [itr, setItr] = useState<{ mode: 'before' | 'after'; cursor: string | null }>({
        mode: 'before',
        cursor: null
    })

    useEffect(() => {
        client.api.fetchWithCredential<StorageUser>(client.host, '/storage/user', {}).then((data) => {
            if (data) setStorageUser(data.content)
        })
    }, [])

    useEffect(() => {
        const url = itr.cursor ? `/storage/files?limit=9&${itr.mode}=${itr.cursor}` : '/storage/files?limit=9'
        client.api.fetchWithCredential<File[]>(client.host, url, {}).then((data) => {
            if (data) setFileResponse(data)
        })
    }, [itr])

    const usagePercentage = storageUser ? (storageUser.totalBytes / storageUser.quota) * 100 : 0
    const usageGB = storageUser ? storageUser.totalBytes / 1000 / 1000 / 1000 : 0
    const quotaGB = storageUser ? storageUser.quota / 1000 / 1000 / 1000 : 0

    const deleteFile = (id: string): void => {
        client.api
            .fetchWithCredential(client.host, `/storage/file/${id}`, {
                method: 'DELETE'
            })
            .then((_) => {
                setFileResponse({
                    content: fileResponse?.content.filter((e) => e.id !== id) ?? [],
                    next: fileResponse?.next,
                    prev: fileResponse?.prev
                })
            })
    }

    return (
        <>
            <Box>
                <Typography>{t('storageQuota')}</Typography>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <LinearProgress
                        variant="determinate"
                        value={usagePercentage}
                        sx={{
                            flex: 1
                        }}
                    />
                    <Typography>
                        {usageGB.toFixed(2)}GB / {quotaGB.toFixed(2)}GB
                    </Typography>
                </Box>
            </Box>
            <ImageList cols={3} gap={8}>
                {(fileResponse?.content ?? []).map((file) => (
                    <ImageListItem
                        key={file.id}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                            mediaViewer.openSingle(file.url)
                        }}
                    >
                        <Box
                            sx={{
                                width: '100%',
                                height: '300px',
                                backgroundImage: `url(${file.url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                        <ImageListItemBar
                            title={file.id}
                            subtitle={file.cdate}
                            actionIcon={
                                <IconButton
                                    sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                    onClick={(e) => {
                                        setSelectedFile(file)
                                        setDeleteMenu(e.currentTarget)
                                        e.stopPropagation()
                                    }}
                                >
                                    <MoreHorizIcon />
                                </IconButton>
                            }
                        />
                    </ImageListItem>
                ))}
            </ImageList>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1em'
                }}
            >
                <Button
                    onClick={() => {
                        setItr({ mode: 'after', cursor: fileResponse?.prev ?? null })
                    }}
                    disabled={!fileResponse?.prev}
                >
                    prev
                </Button>
                <Button
                    onClick={() => {
                        setItr({ mode: 'before', cursor: fileResponse?.next ?? null })
                    }}
                    disabled={!fileResponse?.next}
                >
                    next
                </Button>
            </Box>
            <Menu
                anchorEl={deleteMenu}
                open={Boolean(deleteMenu)}
                onClose={() => {
                    setDeleteMenu(null)
                }}
            >
                <MenuItem
                    onClick={() => {
                        navigator.clipboard.writeText(selectedFile?.url || '')
                        setDeleteMenu(null)
                    }}
                >
                    <ListItemIcon>
                        <ContentPasteIcon />
                    </ListItemIcon>
                    <ListItemText>{t('copyImageURL')}</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        navigator.clipboard.writeText(`![${selectedFile?.id}](${selectedFile?.url})`)
                        setDeleteMenu(null)
                    }}
                >
                    <ListItemIcon>
                        <CodeIcon />
                    </ListItemIcon>
                    <ListItemText>{t('copyMarkdownCode')}</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        selectedFile && deleteFile(selectedFile.id)
                        setDeleteMenu(null)
                    }}
                >
                    <ListItemIcon>
                        <DeleteForeverIcon />
                    </ListItemIcon>
                    <ListItemText>{t('deleteCompletely')}</ListItemText>
                </MenuItem>
            </Menu>
        </>
    )
}
