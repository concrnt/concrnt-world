import { type User } from '@concrnt/worldlib'
import { useEffect, useState } from 'react'
import { Box, Chip, Tab, Tabs, Typography } from '@mui/material'
import { CCAvatar } from './ui/CCAvatar'
import { Link as NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useClient } from '../context/ClientContext'
import { AckButton } from './AckButton'
import { CfmRendererLite } from './ui/CfmRendererLite'

export interface AckListProps {
    initmode?: 'acking' | 'acker'
    user: User
    onNavigated?: () => void
}

export const AckList = (props: AckListProps): JSX.Element => {
    const [mode, setMode] = useState(props.initmode ?? 'acking')

    const [ackingUsers, setAckingUsers] = useState<User[]>([])
    const [ackerUsers, setAckerUsers] = useState<User[]>([])

    const { t } = useTranslation('', { keyPrefix: 'common' })

    const { client } = useClient()

    useEffect(() => {
        let unmounted = false
        if (!props.user) return
        props.user.getAcker().then((ackers) => {
            if (unmounted) return
            setAckerUsers(ackers)
        })
        props.user.getAcking().then((acking) => {
            if (unmounted) return
            setAckingUsers(acking)
        })
        return () => {
            unmounted = true
        }
    }, [props.user])

    return (
        <>
            <Tabs
                value={mode}
                onChange={(_, value) => {
                    setMode(value)
                }}
                textColor="secondary"
                indicatorColor="secondary"
            >
                <Tab value="acking" label={t('follow')} />
                <Tab value="acker" label={t('followers')} />
            </Tabs>
            <Box
                sx={{
                    display: 'flex',
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    flex: 1
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                    }}
                >
                    {(mode === 'acking' ? ackingUsers : ackerUsers).map((user) => (
                        <Box
                            key={user.ccid}
                            sx={{
                                display: 'flex',
                                width: '100%',
                                alignItems: 'flex-start',
                                gap: 1,
                                textDecoration: 'none'
                            }}
                        >
                            <CCAvatar avatarURL={user.profile?.avatar} identiconSource={user.ccid} />
                            <Box
                                component={NavLink}
                                to={`/${user.ccid}`}
                                onClick={props.onNavigated}
                                display="flex"
                                flexDirection="column"
                                flex="1"
                                sx={{
                                    textDecoration: 'none',
                                    color: 'inherit'
                                }}
                            >
                                <Typography>{user.profile?.username}</Typography>
                                {client.ackers.find((ack) => ack.ccid === user.ccid) && (
                                    <Chip
                                        label={t('followed')}
                                        sx={{
                                            fontSize: '10px',
                                            padding: '0.5',
                                            borderRadius: '5px',
                                            height: '20px',
                                            width: 'fit-content'
                                        }}
                                    />
                                )}
                                <Typography
                                    variant="caption"
                                    color="primary"
                                    overflow="hidden"
                                    sx={{
                                        wordBreak: 'break-all'
                                    }}
                                >
                                    <CfmRendererLite
                                        limit={60}
                                        emojiDict={{}}
                                        messagebody={user.profile?.description ?? 'no description'}
                                    />
                                </Typography>
                            </Box>
                            <AckButton user={user} />
                        </Box>
                    ))}
                </Box>
            </Box>
        </>
    )
}
