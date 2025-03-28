import { Schemas } from '@concrnt/worldlib'
import { Profile } from '@concrnt/client'
import { Box, Chip, IconButton, Menu, Paper, Typography } from '@mui/material'
import { CCWallpaper } from './ui/CCWallpaper'
import { CCAvatar } from './ui/CCAvatar'
import { CfmRendererLite } from './ui/CfmRendererLite'
import { useState } from 'react'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import { useSnackbar } from 'notistack'
import { Link as routerLink } from 'react-router-dom'

import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { ProfileProperties } from './ui/ProfileProperties'

export interface SubProfileCardProps {
    showccid?: boolean
    character: Profile<any>
    additionalMenuItems?: JSX.Element | JSX.Element[]
    children?: JSX.Element | JSX.Element[]
    resolveHint?: string
}

export const SubProfileCard = (props: SubProfileCardProps): JSX.Element => {
    const isProfile = 'username' in props.character.parsedDoc.body && 'avatar' in props.character.parsedDoc.body
    const { enqueueSnackbar } = useSnackbar()

    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

    const hint = props.resolveHint ? '@' + props.resolveHint : ''

    const link =
        props.character.schema === Schemas.profile
            ? '/' + props.character.author + hint
            : '/' + props.character.author + hint + '#' + props.character.id

    return (
        <Paper variant="outlined">
            <CCWallpaper
                sx={{
                    height: '80px',
                    position: 'relative'
                }}
                override={props.character.parsedDoc.body.banner}
            >
                {props.additionalMenuItems && (
                    <IconButton
                        sx={{
                            position: 'absolute',
                            right: '8px',
                            top: '8px',
                            padding: 0.5,
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.7)'
                            }
                        }}
                        onClick={(e) => {
                            setMenuAnchor(e.currentTarget)
                        }}
                    >
                        <MoreHorizIcon sx={{ fontSize: '80%' }} />
                    </IconButton>
                )}
            </CCWallpaper>
            {isProfile ? (
                <>
                    <Box position="relative" height={0}>
                        <Box
                            component={routerLink}
                            to={link}
                            position="relative"
                            sx={{
                                top: '-30px',
                                left: '10px'
                            }}
                        >
                            <CCAvatar
                                alt={props.character.parsedDoc.body.username}
                                avatarURL={props.character.parsedDoc.body.avatar}
                                identiconSource={props.character.parsedDoc.body.username}
                                sx={{
                                    width: '60px',
                                    height: '60px'
                                }}
                            />
                        </Box>
                    </Box>
                    <Box
                        display="flex"
                        flexDirection="row"
                        justifyContent="flex-end"
                        alignItems="center"
                        gap={1}
                        px={1}
                        mb={1}
                        minHeight="30px"
                    >
                        {props.children}
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
                        <Typography variant="h2">{props.character.parsedDoc.body.username}</Typography>
                        {props.showccid ? (
                            <Chip
                                size="small"
                                label={`${props.character.author.slice(0, 9)}...`}
                                deleteIcon={<ContentPasteIcon />}
                                onDelete={() => {
                                    navigator.clipboard.writeText(props.character.author)
                                    enqueueSnackbar('Copied', { variant: 'info' })
                                }}
                            />
                        ) : (
                            <Box />
                        )}
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
                        <CfmRendererLite
                            messagebody={props.character.parsedDoc.body.description ?? ''}
                            emojiDict={{}}
                        />
                    </Box>
                    <ProfileProperties character={props.character} />
                </>
            ) : (
                <Box overflow="auto">
                    <Typography variant="h2">Not a profile</Typography>
                    <pre>{JSON.stringify(props.character, null, 2)}</pre>
                </Box>
            )}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null)
                }}
            >
                {props.additionalMenuItems}
            </Menu>
        </Paper>
    )
}
