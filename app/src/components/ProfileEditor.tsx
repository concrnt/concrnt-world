import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useEffect, useState } from 'react'
import { type ProfileSchema } from '@concrnt/worldlib'
import { Profile } from '@concrnt/client'
import Button from '@mui/material/Button'
import { useClient } from '../context/ClientContext'
import { CCAvatar } from './ui/CCAvatar'
import { alpha, useTheme } from '@mui/material'

import { useTranslation } from 'react-i18next'
import { MediaInput } from './ui/MediaInput'
import { CCWallpaper } from './ui/CCWallpaper'
import { useSnackbar } from 'notistack'

interface ProfileEditorProps {
    initial?: ProfileSchema
    onSubmit?: (updated: Profile<ProfileSchema> | undefined) => void
    id?: string
}

export function ProfileEditor(props: ProfileEditorProps): JSX.Element {
    const { client } = useClient()
    const theme = useTheme()
    const [username, setUsername] = useState<string>(props.initial?.username ?? '')
    const [avatar, setAvatar] = useState<string>(props.initial?.avatar ?? '')
    const [description, setDescription] = useState<string>(props.initial?.description ?? '')
    const [banner, setBanner] = useState<string>(props.initial?.banner ?? '')
    const { enqueueSnackbar } = useSnackbar()

    const { t } = useTranslation('', { keyPrefix: 'ui.profileEditor' })

    const updateProfile = async (): Promise<void> => {
        client
            .setProfile({ username, description, avatar, banner })
            .then((data) => {
                props.onSubmit?.(data)
            })
            .catch((e) => {
                console.error(e)
                enqueueSnackbar(e.message, { variant: 'error' })
                props.onSubmit?.(undefined)
            })
    }

    useEffect(() => {
        setUsername(props.initial?.username ?? '')
        setAvatar(props.initial?.avatar ?? '')
        setDescription(props.initial?.description ?? '')
        setBanner(props.initial?.banner ?? '')
    }, [props.initial])

    return (
        <CCWallpaper
            innerSx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 2,
                padding: 2
            }}
            override={banner}
        >
            <CCAvatar
                avatarURL={avatar}
                identiconSource={client.ccid}
                sx={{
                    width: '64px',
                    height: '64px'
                }}
            />

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '15px',
                    gap: '5px',
                    flex: 1,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    borderRadius: '5px',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
            >
                <TextField
                    label="username"
                    name="username"
                    variant="outlined"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value)
                    }}
                />
                <TextField
                    label="description"
                    name="description"
                    variant="outlined"
                    value={description}
                    multiline
                    onChange={(e) => {
                        setDescription(e.target.value)
                    }}
                />
                <MediaInput
                    label="avatarURL"
                    value={avatar}
                    onChange={(e) => {
                        setAvatar(e)
                    }}
                />
                <MediaInput
                    label="bannerURL"
                    value={banner}
                    onChange={(e) => {
                        setBanner(e)
                    }}
                />
                <Button
                    onClick={(_) => {
                        updateProfile()
                    }}
                >
                    {props.id === undefined ? t('createNew') : t('update')}
                </Button>
            </Box>
        </CCWallpaper>
    )
}
