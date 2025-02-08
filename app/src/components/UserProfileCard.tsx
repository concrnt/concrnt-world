import { type ProfileSchema, type User } from '@concrnt/worldlib'
import { Badge, Box, Chip, Typography } from '@mui/material'
import { CCAvatar } from './ui/CCAvatar'
import { useClient } from '../context/ClientContext'
import { AckButton } from './AckButton'
import { useSnackbar } from 'notistack'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import { MarkdownRenderer } from './ui/MarkdownRenderer'
import { CCWallpaper } from './ui/CCWallpaper'
import { Link as routerLink } from 'react-router-dom'

export interface UserProfileCardProps {
    user?: User
    profile?: ProfileSchema
    subProfileID?: string
    profileOverride?: ProfileSchema
    ccid?: string
}

export const UserProfileCard = (props: UserProfileCardProps): JSX.Element => {
    const { client } = useClient()
    const isSelf = props.user?.ccid === client?.ccid
    const { enqueueSnackbar } = useSnackbar()

    const ccid = props.user?.ccid ?? props.ccid ?? '???????????????????'
    const profile = props.profileOverride ?? props.user?.profile ?? props.profile

    if (!profile) return <></>

    return (
        <Box display="flex" flexDirection="column" maxWidth="500px">
            <CCWallpaper
                sx={{
                    height: '80px'
                }}
                override={profile.banner}
            />
            <Box position="relative" height={0}>
                <Box
                    position="relative"
                    component={routerLink}
                    to={'/' + ccid + (props.subProfileID ? '#' + props.subProfileID : '')}
                    sx={{
                        top: '-30px',
                        left: '10px'
                    }}
                >
                    <Badge
                        overlap="circular"
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right'
                        }}
                        badgeContent={
                            props.profileOverride && (
                                <CCAvatar
                                    sx={{
                                        width: 24,
                                        height: 24
                                    }}
                                    identiconSource={ccid}
                                    avatarURL={props.user?.profile?.avatar ?? props.profile?.avatar}
                                />
                            )
                        }
                    >
                        <CCAvatar
                            alt={profile.username}
                            avatarURL={
                                props.profileOverride
                                    ? profile.avatar
                                    : (props.user?.profile?.avatar ?? props.profile?.avatar)
                            }
                            identiconSource={ccid}
                            sx={{
                                width: '60px',
                                height: '60px'
                            }}
                        />
                    </Badge>
                </Box>
            </Box>
            <Box
                display="flex"
                flexDirection="row"
                justifyContent="flex-end"
                alignItems="center"
                height="40px"
                gap={1}
                px={1}
                mb={1}
            >
                {!isSelf && props.user && (
                    <>
                        <AckButton user={props.user} />
                    </>
                )}
            </Box>
            <Box
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
                px={1}
                mb={1}
            >
                <Typography variant="h2">{profile.username}</Typography>
                <Chip
                    size="small"
                    label={`${ccid.slice(0, 9)}...`}
                    deleteIcon={<ContentPasteIcon />}
                    onDelete={() => {
                        if (ccid) {
                            navigator.clipboard.writeText(ccid)
                            enqueueSnackbar('Copied', { variant: 'info' })
                        } else {
                            enqueueSnackbar('No CCID found', { variant: 'error' })
                        }
                    }}
                />
            </Box>
            <Box
                sx={{
                    maxHeight: '100px',
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    px: 1,
                    mb: 1
                }}
            >
                <MarkdownRenderer messagebody={profile.description ?? ''} emojiDict={{}} />
            </Box>
        </Box>
    )
}
