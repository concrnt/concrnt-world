import { useCallback, useEffect, useState } from 'react'
import { Box, Button, Modal, Typography, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { type Identity } from '@concrnt/client'
import { TestMasterkey } from '../../SwitchMasterToSub'

export const LogoutButton = (): JSX.Element => {
    const [openLogoutModal, setOpenLogoutModal] = useState(false)
    const theme = useTheme()
    const navigate = useNavigate()

    const identity: Identity = JSON.parse(localStorage.getItem('Identity') || 'null')
    const [override, setOverride] = useState(false)

    const { t } = useTranslation('', { keyPrefix: 'pages.settings.actions' })

    const logout = (): void => {
        for (const key in localStorage) {
            localStorage.removeItem(key)
        }
        if (window.indexedDB) {
            window.indexedDB.deleteDatabase('concrnt-client')
        }
        setOpenLogoutModal(false)
        navigate('/welcome')
    }

    const onKeyDown = useCallback((e: KeyboardEvent): void => {
        if (e.key === 'Shift') {
            setOverride(true)
        }
    }, [])

    const onKeyUp = useCallback((e: KeyboardEvent): void => {
        if (e.key === 'Shift') {
            setOverride(false)
        }
    }, [])

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown)
        document.addEventListener('keyup', onKeyUp)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.removeEventListener('keyup', onKeyUp)
        }
    }, [])

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

                    {identity && !override ? (
                        <TestMasterkey identity={identity}>
                            {(testOK) => (
                                <Button
                                    color="error"
                                    disabled={!testOK}
                                    onClick={() => {
                                        logout()
                                    }}
                                >
                                    {t('logout')}
                                </Button>
                            )}
                        </TestMasterkey>
                    ) : (
                        <Button
                            color="error"
                            onClick={() => {
                                logout()
                            }}
                        >
                            {t('logout')}
                        </Button>
                    )}
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
