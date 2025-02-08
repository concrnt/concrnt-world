import { List, ListItem, ListItemButton, ListItemText } from '@mui/material'
import { ListItemSubscriptionTree } from '../ui/ListItemSubscriptionTree'
import ListIcon from '@mui/icons-material/List'
import { useGlobalActions } from '../../context/GlobalActions'
import { useTranslation } from 'react-i18next'
import { usePreference } from '../../context/PreferenceContext'
import { Link as RouterLink } from 'react-router-dom'

export const ListsMenu = (): JSX.Element => {
    const { t } = useTranslation('', { keyPrefix: 'pages' })
    const { openMobileMenu } = useGlobalActions()
    const [lists] = usePreference('lists')
    return (
        <List
            dense
            sx={{
                py: 0.5,
                width: '100%'
            }}
        >
            <ListItem disablePadding>
                <ListItemButton sx={{ gap: 1 }} component={RouterLink} to="/subscriptions">
                    <ListIcon
                        sx={{
                            color: 'background.contrastText'
                        }}
                    />
                    <ListItemText primary={t('lists.title')} />
                </ListItemButton>
            </ListItem>
            {Object.keys(lists).map((key) => (
                <ListItemSubscriptionTree
                    key={key}
                    id={key}
                    body={lists[key]}
                    onClick={() => {
                        openMobileMenu(false)
                    }}
                />
            ))}
        </List>
    )
}
