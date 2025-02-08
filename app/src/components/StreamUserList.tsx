import { type User } from '@concrnt/worldlib'
import { useState } from 'react'
import { Box, Link, Tab, Tabs } from '@mui/material'
import { CCAvatar } from './ui/CCAvatar'
import { Link as RouterLink } from 'react-router-dom'

export interface StreamUserProps {
    initmode?: 'writers' | 'readers'
    writers: User[]
    readers: User[]
}

export const StreamUserList = (props: StreamUserProps): JSX.Element => {
    const [mode, setMode] = useState(props.initmode ?? 'readers')

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
                <Tab value="readers" label={'readers'} />
                <Tab value="writers" label={'writers'} />
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
                        gap: 1
                    }}
                >
                    {(mode === 'readers' ? props.readers : props.writers).map((user) => (
                        <Box
                            key={user.ccid}
                            sx={{
                                display: 'flex',
                                width: '100%',
                                alignItems: 'center',
                                gap: 1,
                                textDecoration: 'none'
                            }}
                            component={RouterLink}
                            to={`/${user.ccid}`}
                        >
                            <CCAvatar avatarURL={user.profile?.avatar} identiconSource={user.ccid} />
                            <Link underline="hover">{user.profile?.username}</Link>
                        </Box>
                    ))}
                </Box>
            </Box>
        </>
    )
}
