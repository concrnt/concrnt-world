import { Avatar, Box } from '@mui/material'
import { usePreference } from '../../context/PreferenceContext'
import { Link as RouterLink } from 'react-router-dom'
import { useGlobalState } from '../../context/GlobalState'

export const MinimalListsMenu = (): JSX.Element => {
    const [lists] = usePreference('lists')
    const { listedSubscriptions } = useGlobalState()

    return (
        <Box
            sx={{
                width: '100%',
                display: 'flex',
                flexFlow: 'column',
                alignItems: 'center',
                gap: 1,
                p: 1
            }}
        >
            {Object.keys(lists).map((key) => {
                const iconURL = listedSubscriptions[key]?.parsedDoc?.body?.iconURL
                const name = listedSubscriptions[key]?.parsedDoc?.body?.name

                return (
                    <Avatar
                        key={key}
                        component={RouterLink}
                        to={`/#${key}`}
                        sx={{
                            textDecoration: 'none'
                        }}
                        src={iconURL}
                    >
                        {name?.[0] || '📝'}
                    </Avatar>
                )
            })}
        </Box>
    )
}
