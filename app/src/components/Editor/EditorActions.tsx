import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Collapse,
    Popover,
    TextField,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material'
import { CCIconButton } from '../ui/CCIconButton'
import { closeSnackbar, useSnackbar } from 'notistack'
import { useEmojiPicker } from '../../context/EmojiPickerContext'
import { useNavigate } from 'react-router-dom'
import { useStorage } from '../../context/StorageContext'

import SendIcon from '@mui/icons-material/Send'
import ImageIcon from '@mui/icons-material/Image'
import DeleteIcon from '@mui/icons-material/Delete'
import EmojiEmotions from '@mui/icons-material/EmojiEmotions'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import LockIcon from '@mui/icons-material/Lock'

import { type Dispatch, type SetStateAction, useRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type WorldMedia, type Emoji, type EmojiLite } from '../../model'
import { UserPicker } from '../ui/UserPicker'
import { type User } from '@concrnt/worldlib'
import { usePersistent } from '../../hooks/usePersistent'
import { genBlurHash } from '../../util'
import { useGlobalState } from '../../context/GlobalState'

export interface EditorActionsProps {
    post: () => void
    disablePostButton?: boolean
    draft: string
    setDraft: (draft: string) => void
    textInputRef: React.RefObject<HTMLInputElement>
    uploadImage: (file: File) => Promise<void>
    insertEmoji: (emoji: Emoji) => void
    setEmojiDict: Dispatch<SetStateAction<Record<string, EmojiLite>>>
    onAddMedia?: (media: WorldMedia) => void
    submitButtonLabel?: string
    disableMedia?: boolean
    disableEmoji?: boolean
    whisperUsers: User[]
    setWhisperUsers: Dispatch<SetStateAction<User[]>>
    isPrivate?: boolean
    addon?: JSX.Element | boolean
}

