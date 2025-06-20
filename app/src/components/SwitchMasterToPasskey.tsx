import { ComputeCKID, DeriveIdentity } from '@concrnt/client'
import { useClient } from '../context/ClientContext'
import { string2Uint8Array } from '../util'
import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function SwitchMasterToPasskey(): JSX.Element {
    const { client } = useClient()
    const [success, setSuccess] = useState<boolean | undefined>()

    const { t } = useTranslation('', { keyPrefix: 'settings.identity.passkey' })

    const registerPasskey = async () => {
        const challenge = new Uint8Array(32)
        crypto.getRandomValues(challenge)
        const cred = await navigator.credentials.create({
            publicKey: {
                challenge: challenge,
                rp: {
                    name: 'concrnt.world',
                    id: window.location.hostname
                },
                pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
                user: {
                    id: string2Uint8Array(client.host),
                    name: client.ccid ?? 'unknown',
                    displayName: client.user?.profile?.username || 'anonymous'
                },
                authenticatorSelection: {
                    userVerification: 'required',
                    residentKey: 'required'
                },
                extensions: {
                    prf: {
                        eval: {
                            first: string2Uint8Array('concrnt-world-passkey')
                        }
                    }
                }
            }
        })

        if (!cred) {
            setSuccess(false)
            return
        }

        //@ts-ignore
        const credentialResults = cred.getClientExtensionResults()
        console.log('Credential Results:', credentialResults)

        const prfRes = credentialResults?.prf?.results
        if (prfRes?.first) {
            console.log('PRF First:', prfRes.first)

            const firstBuf = new Uint8Array(prfRes.first)
            const identity = DeriveIdentity(firstBuf)

            const ckid = ComputeCKID(identity.publicKey)

            client.api
                .enactSubkey(ckid)
                .then(() => {
                    const subkey = `concurrent-subkey ${identity.privateKey} ${client.ccid}@${client.host} ${client.user?.profile?.username}`
                    localStorage.setItem('SubKey', JSON.stringify(subkey))
                    localStorage.removeItem('Identity')
                    localStorage.removeItem('PrivateKey')
                    setSuccess(true)
                })
                .catch((e) => {
                    console.error('error: ', e)
                    setSuccess(false)
                })
        } else {
            console.error('PRF First not available')
            setSuccess(false)
        }
    }

    return (
        <Box display="flex" flexDirection="column" flex={1} gap={1}>
            <Typography variant="h2">{t('register')}</Typography>

            {success === true ? (
                <>
                    <Alert severity="success">
                        <AlertTitle>{t('completed')}</AlertTitle>
                        {t('completedDesc')}
                    </Alert>
                    <Button onClick={() => window.location.reload()}>{t('clickToFinish')}</Button>
                </>
            ) : success === false ? (
                <>
                    <Alert severity="error">
                        <AlertTitle>{t('failed')}</AlertTitle>
                        {t('failedDesc')}
                    </Alert>
                </>
            ) : (
                <>
                    <Alert severity="warning">
                        <AlertTitle>{t('warnTitle')}</AlertTitle>
                        {t('warnDesc')}
                    </Alert>

                    <Typography>{t('desc')}</Typography>

                    <Button variant="contained" color="primary" onClick={registerPasskey}>
                        {t('register')}
                    </Button>
                </>
            )}
        </Box>
    )
}
