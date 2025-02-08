import { Box, Button, Grid, Paper, Typography } from '@mui/material'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function SecretCode(props: { mnemonic: string }): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'ui.secret' })
    const [reveal, setReveal] = useState(false)
    return (
        <Box>
            <Paper
                variant="outlined"
                component={Grid}
                style={{
                    width: '100%',
                    margin: 1,
                    position: 'relative',
                    overflow: 'hidden'
                }}
                spacing={1}
                columns={4}
                container
            >
                {props.mnemonic.split(' ').map((e, i) => (
                    <Grid
                        key={i}
                        item
                        xs={2}
                        sm={1}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            padding: '5px'
                        }}
                    >
                        {i + 1}:
                        <Paper
                            variant="outlined"
                            sx={{ display: 'inline-block', padding: '5px', width: '100%', textAlign: 'center' }}
                        >
                            {reveal ? e : 'xxxxx'}
                        </Paper>
                    </Grid>
                ))}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '10px'
                }}
            >
                <Button
                    onClick={() => {
                        navigator.clipboard.writeText(props.mnemonic)
                    }}
                    startIcon={<ContentPasteIcon />}
                >
                    {t('copy')}
                </Button>
            </Box>
        </Box>
    )
}