export const EditorActions = (props: EditorActionsProps): JSX.Element => {
    const theme = useTheme()
    const { t } = useTranslation('', { keyPrefix: 'ui.draft' })
    const emojiPicker = useEmojiPicker()
    const navigate = useNavigate()
    const { getImageURL } = useGlobalState()

    const { isUploadReady } = useStorage()

    const { enqueueSnackbar } = useSnackbar()

    const fileInputRef = useRef<HTMLInputElement>(null)

    const onFileInputChange = async (event: any): Promise<void> => {
        for (const file of event.target.files) {
            if (!file) {
                continue
            }
            await props.uploadImage(file)
        }

        props.textInputRef.current?.focus()
    }

    const fetchImage = async (url: string): Promise<{ url: string; type: string; blurhash: string }> => {
        const response = await fetch(url)
        const blurhash = await genBlurHash(url)
        const blob = await response.blob()
        return { url, type: blob.type, blurhash: blurhash ?? '' }
    }

    const [mediaMenuAnchorEl, setMediaMenuAnchorEl] = useState<HTMLButtonElement | null>(null)

    const mediaButtonTimer = useRef<NodeJS.Timeout | null>(null)
    const mediaButtonOnPress = useCallback(
        (target: HTMLButtonElement) => {
            mediaButtonTimer.current = setTimeout(() => {
                if (props.onAddMedia) setMediaMenuAnchorEl(target)
                mediaButtonTimer.current = null
            }, 500)
        },
        [setMediaMenuAnchorEl, props.onAddMedia]
    )

    const mediaButtonOnRelease = useCallback(() => {
        if (mediaButtonTimer.current) {
            if (fileInputRef.current) {
                clearTimeout(mediaButtonTimer.current)
                mediaButtonTimer.current = null

                if (isUploadReady) {
                    fileInputRef.current.click()
                } else {
                    navigate('/settings/storage')
                }
            }
        }
    }, [isUploadReady, navigate])

    const [addingMediaURL, setAddingMediaURL] = useState<string>('')
    const [detailMenuAnchorEl, setDetailMenuAnchorEl] = useState<null | HTMLElement>(null)
    const [openWhisperWarning, setOpenWhisperWarning] = usePersistent('openWhisperWarning', true)

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}
        >
            <Box>
                <Tooltip
                    title={isUploadReady ? t('attachImage') : t('cantAttachImage')}
                    arrow
                    placement="top"
                    enterDelay={isUploadReady ? 500 : 0}
                >
                    <span>
                        <CCIconButton
                            disabled={props.disableMedia}
                            onMouseDown={(e) => {
                                mediaButtonOnPress(e.currentTarget)
                            }}
                            onMouseUp={() => {
                                mediaButtonOnRelease()
                            }}
                        >
                            <ImageIcon sx={{ fontSize: '80%' }} />
                            <input
                                hidden
                                multiple
                                ref={fileInputRef}
                                type="file"
                                onChange={(e) => {
                                    onFileInputChange(e)
                                }}
                            />
                        </CCIconButton>
                    </span>
                </Tooltip>
                <Popover
                    open={Boolean(mediaMenuAnchorEl)}
                    anchorEl={mediaMenuAnchorEl}
                    onClose={() => {
                        setMediaMenuAnchorEl(null)
                    }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center'
                    }}
                    slotProps={{
                        paper: {
                            sx: {
                                padding: 1,
                                display: 'flex',
                                gap: 1,
                                flexDirection: 'column'
                            }
                        }
                    }}
                >
                    <TextField
                        label="URL"
                        value={addingMediaURL}
                        onChange={(e) => {
                            setAddingMediaURL(e.target.value)
                        }}
                    />
                    <Button
                        onClick={() => {
                            fetchImage(getImageURL(addingMediaURL))
                                .then((media) => {
                                    props.onAddMedia?.({
                                        mediaType: media.type,
                                        mediaURL: addingMediaURL,
                                        blurhash: media.blurhash
                                    })
                                    setAddingMediaURL('')
                                    setMediaMenuAnchorEl(null)
                                })
                                .catch((_) => {
                                    enqueueSnackbar(t('fetchImageFailed'), { variant: 'error' })
                                })
                        }}
                    >
                        {t('add')}
                    </Button>
                </Popover>
                <Tooltip title={t('emoji')} arrow placement="top" enterDelay={500}>
                    <CCIconButton
                        disabled={props.disableEmoji}
                        onClick={(e) => {
                            emojiPicker.open(e.currentTarget, (emoji) => {
                                props.insertEmoji(emoji)
                                emojiPicker.close()
                                setTimeout(() => {
                                    props.textInputRef.current?.focus()
                                }, 0)
                            })
                        }}
                    >
                        <EmojiEmotions sx={{ fontSize: '80%' }} />
                    </CCIconButton>
                </Tooltip>

                <Tooltip title={t('hideContent')} arrow placement="top" enterDelay={500}>
                    <CCIconButton
                        disabled={props.disableEmoji}
                        onClick={(_) => {
                            props.setDraft(`<details>
<summary>${t('clickToShow')}</summary>

${props.draft.trim() || t('enterContent')}
</details>`)
                        }}
                    >
                        <VisibilityOffIcon sx={{ fontSize: '80%' }} />
                    </CCIconButton>
                </Tooltip>

                <Tooltip title={t('clearDraft')} arrow placement="top" enterDelay={500}>
                    <span>
                        <CCIconButton
                            onClick={() => {
                                if (props.draft.length === 0) return
                                enqueueSnackbar('Draft Cleared.', {
                                    autoHideDuration: 5000,
                                    action: (key) => (
                                        <Button
                                            onClick={() => {
                                                closeSnackbar(key)
                                                props.setDraft(props.draft)
                                            }}
                                        >
                                            undo
                                        </Button>
                                    )
                                })
                                props.setDraft('')
                                props.setEmojiDict({})
                            }}
                            disabled={props.draft.length === 0}
                        >
                            <DeleteIcon sx={{ fontSize: '80%' }} />
                        </CCIconButton>
                    </span>
                </Tooltip>
                <CCIconButton
                    onClick={(e) => {
                        setDetailMenuAnchorEl(e.currentTarget)
                    }}
                >
                    <MoreHorizIcon sx={{ fontSize: '80%' }} />
                </CCIconButton>
                <Popover
                    open={Boolean(detailMenuAnchorEl)}
                    anchorEl={detailMenuAnchorEl}
                    onClose={() => {
                        setDetailMenuAnchorEl(null)
                    }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center'
                    }}
                    slotProps={{
                        paper: {
                            sx: {
                                maxWidth: '90vw',
                                padding: 1,
                                display: 'flex',
                                flexDirection: 'column'
                            }
                        }
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            justifyContent: 'space-between'
                        }}
                    >
                        <Typography variant="h4">{t('whisper')}</Typography>
                        <Typography
                            onClick={() => {
                                setOpenWhisperWarning(!openWhisperWarning)
                            }}
                            sx={{
                                cursor: 'pointer',
                                color: theme.palette.text.secondary,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {t('whisperWarn')}
                            <ExpandMoreIcon
                                sx={{
                                    marginLeft: 1,
                                    transform: openWhisperWarning ? 'rotate(180deg)' : 'rotate(0deg)'
                                }}
                            />
                        </Typography>
                    </Box>
                    <Collapse in={openWhisperWarning}>
                        <Alert severity="warning">
                            <AlertTitle>{t('whisperWarnTitle')}</AlertTitle>
                            {t('whisperWarnDesc')}
                        </Alert>
                    </Collapse>
                    <Typography variant="caption">{t('whisperDesc')}</Typography>
                    <Box
                        sx={{
                            my: 1
                        }}
                    >
                        <UserPicker selected={props.whisperUsers} setSelected={props.setWhisperUsers} />
                    </Box>
                    <Box display="flex" justifyContent="flex-end">
                        <Button
                            onClick={() => {
                                setOpenWhisperWarning(false)
                                setDetailMenuAnchorEl(null)
                                props.textInputRef.current?.focus()
                            }}
                        >
                            Close
                        </Button>
                    </Box>
                </Popover>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                {props.addon}
                <Box>
                    <Button
                        color="primary"
                        disabled={props.disablePostButton}
                        onClick={(_) => {
                            props.post()
                        }}
                        sx={{
                            '&.Mui-disabled': {
                                background: theme.palette.divider,
                                color: theme.palette.text.disabled
                            }
                        }}
                        endIcon={<SendIcon />}
                    >
                        {props.isPrivate ? <LockIcon sx={{ fontSize: '1rem', mr: 1 }} /> : <></>}
                        {props.whisperUsers.length > 0 ? t('whisper') : ''}
                        {props.submitButtonLabel ?? t('current')}
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}
