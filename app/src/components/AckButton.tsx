import { Button } from '@mui/material'
import { useMemo, useState } from 'react'
import { type User } from '@concrnt/worldlib'
import { useTranslation } from 'react-i18next'
import { useClient } from '../context/ClientContext'
import { useManagedOperations } from '../hooks/useManagedOperations'

export interface AckButtonProps {
    user: User
    managed?: boolean
}

export const AckButton = (props: AckButtonProps): JSX.Element | null => {
    const { client, forceUpdate } = useClient()
    const managedOps = useManagedOperations()

    const myAck = useMemo(() => {
        return client.ackings?.find((ack) => ack.ccid === props.user.ccid)
    }, [client, forceUpdate, props.user.ccid])

    const [isHovered, setIsHovered] = useState(false)

    const { t } = useTranslation('', { keyPrefix: 'common' })

    if (props.user.ccid === client.ccid) {
        return null
    }

    return (
        <>
            <Button
                sx={{
                    flexShrink: 0
                }}
                variant={myAck ? 'outlined' : 'contained'}
                onMouseEnter={() => {
                    setIsHovered(true)
                }}
                onMouseLeave={() => {
                    setIsHovered(false)
                }}
                onClick={(e) => {
                    e.stopPropagation()
                    if (myAck) {
                        if (props.managed) {
                            managedOps.unackManaged(props.user)
                        } else {
                            props.user.UnAck().then(() => {
                                forceUpdate()
                            })
                        }
                    } else {
                        if (props.managed) {
                            managedOps.ackManaged(props.user)
                        } else {
                            props.user.Ack().then(() => {
                                forceUpdate()
                            })
                        }
                    }
                }}
            >
                {myAck ? (isHovered ? t('unfollow') : t('following')) : t('follow')}
            </Button>
        </>
    )
}
