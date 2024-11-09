import { Alert, Box, Button, Divider, Paper, Typography } from '@mui/material'
import { GuestBase } from '../components/GuestBase'
import { ImportMasterKey } from '../components/Importer/ImportMasterkey'
import { Link } from 'react-router-dom'
import { ImportSubkey } from '../components/Importer/ImportSubkey'

import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import PasswordIcon from '@mui/icons-material/Password'
import { IconButtonWithLabel } from '../components/ui/IconButtonWithLabel'
import { useTranslation } from 'react-i18next'
import { Suspense, lazy, useState } from 'react'
import { Client } from '@concurrent-world/client'

const QRCodeReader = lazy(() => import('../components/ui/QRCodeReader'))

export function AccountImport(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'import' })

    const [importMode, setImportMode] = useState<'none' | 'scan' | 'manual'>('none')

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
                    はじめる
                </Button>
            }
        >
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
                    <Divider orientation="vertical">または</Divider>
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
                        <Alert severity="info">
                            {'ログイン用のQRコードは、ログイン済みのデバイスの「設定 > ログインQR」から取得できます。'}
                        </Alert>
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
                        <Divider>または</Divider>
                        <ImportSubkey />
                    </>
                )}
            </Paper>
        </GuestBase>
    )
}
