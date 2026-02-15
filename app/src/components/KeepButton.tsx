import { IconButton, Button, MenuItem, ListItemIcon, ListItemText, CircularProgress } from '@mui/material'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded'
import { useKeepToggle, type UseKeepToggleParams } from '../hooks/useKeepToggle'
import { useTranslation } from 'react-i18next'

export interface KeepButtonProps extends UseKeepToggleParams {
    variant: 'icon' | 'button' | 'menuItem'
    onAfterToggle?: () => void
}

export const KeepButton = ({ kind, itemRef, user, variant, onAfterToggle }: KeepButtonProps): JSX.Element => {
    const { isKept, keep, unkeep, loading } = useKeepToggle({ kind, itemRef, user })
    const { t } = useTranslation('', { keyPrefix: 'ui.messageActions' })

    const handleClick = (e?: React.MouseEvent): void => {
        e?.stopPropagation()
        if (loading) return
        if (isKept) {
            unkeep()
        } else {
            keep()
        }
        onAfterToggle?.()
    }

    const label = isKept ? t('unkeep') : t('keep')
    const Icon = isKept ? BookmarkAddedIcon : BookmarkAddIcon

    switch (variant) {
        case 'icon':
            return (
                <IconButton onClick={handleClick} size="small" color={isKept ? 'primary' : 'default'} disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : <Icon />}
                </IconButton>
            )
        case 'button':
            return (
                <Button
                    startIcon={loading ? <CircularProgress size={16} /> : <Icon />}
                    variant={isKept ? 'contained' : 'outlined'}
                    onClick={handleClick}
                    size="small"
                    disabled={loading}
                >
                    {label}
                </Button>
            )
        case 'menuItem':
            return (
                <MenuItem onClick={handleClick} disabled={loading}>
                    <ListItemIcon>
                        {loading ? <CircularProgress size={20} /> : <Icon sx={{ color: isKept ? 'primary.main' : 'text.primary' }} />}
                    </ListItemIcon>
                    <ListItemText>{label}</ListItemText>
                </MenuItem>
            )
    }
}
