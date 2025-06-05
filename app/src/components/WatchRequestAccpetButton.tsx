import { type Association, type ReadAccessRequestAssociationSchema, type Timeline } from '@concrnt/worldlib'
import { CCAvatar } from './ui/CCAvatar'
import { Box, Button } from '@mui/material'
import { useClient } from '../context/ClientContext'
import { useState } from 'react'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'

interface WatchRequestAcceptButtonProps {
    request: Association<ReadAccessRequestAssociationSchema>
    targetTimeline: Timeline<any>
    onAccept?: () => void
    noAvatar?: boolean
}

export const WatchRequestAcceptButton = (props: WatchRequestAcceptButtonProps): JSX.Element => {
    const { t } = useTranslation('', { keyPrefix: 'common' })

    const { client } = useClient()
    const { enqueueSnackbar } = useSnackbar()
    const requester = props.request.authorUser
    const target = props.targetTimeline
    const [working, setWorking] = useState(false)
    if (!requester || !target) return <></>
    return (
        <Box display="flex" alignItems="center" gap={1}>
            {!props.noAvatar && (
                <>
                    <CCAvatar avatarURL={requester.profile?.avatar} identiconSource={requester.ccid} />
                    {requester.profile?.username}
                </>
            )}
            <Box flex={1} />
            <Button
                disabled={working}
                color="error"
                onClick={() => {
                    setWorking(true)
                    props.request.delete().then(() => {
                        enqueueSnackbar(t('ignored'), { variant: 'success' })
                        props.onAccept?.()
                    })
                }}
            >
                {t('ignore')}
            </Button>
            <Button
                disabled={working}
                onClick={() => {
                    setWorking(true)
                    client.api
                        .upsertTimeline(target.schema, target.document.body, {
                            id: props.targetTimeline.id.split('@')[0],
                            indexable: target.indexable,
                            policy: target.policy.getPolicySchemaURL(),
                            policyParams: JSON.stringify(
                                target.policy.copyWithAddReaders([requester.ccid]).getPolicyParams()
                            )
                        })
                        .then(() => {
                            props.request.delete().then(() => {
                                target.invalidate()
                                enqueueSnackbar(t('updated'), { variant: 'success' })
                                props.onAccept?.()
                            })
                        })
                }}
            >
                {t('addToViewer')}
            </Button>
        </Box>
    )
}
