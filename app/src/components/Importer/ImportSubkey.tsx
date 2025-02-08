import { Box, Button, CircularProgress, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Client } from '@concrnt/worldlib'

export const ImportSubkey = (): JSX.Element => {
    const { t } = useTranslation('', { keyPrefix: 'import' })

    const [subkey, setSubkey] = useState<string>('')
    const [subkeyDraft, setSubkeyDraft] = useState<string>('')
    const [showSecret, setShowSecret] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string>('')

    const [client, setClient] = useState<Client | null>(null)

    const [loading, setLoading] = useState<boolean>(false)

    const accountImport = (): void => {
        if (client) {
            localStorage.clear()
            localStorage.setItem('Domain', JSON.stringify(client.host))
            localStorage.setItem('SubKey', JSON.stringify(subkey))
            window.location.href = '/'
        }
    }

    const checkLogin = (subkey: string): void => {
        if (subkey.startsWith('concurrent-subkey')) {
            setLoading(true)
            Client.createFromSubkey(subkey)
                .then((client) => {
                    setClient(client)
                    setSubkey(subkey)
                })
                .catch((_e) => {
                    setErrorMessage('Invalid subkey')
                    setClient(null)
                })
                .finally(() => {
                    setLoading(false)
                })
        } else {
            setErrorMessage('Invalid subkey')
        }
    }

    return (
        <Box component="form" display="flex" flexDirection="column" gap={2}>
            <Typography variant="h3">{t('withSubkey')}</Typography>
            <TextField
                type={showSecret ? 'text' : 'password'}
                placeholder={'concurrent-subkey xxx CCxxx@example.com'}
                value={subkeyDraft}
                onChange={(e) => {
                    setSubkeyDraft(e.target.value)
                    checkLogin(e.target.value)
                }}
                onPaste={() => {
                    setShowSecret(false)
                }}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            {loading ? (
                                <CircularProgress color="primary" size={20} />
                            ) : (
                                <IconButton
                                    onClick={() => {
                                        setShowSecret(!showSecret)
                                    }}
                                    color="primary"
                                >
                                    {client ? <CheckCircleIcon /> : showSecret ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            )}
                        </InputAdornment>
                    )
                }}
            />
            {errorMessage}
            <Button disabled={!client} onClick={accountImport}>
                {t('import')}
            </Button>
        </Box>
    )
}
