import { User, UserProfile } from '@concrnt/worldlib'
import { Badge, Box, Chip, Typography } from '@mui/material'
import { CCAvatar } from './ui/CCAvatar'
import { useClient } from '../context/ClientContext'
import { AckButton } from './AckButton'
import { useSnackbar } from 'notistack'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import { CCWallpaper } from './ui/CCWallpaper'
import { Link as routerLink } from 'react-router-dom'
import { CfmRenderer } from './ui/CfmRenderer'

export interface UserProfileCardProps {
    user?: User
    profile?: UserProfile
}

export const UserProfileCard = (props: UserProfileCardProps): JSX.Element => {
    const { client } = useClient()
    const isSelf = props.profile?.ccid === client?.ccid
    const { enqueueSnackbar } = useSnackbar()

    const profile = props.profile ?? props.user?.profile
    if (!profile) {
        return <>no profile</>
    }

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
                    to={'/' + profile.ccid + (profile.profileOverrideID ? '#' + profile.profileOverrideID : '')}
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
                            profile.original && (
                                <CCAvatar
                                    sx={{
                                        width: 24,
                                        height: 24
                                    }}
                                    identiconSource={profile.ccid}
                                    avatarURL={profile.original.avatar ?? props.profile?.avatar}
                                />
                            )
                        }
                    >
                        <CCAvatar
                            alt={profile.username}
                            avatarURL={profile.avatar}
                            identiconSource={profile.ccid}
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
                    label={`${profile.ccid.slice(0, 9)}...`}
                    deleteIcon={<ContentPasteIcon />}
                    onDelete={() => {
                        navigator.clipboard.writeText(profile.ccid)
                        enqueueSnackbar('Copied', { variant: 'info' })
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
                <CfmRenderer messagebody={profile.description ?? ''} emojiDict={{}} />
            </Box>
        </Box>
    )
}
