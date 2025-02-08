import { Box, IconButton, ListItem, Paper, type SxProps, Tooltip } from '@mui/material'
import { UserProfileCard } from './UserProfileCard'
import { Link as routerLink } from 'react-router-dom'
import { CCAvatar } from './ui/CCAvatar'
import { useClient } from '../context/ClientContext'
import { useEffect, useState } from 'react'
import { type User } from '@concrnt/worldlib'

export interface ContentWithUserFetchProps {
    ccid: string
    children?: JSX.Element | Array<JSX.Element | undefined>
    sx?: SxProps
}

export const ContentWithUserFetch = (props: ContentWithUserFetchProps): JSX.Element => {
    const { client } = useClient()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        client.getUser(props.ccid).then(setUser)
    }, [client, props.ccid])

    return (
        <ListItem
            sx={{
                wordBreak: 'break-word',
                alignItems: 'flex-start',
                flex: 1,
                gap: 1
            }}
            disablePadding
        >
            <Tooltip
                enterDelay={500}
                enterNextDelay={500}
                leaveDelay={300}
                placement="top"
                components={{
                    Tooltip: Paper
                }}
                componentsProps={{
                    tooltip: {
                        sx: {
                            m: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            minWidth: '300px'
                        }
                    }
                }}
                title={user && <UserProfileCard user={user} />}
            >
                <IconButton
                    sx={{
                        width: { xs: '38px', sm: '48px' },
                        height: { xs: '38px', sm: '48px' },
                        mt: { xs: '3px', sm: '5px' }
                    }}
                    component={routerLink}
                    to={`/${props.ccid}`}
                >
                    <CCAvatar
                        avatarURL={user?.profile?.avatar}
                        identiconSource={props.ccid}
                        sx={{
                            width: { xs: '38px', sm: '48px' },
                            height: { xs: '38px', sm: '48px' }
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    width: '100%',
                    overflow: 'hidden',
                    ...props.sx
                }}
            >
                {props.children}
            </Box>
        </ListItem>
    )
}
