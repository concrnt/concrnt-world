import { useState } from 'react'
import {
    Box,
    Button,
    FormControl,
    IconButton,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useLibrary, type DisplayRule } from '../context/LibraryContext'
import { useTranslation } from 'react-i18next'

const displayRuleOptions: DisplayRule[] = ['normal', 'blur', 'omit', 'hide']

export const TagRuleManager = (): JSX.Element => {
    const { tagRules, addTagRule, removeTagRule, updateTagRule } = useLibrary()
    const { t } = useTranslation('', { keyPrefix: 'pages.library' })
    const [newTag, setNewTag] = useState('')

    const handleAdd = (): void => {
        const trimmed = newTag.trim()
        if (trimmed) {
            addTagRule(trimmed, 'normal')
            setNewTag('')
        }
    }

    return (
        <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {t('tagRules')}
            </Typography>
            <List dense>
                {tagRules.map((rule) => (
                    <ListItem
                        key={rule.tag}
                        secondaryAction={
                            <IconButton size="small" onClick={() => removeTagRule(rule.tag)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        }
                    >
                        <ListItemText primary={rule.tag} sx={{ mr: 2 }} />
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                                value={rule.display ?? 'normal'}
                                onChange={(e) => {
                                    const val = e.target.value as DisplayRule
                                    updateTagRule(rule.tag, val === 'normal' ? undefined : val)
                                }}
                            >
                                {displayRuleOptions.map((opt) => (
                                    <MenuItem key={opt} value={opt}>
                                        {t(`display${opt.charAt(0).toUpperCase() + opt.slice(1)}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </ListItem>
                ))}
            </List>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField
                    size="small"
                    placeholder="Tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
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
                    disabled={!newTag.trim()}
                >
                    Add
                </Button>
            </Box>
        </Box>
    )
}
