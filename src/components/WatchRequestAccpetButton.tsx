import { type Association, type ReadAccessRequestAssociationSchema, type Timeline } from '@concurrent-world/client'
import { CCAvatar } from './ui/CCAvatar'
import { Box, Button } from '@mui/material'
import { useClient } from '../context/ClientContext'
import { useState } from 'react'
import { useSnackbar } from 'notistack'

interface WatchRequestAcceptButtonProps {
    request: Association<ReadAccessRequestAssociationSchema>
    targetTimeline: Timeline<any>
    onAccept?: () => void
    noAvatar?: boolean
}

export const WatchRequestAcceptButton = (props: WatchRequestAcceptButtonProps): JSX.Element => {
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
                        enqueueSnackbar('無視しました', { variant: 'success' })
                        props.onAccept?.()
                    })
                }}
            >
                無視
            </Button>
            <Button
                disabled={working}
                onClick={() => {
                    if (!target.policyParams) return
                    setWorking(true)
                    const currentPolicy = target.policyParams
                    currentPolicy.reader.push(requester.ccid)
                    client.api
                        .upsertTimeline(target.schema, target.document.body, {
                            id: props.targetTimeline.id.split('@')[0],
                            indexable: target.indexable,
                            policy: target.policy,
                            policyParams: JSON.stringify(currentPolicy)
                        })
                        .then(() => {
                            props.request.delete().then(() => {
                                target.invalidate()
                                enqueueSnackbar('更新しました', { variant: 'success' })
                                props.onAccept?.()
                            })
                        })
                }}
            >
                閲覧者に追加
            </Button>
        </Box>
    )
}
