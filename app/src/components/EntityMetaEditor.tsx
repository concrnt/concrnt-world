import { useEffect, useState } from 'react'
import { useClient } from '../context/ClientContext'
import { CCEditor } from './ui/cceditor'
import { Button } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'

export const EntityMetaEditor = () => {
    const { client } = useClient()
    const { enqueueSnackbar } = useSnackbar()
    const { t } = useTranslation('', { keyPrefix: 'common' })

    const [meta, setMeta] = useState<any>(null)

    useEffect(() => {
        client.api.fetchWithCredential<any>(client.host, '/api/v1/entity/meta').then((res) => {
            setMeta(JSON.parse(res.content.info))
        })
    }, [])

    return meta ? (
        <>
            <CCEditor schemaURL={`https://${client.host}/register-template`} value={meta} setValue={setMeta} />
            <Button
                onClick={() => {
                    client.api
                        .fetchWithCredential<any>(client.host, '/api/v1/entity/meta', {
                            method: 'PUT',
                            body: JSON.stringify({
                                info: JSON.stringify(meta)
                            }),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                        .then((res) => {
                            console.log(res)
                            enqueueSnackbar(t('updated'), { variant: 'success' })
                        })
                }}
            >
                {t('update')}
            </Button>
        </>
    ) : (
        <>loading...</>
    )
}
