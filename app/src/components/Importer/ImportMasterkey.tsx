import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { Client } from '@concrnt/worldlib'
import {
    LoadKey,
    ComputeCCID,
    IsValid256k1PrivateKey,
    type KeyPair,
    LoadKeyFromMnemonic,
    LoadIdentity,
    GenerateIdentity,
    ComputeCKID
} from '@concrnt/client'

import { Box, IconButton, InputAdornment } from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useTranslation } from 'react-i18next'

export function ImportMasterKey(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'import' })

    const [secretInput, setSecretInput] = useState<string>('')
    const [showSecret, setShowSecret] = useState<boolean>(false)
    const [domainInput, setDomainInput] = useState<string>('')
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [registrationOK, setRegistrationOK] = useState<boolean>(false)
    const [domainAutoDetectionFailed, setDomainAutoDetectionFailed] = useState<boolean>(false)

    let [logining, setLogining] = useState<boolean>(false)

    const keypair: KeyPair | null = useMemo(() => {
        if (secretInput.length === 0) return null
        if (IsValid256k1PrivateKey(secretInput)) return LoadKey(secretInput)

        return LoadKeyFromMnemonic(secretInput)
    }, [secretInput])

    const ccid = useMemo(() => {
        if (!keypair) return ''
        console.log('ckid', ComputeCKID(keypair.publickey))
        return ComputeCCID(keypair.publickey)
    }, [keypair])

    // suggest
    useEffect(() => {
        if (!keypair || !ccid) return
        const searchTarget = 'ariake.concrnt.net'

        const timer = setTimeout(() => {
            try {
                Client.createAsGuest(searchTarget).then((client) => {
                    client.api
                        .getEntity(ccid, searchTarget)
                        .then((entity) => {
                            setDomainInput(entity.domain)
                            setErrorMessage('')
                        })
                        .catch((_) => {
                            setDomainAutoDetectionFailed(true)
                            setErrorMessage(t('notFound'))
                        })
                })
            } catch (e) {
                console.error(e)
            }
        }, 300)

        return () => {
            clearTimeout(timer)
        }
    }, [keypair])

    useEffect(() => {
        if (!domainInput || !keypair || !ccid) return
        const timer = setTimeout(() => {
            try {
                Client.create(keypair.privatekey, domainInput).then((client) => {
                    client.api
                        .fetchWithCredential(domainInput, '/api/v1/entity', {})
                        .then((_) => {
                            setErrorMessage('')
                            setRegistrationOK(true)
                        })
                        .catch((_) => {
                            setRegistrationOK(false)
                        })
                })
            } catch (e) {
                console.error(e)
            }
        }, 300)
        return () => {
            clearTimeout(timer)
        }
    }, [domainInput])

    const accountImport = (): void => {
        localStorage.clear()
        localStorage.setItem('Domain', JSON.stringify(domainInput))
        localStorage.setItem('PrivateKey', JSON.stringify(keypair?.privatekey))
        const normalized = secretInput.trim().normalize('NFKD')
        if (normalized.split(' ').length === 12) {
            localStorage.setItem('Identity', JSON.stringify(LoadIdentity(normalized)))
        }
        window.location.href = '/'
    }

    const accountImportWithSubkey = async (): Promise<void> => {
        if (logining) return
        if (!keypair || !ccid) return
        setLogining((logining = true))

        const client = await Client.create(keypair.privatekey, domainInput)

        const newIdentity = GenerateIdentity()
        const ckid = ComputeCKID(newIdentity.publicKey)

        client.api
            .enactSubkey(ckid)
            .then(() => {
                localStorage.clear()
                const subkey = `concurrent-subkey ${newIdentity.privateKey} ${client.ccid}@${client.host} ${client.user?.profile?.username}`
                localStorage.setItem('Domain', JSON.stringify(domainInput))
                localStorage.setItem('SubKey', JSON.stringify(subkey))
                window.location.href = '/'
            })
            .catch((e) => {
                console.error('error: ', e)
            })
            .finally(() => {
                setLogining((logining = false))
            })
    }

    return (
        <Box component="form" display="flex" flexDirection="column" gap={2}>
            <Typography variant="h3">{t('input')}</Typography>
            <TextField
                type={showSecret ? 'text' : 'password'}
                placeholder={t('secretPlaceholder')}
                value={secretInput}
                onChange={(e) => {
                    setSecretInput(e.target.value)
                }}
                disabled={!!keypair}
                onFocus={() => {
                    setShowSecret(true)
                }}
                onPaste={() => {
                    setShowSecret(false)
                }}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => {
                                    setShowSecret(!showSecret)
                                }}
                                color="primary"
                            >
                                {keypair ? <CheckCircleIcon /> : showSecret ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    )
                }}
                helperText={t('masterKeyDesc')}
            />
            {keypair && (
                <Typography sx={{ wordBreak: 'break-all' }}>
                    {t('welcome')}: {ccid}
                </Typography>
            )}
            {domainAutoDetectionFailed && (
                <TextField
                    placeholder="example.tld"
                    label={t('domain')}
                    value={domainInput}
                    onChange={(e) => {
                        setDomainInput(e.target.value)
                    }}
                />
            )}
            {errorMessage}
            <Box display="flex" flexDirection="row" justifyContent="flex-end" alignItems="center" gap={1}>
                <Button
                    variant="text"
                    color="error"
                    disabled={!keypair || !registrationOK || logining}
                    onClick={accountImport}
                >
                    {t('privLogin')}
                </Button>
                <Button disabled={!keypair || !registrationOK || logining} onClick={accountImportWithSubkey}>
                    {t('normalLogin')}
                </Button>
            </Box>
        </Box>
    )
}
