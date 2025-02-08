import { Box, Divider, Typography } from '@mui/material'
import { AckList } from '../components/AckList'
import { useClient } from '../context/ClientContext'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'

export function ContactsPage(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'pages.contacts' })
    const { client } = useClient()

    return (
        <>
            <Helmet>
                <title>{t('title')} - Concrnt</title>
                <meta name="description" content={t('description')} />
            </Helmet>
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
        </>
    )
}
