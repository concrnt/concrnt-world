import { Alert, AlertTitle } from '@mui/material'
import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { string2Uint8Array } from '../../util'
import { enqueueSnackbar } from 'notistack'
import { DeriveIdentity, LoadSubKey } from '@concrnt/client'

function bufToHex(ab: ArrayBuffer): string {
    return Array.from(new Uint8Array(ab))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

export const ImportPasskey = (): JSX.Element => {
    const { t } = useTranslation('', { keyPrefix: 'import' })

    useEffect(() => {
        // receive passkey
        const run = async () => {
            const challenge = new Uint8Array(32)
            crypto.getRandomValues(challenge)
            const cred = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    rpId: window.location.hostname,
                    userVerification: 'required',
                    extensions: {
                        prf: {
                            eval: {
                                first: string2Uint8Array('concrnt-world-passkey')
                            }
                        }
                    }
                }
            })

            console.log('cred', cred)
            if (!cred) {
                console.error('Failed to get passkey')
                enqueueSnackbar('Failed to get passkey.', { variant: 'error' })
                return
            }

            // @ts-ignore
            const userHandle = cred.response?.userHandle
            if (!userHandle) {
                console.error('No user handle found in passkey response')
                enqueueSnackbar('No user handle found in passkey response.', { variant: 'error' })
                return
            }

            const domain = new TextDecoder().decode(userHandle)

            // @ts-ignore
            const credentialResults = cred.getClientExtensionResults()
            console.log('Credential Results:', credentialResults)
            const prfRes = credentialResults?.prf?.results
            if (prfRes?.first) {
                console.log('PRF First:', prfRes.first)
                const firstBuf = new Uint8Array(prfRes.first)
                console.log('source:', bufToHex(prfRes.first))

                const identity = DeriveIdentity(firstBuf)
                console.log('Derived Identity:', identity)

                const dummySubkeyStr = `concurrent-subkey ${identity.privateKey} -@${domain} -`
                const dummySubkey = LoadSubKey(dummySubkeyStr)

                if (!dummySubkey) {
                    console.error('Failed to load dummy subkey')
                    enqueueSnackbar('Failed to load dummy subkey.', { variant: 'error' })
                    return
                }

                const res = await fetch(`https://${domain}/api/v1/key/${dummySubkey.ckid}`, {})
                    .then((response) => response.json())
                    .catch((error) => {
                        console.error('Failed to fetch key:', error)
                        enqueueSnackbar('Failed to fetch key.', { variant: 'error' })
                        return null
                    })

                if (!res || !res.content || res.content.length === 0) {
                    console.error('Invalid response from server:', res)
                    enqueueSnackbar('Account not found.', { variant: 'error' })
                    return
                }

                const ccid = res.content[0].root
                const subkeyStr = `concurrent-subkey ${identity.privateKey} ${ccid}@${domain} -`

                localStorage.setItem('Domain', JSON.stringify(domain))
                localStorage.setItem('SubKey', JSON.stringify(subkeyStr))
                window.location.href = '/'
            } else {
                console.error('No PRF first result found')
                enqueueSnackbar('Provided passkey is not supported.', { variant: 'error' })
                return
            }
        }

        run()
    }, [])

    return (
        <>
            <Alert severity="info">
                <AlertTitle>{t('passkeyNoticeTitle')}</AlertTitle>
                {t('passkeyNoticeBody')}
            </Alert>

            <Alert severity="warning">
                <AlertTitle>{t('passkeyWarnTitle')}</AlertTitle>
                <Trans i18nKey="import.passkeyWarnBody" />
            </Alert>
        </>
    )
}
