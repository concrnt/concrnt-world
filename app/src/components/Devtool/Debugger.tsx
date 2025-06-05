import { Box, Button, Typography } from '@mui/material'
import { forwardRef } from 'react'
import { useSnackbar } from 'notistack'
import { usePreference } from '../../context/PreferenceContext'
import { useTranslation } from 'react-i18next'

export const Debugger = forwardRef<HTMLDivElement>((props, ref): JSX.Element => {
    const { enqueueSnackbar } = useSnackbar()
    const { t } = useTranslation('', { keyPrefix: 'pages.devtool' })

    const [_progress, setProgress] = usePreference('tutorialProgress')

    return (
        <div ref={ref} {...props}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    height: '100%'
                }}
            >
                <Typography variant="h3">Debugger</Typography>

                <Typography variant="h4">Buttons</Typography>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '10px'
                    }}
                >
                    <Button
                        onClick={() => {
                            enqueueSnackbar(`Notification${Math.random()}`, {
                                variant: 'success'
                            })
                        }}
                    >
                        Show Notification
                    </Button>
                    <Button
                        onClick={() => {
                            setProgress(0)
                        }}
                    >
                        {t('resetTutorial')}
                    </Button>
                </Box>
            </Box>
        </div>
    )
})

Debugger.displayName = 'Debugger'
