import { Box, Divider, Paper, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCode } from 'react-qrcode-logo'
import { enqueueSnackbar } from 'notistack'
import { CCIconButton } from './ui/CCIconButton'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'

export default function SubkeyInfo(props: { subkey: string }): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'ui.secret' })
    const [reveal, setReveal] = useState(false)

    return (
        <Paper
            variant="outlined"
            style={{
                width: '100%',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    padding: '10px',
                    paddingTop: {
                        xs: '50px',
                        sm: '50px',
                        md: '10px'
                    },
                    display: 'flex',
                    flexDirection: {
                        xs: 'column',
                        sm: 'column',
                        md: 'row'
                    },
                    flexFlow: {
                        xs: 'column-reverse',
                        sm: 'column-reverse',
                        md: 'row'
                    },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                }}
            >
                <Typography
                    variant="h5"
                    style={{
                        flex: '1',
                        wordBreak: 'break-all'
                    }}
                >
                    {props.subkey}
                </Typography>
                <CCIconButton
                    onClick={() => {
                        try {
                            navigator.clipboard.writeText(JSON.parse(localStorage.getItem('SubKey')!))
                            enqueueSnackbar('Copied', { variant: 'info' })
                        } catch (e) {
                            enqueueSnackbar('No SubKey found', { variant: 'error' })
                        }
                    }}
                >
                    <ContentPasteIcon
                        sx={{
                            color: 'text.primary'
                        }}
                    />
                </CCIconButton>

                <Divider orientation="vertical" />
                <Box
                    style={{
                        width: '150px',
                        height: '150px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'white',
                        padding: '5px'
                    }}
                >
                    <QRCode
                        value={props.subkey}
                        size={1000}
                        ecLevel="L"
                        style={{
                            width: '100%',
                            height: '100%'
                        }}
                    />
                </Box>
            </Box>

            <Box
                sx={{
                    position: 'absolute',
                    backgroundColor: 'text.primary',
                    color: 'background.paper',
                    padding: '3px 10px',
                    cursor: 'pointer',
                    display: reveal ? 'block' : 'none',
                    borderRadius: '0 0 4px 4px',
                    width: 'fit-content',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)'
                }}
                onClick={() => {
                    setReveal(false)
                }}
            >
                {t('close')}
            </Box>

            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    display: reveal ? 'none' : 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer'
                }}
                onClick={() => {
                    setReveal(true)
                }}
            >
                <Typography variant="h3">{t('clickToReveal')}</Typography>
                <Typography variant="caption">{t('warn')}</Typography>
            </Box>
        </Paper>
    )
}
