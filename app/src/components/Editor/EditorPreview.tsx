import { Box, ListItemIcon, Typography, Menu, MenuItem, Avatar } from '@mui/material'

import { DummyMessageView } from '../Message/DummyMessageView'
import { CCAvatar } from '../ui/CCAvatar'
import { ErrorBoundary } from 'react-error-boundary'
import HeartBrokenIcon from '@mui/icons-material/HeartBroken'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useClient } from '../../context/ClientContext'
import { type EmojiLite } from '../../model'
import { useGlobalState } from '../../context/GlobalState'

interface EditorPreviewProps {
    draft: string
    emojiDict: Record<string, EmojiLite>
    selectedSubprofile?: string
    setSelectedSubprofile: (subprofileID?: string) => void
    hideActions?: boolean
}

export const EditorPreview = (props: EditorPreviewProps): JSX.Element => {
    const { t } = useTranslation('', { keyPrefix: 'ui.draft' })
    const { client } = useClient()
    const [profileSelectAnchorEl, setProfileSelectAnchorEl] = useState<null | HTMLElement>(null)
    const { allProfiles } = useGlobalState()

    return (
        <ErrorBoundary
            FallbackComponent={({ error }) => (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        py: 2
                    }}
                >
                    <Typography color="error" variant="body2" align="center" display="flex" alignItems="center" gap={1}>
                        <HeartBrokenIcon />
                        {error.message}
                    </Typography>
                </Box>
            )}
        >
            <DummyMessageView
                message={{
                    body: props.draft,
                    emojis: props.emojiDict
                }}
                user={client.user?.profile}
                userCCID={client.user?.ccid}
                subprofileID={props.selectedSubprofile}
                hideActions={props.hideActions}
                timestamp={
                    <Typography
                        sx={{
                            backgroundColor: 'divider',
                            color: 'primary.contrastText',
                            px: 1,
                            fontSize: '0.75rem'
                        }}
                    >
                        {t('preview')}
                    </Typography>
                }
                onAvatarClick={(e) => {
                    setProfileSelectAnchorEl(e.currentTarget)
                }}
            />
            <Menu
                anchorEl={profileSelectAnchorEl}
                open={Boolean(profileSelectAnchorEl)}
                onClose={() => {
                    setProfileSelectAnchorEl(null)
                }}
            >
                {props.selectedSubprofile && (
                    <MenuItem
                        onClick={() => {
                            props.setSelectedSubprofile(undefined)
                        }}
                        selected
                    >
                        <ListItemIcon>
                            <CCAvatar
                                alt={client?.user?.profile?.username ?? 'Unknown'}
                                avatarURL={client?.user?.profile?.avatar}
                                identiconSource={client?.ccid ?? ''}
                            />
                        </ListItemIcon>
                    </MenuItem>
                )}

                {allProfiles.map((p) => {
                    if (props.selectedSubprofile === p.id) return undefined
                    return (
                        <MenuItem
                            key={p.id}
                            onClick={() => {
                                props.setSelectedSubprofile(p.id)
                            }}
                        >
                            <ListItemIcon>
                                <Avatar
                                    alt={p.parsedDoc.body.username}
                                    src={p.parsedDoc.body.avatar}
                                    variant="square"
                                />
                            </ListItemIcon>
                        </MenuItem>
                    )
                })}
            </Menu>
        </ErrorBoundary>
    )
}
