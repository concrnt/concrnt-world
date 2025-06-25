import { Alert, Box, Button, Divider, Paper, Typography } from '@mui/material'
import { GuestBase } from '../components/GuestBase'
import { ImportMasterKey } from '../components/Importer/ImportMasterkey'
import { Link } from 'react-router-dom'
import { ImportSubkey } from '../components/Importer/ImportSubkey'

import { IconButtonWithLabel } from '../components/ui/IconButtonWithLabel'
import { useTranslation } from 'react-i18next'
import { Suspense, lazy, useState } from 'react'
import { Client } from '@concrnt/worldlib'
import { Helmet } from 'react-helmet-async'

import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import PasswordIcon from '@mui/icons-material/Password'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import { ImportPasskey } from '../components/Importer/ImportPasskey'

const QRCodeReader = lazy(() => import('../components/ui/QRCodeReader'))

export default function AccountImport(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'import' })

    const [importMode, setImportMode] = useState<'none' | 'scan' | 'passkey' | 'manual'>('none')

    return (
        <GuestBase
            sx={{
                padding: 2,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                gap: 2
            }}
            additionalButton={
                <Button component={Link} to="/register">
                    {t('getStarted')}
                </Button>
            }
        >
            <Helmet>
                <meta name="robots" content="noindex" />
            </Helmet>
            <Paper
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    padding: '20px',
                    flex: 1,
                    gap: '20px'
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 2,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <IconButtonWithLabel
                        icon={QrCodeScannerIcon}
                        label={t('scan')}
                        onClick={() => {
                            setImportMode('scan')
                        }}
                    />
                    <Typography>{t('or')}</Typography>
                    <IconButtonWithLabel
                        icon={VpnKeyIcon}
                        label={t('passkey')}
                        onClick={() => {
                            setImportMode('passkey')
                        }}
                    />
                    <Typography>{t('or')}</Typography>
                    <IconButtonWithLabel
                        icon={PasswordIcon}
                        label={t('manual')}
                        onClick={() => {
                            setImportMode('manual')
                        }}
                    />
                </Box>

                {importMode === 'scan' && (
                    <>
                        <Alert severity="info">{t('qrHint')}</Alert>
                        <Suspense fallback={<Typography>loading...</Typography>}>
                            <QRCodeReader
                                onRead={(result) => {
                                    try {
                                        Client.createFromSubkey(result).then((client) => {
                                            localStorage.setItem('Domain', JSON.stringify(client.host))
                                            localStorage.setItem('SubKey', JSON.stringify(result))
                                            window.location.href = '/'
                                        })
                                    } catch (e) {
                                        console.error(e)
                                    }
                                }}
                            />
                        </Suspense>
                    </>
                )}
                {importMode === 'manual' && (
                    <>
                        <ImportMasterKey />
                        <Divider>{t('or')}</Divider>
                        <ImportSubkey />
                    </>
                )}
                {importMode === 'passkey' && <ImportPasskey />}
            </Paper>
        </GuestBase>
    )
}
