import { type Association, type ReadAccessRequestAssociationSchema, Schemas, type Timeline } from '@concrnt/worldlib'
import LockIcon from '@mui/icons-material/Lock'
import { useEffect, useMemo, useState } from 'react'
import { useClient } from '../context/ClientContext'
import { Box, Button, type SxProps, Tooltip, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface PrivateTimelineDoorProps {
    timeline: Timeline<any>
    sx?: SxProps
}

export const PrivateTimelineDoor = (props: PrivateTimelineDoorProps): JSX.Element => {
    const { client } = useClient()

    const { t } = useTranslation('', { keyPrefix: 'ui.privateTimeline' })

    const [associations, setAssociations] = useState<Array<Association<any>>>([])
    const [update, setUpdate] = useState<number>(0)

    const myRequest = useMemo(() => {
        return associations.find((assoc) => {
            return assoc.schema === Schemas.readAccessRequestAssociation && assoc.author === client.ccid
        })
    }, [associations])

    useEffect(() => {
        props.timeline.getAssociations().then((assocs) => {
            setAssociations(assocs)
        })
    }, [props.timeline, update])

    const requestable = props.timeline.policy.isRequestable()

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                ...props.sx
            }}
        >
            <LockIcon
                sx={{
                    fontSize: '10rem'
                }}
            />
            <Typography variant="h5">{t('isPrivate')}</Typography>
            <Tooltip title={requestable ? '' : t('notRequestable')}>
                <Box>
                    <Button
                        disabled={!requestable}
                        variant={myRequest ? 'outlined' : 'contained'}
                        onClick={() => {
                            if (myRequest) {
                                myRequest.delete().then(() => {
                                    setUpdate((prev) => prev + 1)
                                })
                            } else {
                                const id = props.timeline.id.split('@')[0]
                                client.api
                                    .createAssociation<ReadAccessRequestAssociationSchema>(
                                        Schemas.readAccessRequestAssociation,
                                        {},
                                        id,
                                        props.timeline.author,
                                        ['world.concrnt.t-notify@' + props.timeline.author]
                                    )
                                    .then(() => {
                                        setUpdate((prev) => prev + 1)
                                    })
                            }
                        }}
                    >
                        {myRequest ? t('requested') : t('request')}
                    </Button>
                </Box>
            </Tooltip>
        </Box>
    )
}
