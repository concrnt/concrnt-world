import { Alert, Button, Tab, Tabs, Typography } from '@mui/material'
import SubkeyInfo from '../SubkeyInfo'
import { useState } from 'react'
import { ComputeCKID, GenerateIdentity } from '@concrnt/client'
import { useClient } from '../../context/ClientContext'
import { useTranslation } from 'react-i18next'

export function LoginQR(): JSX.Element {
    const { client } = useClient()
    const subkey = JSON.parse(localStorage.getItem('SubKey') || 'null')
    const [tab, setTab] = useState(subkey ? 0 : 1)

    const [generated, setGenerated] = useState<null | string>(null)

    const { t } = useTranslation('', { keyPrefix: 'settings.qr' })

    return (
        <>
            <Tabs
                value={tab}
                onChange={(_, newValue) => {
                    setTab(newValue)
                }}
            >
                <Tab label={t('showInstalled')} />
                <Tab label={t('createNew')} />
            </Tabs>
            {tab === 0 && (
                <>
                    {subkey && <SubkeyInfo subkey={subkey} />}
                    {!subkey && <p>{t('notLoggedInWithSubkey')}</p>}
                </>
            )}

            {tab === 1 && (
                <>
                    <Alert severity="warning">{t('tip1')}</Alert>

                    {generated ? (
                        <>
                            <SubkeyInfo subkey={generated} />
                        </>
                    ) : (
                        <Button
                            onClick={() => {
                                const newIdentity = GenerateIdentity()

                                const ckid = ComputeCKID(newIdentity.publicKey)

                                client.api
                                    .enactSubkey(ckid)
                                    .then(() => {
                                        const subkey = `concurrent-subkey ${newIdentity.privateKey} ${client.ccid}@${client.host} ${client.user?.profile?.username}`
                                        setGenerated(subkey)
                                    })
                                    .catch((e) => {
                                        console.error('error: ', e)
                                    })
                            }}
                        >
                            {t('createNewSubKey')}
                        </Button>
                    )}
                </>
            )}

            <Typography>{t('tip2')}</Typography>
        </>
    )
}
