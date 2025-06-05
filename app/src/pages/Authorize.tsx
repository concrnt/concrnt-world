import { Box, Button, Divider, Paper, Typography } from '@mui/material'
import { Link, useSearchParams } from 'react-router-dom'
import { useClient } from '../context/ClientContext'

import { GuestBase } from '../components/GuestBase'
import { MediaViewerProvider } from '../context/MediaViewer'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

export default function AuthorizePage(): JSX.Element {
    const { client } = useClient()
    const [searchParams] = useSearchParams()
    const app_name = searchParams.get('app_name')
    const redirect_url = searchParams.get('redirect_url')

    const { t } = useTranslation('', { keyPrefix: 'authorize' })

    return (
        <MediaViewerProvider>
            <>
                <Helmet>
                    <title>{'Authorize - Concrt'}</title>
                </Helmet>
                <GuestBase
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        gap: 1,
                        flex: 1
                    }}
                    additionalButton={
                        client ? (
                            <></>
                        ) : (
                            <Button component={Link} to="/import">
                                {t('importAccount')}
                            </Button>
                        )
                    }
                >
                    <Paper
                        sx={{
                            flex: 1,
                            margin: { xs: 0.5, sm: 1 },
                            mb: { xs: 0, sm: '10px' },
                            display: 'flex',
                            flexFlow: 'column',
                            borderRadius: 2,
                            overflow: 'hidden',
                            background: 'none'
                        }}
                    >
                        <Box
                            sx={{
                                width: '100%',
                                minHeight: '100%',
                                backgroundColor: 'background.paper',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                flex: 1,
                                padding: 2
                            }}
                        >
                            <Paper
                                variant="outlined"
                                sx={{
                                    padding: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2
                                }}
                            >
                                <Typography variant="h3">
                                    {t('loginAs', {
                                        appName: app_name || 'No Name',
                                        userName: client?.user?.profile?.username || 'Concrntユーザー'
                                    })}
                                </Typography>
                                {!client && <Typography>{t('loginRequired')}</Typography>}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 1
                                    }}
                                >
                                    <Button
                                        disabled={!client || !redirect_url}
                                        onClick={async () => {
                                            if (!client || !redirect_url) return
                                            const jwt = client.api.authProvider.issueJWT({
                                                aud: redirect_url,
                                                sub: 'CONCRNT_3RD_PARTY_AUTH'
                                            })
                                            const passport = await client.api.authProvider.getPassport()

                                            window.location.href = `${redirect_url}?jwt=${jwt}&passport=${passport}`
                                        }}
                                    >
                                        {t('login')}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            window.location.href = redirect_url || '/'
                                        }}
                                    >
                                        {t('cancel')}
                                    </Button>
                                </Box>
                                <Divider />
                                <Typography variant="caption">
                                    {t('loginNotice', {
                                        appName: app_name || 'このアプリケーション',
                                        userName: client?.user?.profile?.username || 'Concrntユーザー'
                                    })}
                                </Typography>
                            </Paper>
                        </Box>
                    </Paper>
                </GuestBase>
            </>
        </MediaViewerProvider>
    )
}
