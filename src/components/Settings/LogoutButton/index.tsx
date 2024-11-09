import { useState } from 'react'
import { Box, Button, Modal, Typography, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const LogoutButton = (): JSX.Element => {
    const [openLogoutModal, setOpenLogoutModal] = useState(false)
    const theme = useTheme()
    const navigate = useNavigate()

    const { t } = useTranslation('', { keyPrefix: 'pages.settings.actions' })

    const logout = (): void => {
        for (const key in localStorage) {
            localStorage.removeItem(key)
        }
    }

    return (
        <>
            <Modal
                open={openLogoutModal}
                onClose={() => {
                    setOpenLogoutModal(false)
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        transform: 'translate(-50%, -50%)',
                        flexDirection: 'column',
                        gap: '20px',
                        position: 'absolute',
                        padding: '20px',
                        borderRadius: '10px',
                        top: '50%',
                        left: '50%',
                        width: '80vw',
                        background: theme.palette.background.paper
                    }}
                >
                    <Typography component="h2" sx={{ color: theme.palette.text.primary }}>
                        {t('areYouSure')}
                    </Typography>
                    <Typography sx={{ color: theme.palette.text.primary }}>{t('logoutWarn')}</Typography>
                    <Button
                        color="error"
                        onClick={() => {
                            logout()
                            setOpenLogoutModal(false)
                            navigate('/welcome')
                        }}
                    >
                        {t('logout')}
                    </Button>
                </Box>
            </Modal>
            <Button
                sx={{ borderRadius: '100px' }}
                color="error"
                onClick={(_) => {
                    setOpenLogoutModal(true)
                }}
            >
                {t('logout')}
            </Button>
        </>
    )
}
