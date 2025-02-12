import { alpha, Box, Paper, Typography, useTheme } from '@mui/material'
import { ConcrntLogo } from '../theming/ConcrntLogo'
import { CCAvatar } from './CCAvatar'
import { QRCode } from 'react-qrcode-logo'
import { ConcurrentTheme } from '../../model'
import { User } from '@concrnt/worldlib'

interface ProfileQRCardProps {
    user: User
}

export const ProfileQRCard = (props: ProfileQRCardProps): JSX.Element => {
    const theme = useTheme<ConcurrentTheme>()

    return (
        <Box
            sx={{
                width: '100%',
                backgroundColor: 'primary.main',
                maxWidth: '400px',
                borderRadius: 2,
                position: 'relative',
                aspectRatio: '1/1.618',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                py: '20px',
                alignItems: 'center',
                overflow: 'hidden',
                borderColor: 'divider'
            }}
        >
            <Box
                id="emblem"
                sx={{
                    position: 'absolute',
                    opacity: '0.1',
                    left: '-30px',
                    bottom: '-30px',
                    width: '400px',
                    height: '400px',
                    display: 'block'
                }}
            >
                <ConcrntLogo size="400px" color={theme.palette.primary.contrastText} />
            </Box>

            <Paper
                sx={{
                    backgroundColor: 'primary.main.contrastText',
                    width: '90%',
                    aspectRatio: '1/1',
                    borderRadius: 2
                }}
            >
                <QRCode
                    value={`https://concrnt.world/${props.user.ccid}?hint=${props.user.domain}`}
                    size={500}
                    ecLevel="L"
                    quietZone={50}
                    qrStyle="fluid"
                    eyeRadius={2}
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                    fgColor={theme.palette.primary.main}
                    bgColor={'transparent'}
                />
            </Paper>

            <Box
                flexDirection="row"
                display="flex"
                alignItems="center"
                gap="15px"
                width="80%"
                justifyContent="center"
                flex={1}
            >
                <CCAvatar
                    circle
                    avatarURL={props.user.profile?.avatar}
                    sx={{
                        width: '100px',
                        height: '100px'
                    }}
                />
                <Box>
                    <Typography fontSize="30px" color="primary.contrastText" fontWeight="bold">
                        {props.user?.profile?.username}
                    </Typography>
                    {props.user?.alias && (
                        <Typography fontSize="18px" color="primary.contrastText">
                            @{props.user.alias}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    width: '90%',
                    color: alpha(theme.palette.primary.contrastText, 0.7),
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    fontFamily: 'SourceCodeProRoman-Regular, Source Code Pro'
                }}
            >
                <Typography
                    sx={{
                        fontSize: { xs: '13px', sm: '16px', md: '16px' }
                    }}
                >
                    {props.user.ccid}
                </Typography>
                <Typography>concrnt.world</Typography>
            </Box>
        </Box>
    )
}
