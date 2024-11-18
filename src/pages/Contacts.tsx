import { Box, Divider, Typography } from '@mui/material'
import { AckList } from '../components/AckList'
import { useClient } from '../context/ClientContext'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'

export function ContactsPage(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'pages.contacts' })
    const { client } = useClient()

    useEffect(() => {
        document.title = t('title') + ' - Concrnt'
    })

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '100%',
                backgroundColor: 'background.paper',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box
                sx={{
                    paddingX: 1,
                    paddingTop: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                <Typography variant="h2">{t('title')}</Typography>
                <Divider />
                {client.user && <AckList initmode={'acking'} user={client.user} />}
            </Box>
        </Box>
    )
}
