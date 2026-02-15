import { useState } from 'react'
import {
    Box,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemText,
    TextField,
    Typography
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import AddIcon from '@mui/icons-material/Add'
import { useLibrary } from '../context/LibraryContext'
import { useTranslation } from 'react-i18next'

export const FolderManager = (): JSX.Element => {
    const { folders, addFolder, removeFolder, renameFolder } = useLibrary()
    const { t } = useTranslation('', { keyPrefix: 'pages.library' })
    const [newFolderName, setNewFolderName] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')

    const handleAdd = (): void => {
        const trimmed = newFolderName.trim()
        if (trimmed) {
            addFolder(trimmed)
            setNewFolderName('')
        }
    }

    const handleStartEdit = (folderId: string, currentName: string): void => {
        setEditingId(folderId)
        setEditingName(currentName)
    }

    const handleFinishEdit = (): void => {
        if (editingId && editingName.trim()) {
            renameFolder(editingId, editingName.trim())
        }
        setEditingId(null)
        setEditingName('')
    }

    const sorted = [...folders].sort((a, b) => a.order - b.order)

    return (
        <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {t('manageFolders')}
            </Typography>
            <List dense>
                {sorted.map((folder) => (
                    <ListItem
                        key={folder.id}
                        secondaryAction={
                            <Box>
                                {editingId === folder.id ? (
                                    <IconButton size="small" onClick={handleFinishEdit}>
                                        <CheckIcon fontSize="small" />
                                    </IconButton>
                                ) : (
                                    <IconButton size="small" onClick={() => handleStartEdit(folder.id, folder.name)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                )}
                                <IconButton size="small" onClick={() => removeFolder(folder.id)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        }
                    >
                        {editingId === folder.id ? (
                            <TextField
                                size="small"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFinishEdit()
                                }}
                                autoFocus
                            />
                        ) : (
                            <ListItemText primary={folder.name} />
                        )}
                    </ListItem>
                ))}
            </List>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField
                    size="small"
                    placeholder={t('addFolder')}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd()
                    }}
                    fullWidth
                />
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    disabled={!newFolderName.trim()}
                >
                    {t('addFolder')}
                </Button>
            </Box>
        </Box>
    )
}
