import { useState, useEffect, useRef, memo, useMemo } from 'react'
import {
    InputBase,
    Box,
    Divider,
    CircularProgress,
    Tooltip,
    Collapse,
    Backdrop,
    type SxProps,
    Menu,
    Paper,
    Typography,
    MenuItem,
    Popover,
    TextField,
    FormControl,
    InputLabel,
    Select,
    Button
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { usePersistent } from '../../hooks/usePersistent'
import { type CommunityTimelineSchema, type Timeline, type Message, type User, ProfileSchema } from '@concrnt/worldlib'
import { useClient } from '../../context/ClientContext'
import { type WorldMedia, type Emoji, type EmojiLite } from '../../model'
import { useTranslation } from 'react-i18next'
import { CCIconButton } from '../ui/CCIconButton'
import ReplayIcon from '@mui/icons-material/Replay'
import { EmojiSuggestion } from '../Editor/EmojiSuggestion'
import { UserSuggestion } from '../Editor/UserSuggestion'
import { useStorage } from '../../context/StorageContext'
import { EditorActions } from './EditorActions'
import { EditorPreview } from './EditorPreview'

import { FaMarkdown } from 'react-icons/fa'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import PermMediaIcon from '@mui/icons-material/PermMedia'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import ReplyIcon from '@mui/icons-material/Reply'
import RepeatIcon from '@mui/icons-material/Repeat'
import CancelIcon from '@mui/icons-material/Cancel'
import FeedbackIcon from '@mui/icons-material/Feedback'
import { usePreference } from '../../context/PreferenceContext'
import { CCComboBox } from '../ui/CCComboBox'
import { genBlurHash } from '../../util'

import modelPoster from '../../resources/view-3dmodel.png'
import { TimelinePicker } from '../ui/TimelinePicker'
import { Profile } from '@concrnt/client'

const ModeSets = {
    plaintext: {
        icon: <TextFieldsIcon />,
        selectable: true
    },
    markdown: {
        icon: <FaMarkdown />,
        selectable: true
    },
    media: {
        icon: <PermMediaIcon />,
        selectable: true
    },
    reply: {
        icon: <ReplyIcon />,
        selectable: false
    },
    reroute: {
        icon: <RepeatIcon />,
        selectable: false
    }
}

export type EditorMode = keyof typeof ModeSets

export interface CCPostEditorProps {
    mode?: EditorMode
    actionTo?: Message<any>
    autoFocus?: boolean
    mobile?: boolean
    streamPickerInitial: Array<Timeline<CommunityTimelineSchema>>
    streamPickerOptions: Array<Timeline<CommunityTimelineSchema>>
    placeholder?: string
    sx?: SxProps
    value?: string
    defaultPostHome?: boolean
    subprofile?: string
    minRows?: number
    maxRows?: number
    onPost?: () => void
}

export const CCPostEditor = memo<CCPostEditorProps>((props: CCPostEditorProps): JSX.Element => {
    const { client } = useClient()
    const { uploadFile } = useStorage()
    const { enqueueSnackbar } = useSnackbar()
    const { t } = useTranslation('', { keyPrefix: 'ui.draft' })
    const { t: et } = useTranslation('', { keyPrefix: 'ui.postButton' })

    const [dragging, setDragging] = useState<boolean>(false)
    const [autoSwitchMediaPostType] = usePreference('autoSwitchMediaPostType')

    const textInputRef = useRef<HTMLInputElement>(null)
    let [sending, setSending] = useState<boolean>(false)
    const [selectedSubprofile, setSelectedSubprofile] = useState<Profile<ProfileSchema> | undefined>(undefined)

    // destination handling
    const [destTimelines, setDestTimelines] = useState<Array<Timeline<CommunityTimelineSchema>>>(
        props.streamPickerInitial
    )

    useEffect(() => {
        setDestTimelines(props.streamPickerInitial)
    }, [props.streamPickerInitial])

    const [postHomeButton, setPostHomeButton] = useState<boolean>(props.defaultPostHome ?? true)
    const [holdCtrlShift, setHoldCtrlShift] = useState<boolean>(false)
    const postHome = postHomeButton && !holdCtrlShift

    useEffect(() => {
        if (props.defaultPostHome === undefined) return
        setPostHomeButton(props.defaultPostHome)
    }, [props.defaultPostHome])

    useEffect(() => {
        if (!client.ccid || !props.subprofile) {
            setSelectedSubprofile(undefined)
        } else {
            client.api.getProfile<ProfileSchema>(props.subprofile, client.ccid).then((profile) => {
                setSelectedSubprofile(profile)
            })
        }
    }, [props.subprofile])

    // draft handling
    const [draft, setDraft] = usePersistent<string>('draft', '')

    useEffect(() => {
        if (props.value && props.value !== '') {
            reset()
            setDraft(props.value)
        }
    }, [props.value])

    // emoji
    const [emojiDict, setEmojiDict] = usePersistent<Record<string, EmojiLite>>('draftEmojis', {})

    const insertEmoji = (emoji: Emoji): void => {
        const newDraft =
            draft.slice(0, textInputRef.current?.selectionEnd ?? 0) +
            `:${emoji.shortcode}:` +
            draft.slice(textInputRef.current?.selectionEnd ?? 0)
        setDraft(newDraft)
        setEmojiDict((prev) => ({ ...prev, [emoji.shortcode]: { imageURL: emoji.imageURL } }))
    }

    // media
    const [medias, setMedias] = usePersistent<Array<{ key: string; progress: number; media: WorldMedia }>>(
        'draftMedias',
        []
    )
    const uploading = medias.some((media) => media.media.mediaURL === '')

    // mode handling
    let [mode, setMode] = useState<EditorMode>('markdown')
    const [modeMenuAnchor, setModeMenuAnchor] = useState<null | HTMLElement>(null)
    useEffect(() => {
        if (props.mode) {
            setMode(props.mode)
        } else {
            if (medias.length > 0) {
                setMode('media')
            } else {
                setMode('markdown')
            }
        }
    }, [props.mode])

    const reset = (): void => {
        setMode('markdown')
        setDraft('')
        setEmojiDict({})
        setMedias([])
        setParticipants([])
    }

    const destinationModified =
        destTimelines.length !== props.streamPickerInitial.length ||
        destTimelines.some((dest, i) => dest.id !== props.streamPickerInitial[i].id) ||
        selectedSubprofile?.id !== props.subprofile ||
        postHome !== (props.defaultPostHome ?? true)

    const [mediaMenuAnchorEl, setMediaMenuAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(-1)

    // whisper
    const [participants, setParticipants] = useState<User[]>([])
    const whisper = participants.map((p) => p.ccid)

    // check Visibility
    const isPrivate = useMemo(() => {
        return (
            destTimelines.some((dest) => {
                return !dest.policy.isReadPublic()
            }) || participants.length > 0
        )
    }, [destTimelines, participants])

    const post = (postHome: boolean): void => {
        if (!client?.user) return
        if ((draft.length === 0 || draft.trim().length === 0) && !(mode === 'media' || mode === 'reroute')) {
            enqueueSnackbar(t('plzAddMessage'), { variant: 'error' })
            return
        }
        if (mode === 'media' && medias.length === 0) {
            enqueueSnackbar(t('plzAttachMedia'), { variant: 'error' })
            return
        }
        if (destTimelines.length === 0 && !postHome) {
            enqueueSnackbar(t('plzAddDestination'), { variant: 'error' })
            return
        }

        const destTimelineIDs = destTimelines.map((t) => t.fqid).filter((e) => e)

        const homeTimeline = selectedSubprofile
            ? 'world.concrnt.t-subhome.' + selectedSubprofile.id + '@' + client.user.ccid
            : client.user.homeTimeline
        const dest = [...new Set([...destTimelineIDs, ...(postHome ? [homeTimeline] : [])])].filter((e) => e)

        const mentionsMatches = draft.matchAll(/(^|\s+)@(con1\w{38})/g)
        const mentions = [...new Set(Array.from(mentionsMatches).map((m) => m[2]))]

        setSending((sending = true))

        const emojis = Object.keys(emojiDict).length > 0 ? emojiDict : undefined
        const profileOverride = selectedSubprofile ? { profileID: selectedSubprofile.id } : undefined

        let req
        switch (mode) {
            case 'plaintext':
                req = client.createPlainTextCrnt(draft, dest, {
                    profileOverride,
                    whisper,
                    isPrivate
                })
                break
            case 'markdown':
                req = client.createMarkdownCrnt(draft, dest, {
                    emojis,
                    mentions,
                    profileOverride,
                    whisper,
                    isPrivate
                })
                break
            case 'media':
                req = client.createMediaCrnt(draft, dest, {
                    emojis,
                    medias: medias.map((media) => media.media),
                    profileOverride,
                    whisper,
                    isPrivate
                })
                break
            case 'reply':
                if (!props.actionTo) {
                    req = Promise.reject(new Error('No actionTo'))
                    break
                }
                req = props.actionTo.reply(dest, draft, {
                    emojis,
                    profileOverride,
                    whisper,
                    isPrivate
                })
                break
            case 'reroute':
                if (!props.actionTo) {
                    req = Promise.reject(new Error('No actionTo'))
                    break
                }
                req = props.actionTo.reroute(dest, '', {
                    emojis,
                    profileOverride,
                    whisper,
                    isPrivate
                })
                break
            default:
                enqueueSnackbar('Invalid mode', { variant: 'error' })
        }

        req
            ?.then(() => {
                reset()
                props.onPost?.()
            })
            .catch((error) => {
                enqueueSnackbar(`Failed to post message: ${error.message}`, { variant: 'error' })
            })
            .finally(() => {
                setSending(false)
            })
    }

    const uploadMedia = async (file: File): Promise<void> => {
        let fileType = file.type

        if (!fileType) {
            if (file.name.endsWith('.glb')) {
                fileType = 'model/gltf-binary'
            }
        }

        if (!fileType) {
            enqueueSnackbar('Invalid file type', { variant: 'error' })
            return
        }

        const mediaExists = draft.match(/!\[[^\]]*\]\([^)]*\)/g)
        if (!mediaExists && mode === 'markdown' && autoSwitchMediaPostType) {
            setMode((mode = 'media'))
        }

        if (mode === 'media') {
            let url = URL.createObjectURL(file)
            let blurhash = ''

            if (fileType.startsWith('image')) {
                try {
                    blurhash = (await genBlurHash(url)) ?? ''
                } catch (e) {
                    console.error('Failed to generate blurhash:', e)
                }
            } else if (fileType.startsWith('video')) {
                const canvas = document.createElement('canvas')
                const video = document.createElement('video')
                video.src = url
                video.muted = true
                video.playsInline = true

                await new Promise<void>((resolve) => {
                    let rendered = false
                    video.oncanplay = async () => {
                        if (rendered || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
                        rendered = true
                        setTimeout(() => {
                            video.pause()
                            resolve()
                        }, 33)
                    }

                    setTimeout(() => {
                        if (rendered) return
                        rendered = true
                        resolve()
                    }, 3000)
                    video.play()
                })

                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                const ctx = canvas.getContext('2d')
                if (!ctx) return
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const thumbnailURL = canvas.toDataURL('image/jpeg')
                url = thumbnailURL
                try {
                    blurhash = (await genBlurHash(thumbnailURL)) ?? ''
                } catch (e) {
                    console.error('Failed to generate blurhash:', e)
                }
            }

            setMedias((medias) => [
                ...medias,
                {
                    key: url,
                    progress: 0,
                    media: {
                        mediaURL: '',
                        mediaType: fileType,
                        blurhash
                    }
                }
            ])

            await uploadFile(file, (progress) => {
                setMedias((medias) => {
                    const newMedias = [...medias]
                    const index = newMedias.findIndex((media) => media.key === url)
                    if (index >= 0) {
                        newMedias[index] = {
                            ...newMedias[index],
                            progress
                        }
                    }
                    return newMedias
                })
            })
                .then((result) => {
                    setMedias((medias) => {
                        const newMedias = [...medias]
                        const index = newMedias.findIndex((media) => media.key === url)
                        if (index >= 0) {
                            newMedias[index] = {
                                ...newMedias[index],
                                progress: 1,
                                media: {
                                    ...newMedias[index].media,
                                    mediaURL: result
                                }
                            }
                        } else {
                            console.error('Failed to update media:', url)
                        }
                        return newMedias
                    })
                })
                .catch((e) => {
                    enqueueSnackbar(`Failed to upload media: ${e}`, { variant: 'error' })
                    setMedias((medias) => medias.filter((media) => media.key !== url))
                })
        } else {
            const uploadingText = ' ![uploading...]()'
            setDraft((before) => before + uploadingText)
            const result = await uploadFile(file)
            if (!result) {
                setDraft((before) => before.replace(uploadingText, '') + `\n![upload failed]()`)
            } else {
                if (fileType.startsWith('video')) {
                    setDraft(
                        (before) =>
                            before.replace(uploadingText, '') +
                            `\n<video controls><source src="${result}#t=0.1"></video>`
                    )
                } else {
                    setDraft((before) => before.replace(uploadingText, '') + `\n![image](${result})`)
                }
            }
        }
    }

    const handlePasteFile = async (event: any): Promise<void> => {
        if (!event.clipboardData) return
        for (const item of event.clipboardData.items) {
            const file = item.getAsFile()
            if (!file) continue
            await uploadMedia(file)
        }
    }

    return (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                width: '100%',
                height: '100%',
                overflow: 'hidden'
            }}
            onDragEnter={(e) => {
                setDragging(true)
                e.preventDefault()
                e.stopPropagation()
            }}
            onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
            onDrop={async (e) => {
                setDragging(false)
                e.preventDefault()
                e.stopPropagation()
                const files = e.dataTransfer.files
                if (files.length > 0) {
                    for (const file of files) {
                        await uploadMedia(file)
                    }
                }
            }}
        >
            {sending && (
                <Backdrop
                    sx={{
                        position: 'absolute',
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        height: '100%',
                        color: '#fff'
                    }}
                    open={sending}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>
            )}

            {dragging && (
                <Box
                    sx={{
                        position: 'absolute',
                        zIndex: (theme) => theme.zIndex.drawer,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 'calc(100% - 0.5rem)',
                        height: 'calc(100% - 0.5rem)',
                        borderRadius: 1,
                        border: '2px dashed, rgba(0, 0, 0, 0.2)',
                        margin: '0.25rem',
                        color: 'text.disabled'
                    }}
                    onDragLeave={(e) => {
                        setDragging(false)
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    <CloudUploadIcon
                        sx={{
                            fontSize: '5rem'
                        }}
                    />
                    <Typography>Drop to upload</Typography>
                </Box>
            )}

            <Box
                sx={{
                    ...props.sx,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1
                        }}
                    >
                        <CCIconButton
                            onClick={(e) => {
                                if (ModeSets[mode].selectable) setModeMenuAnchor(e.currentTarget)
                            }}
                        >
                            {ModeSets[mode].icon}
                        </CCIconButton>
                        <TimelinePicker
                            postHome={postHome}
                            setPostHome={() => {
                                setPostHomeButton(!postHomeButton)
                            }}
                            options={props.streamPickerOptions}
                            selected={destTimelines}
                            setSelected={setDestTimelines}
                            placeholder={t('addDestination')}
                            selectedSubprofile={selectedSubprofile}
                            setSelectedSubprofile={setSelectedSubprofile}
                        />
                        {destinationModified && (
                            <CCIconButton
                                onClick={() => {
                                    setDestTimelines(props.streamPickerInitial)
                                    setPostHomeButton(props.defaultPostHome ?? true)
                                    if (props.subprofile) {
                                        client.api
                                            .getProfile<ProfileSchema>(props.subprofile, client.ccid!)
                                            .then((profile) => {
                                                setSelectedSubprofile(profile)
                                            })
                                    } else {
                                        setSelectedSubprofile(undefined)
                                    }
                                }}
                                sx={{
                                    width: '2rem',
                                    height: '2rem'
                                }}
                            >
                                <ReplayIcon
                                    sx={{
                                        fontSize: '1.2rem'
                                    }}
                                />
                            </CCIconButton>
                        )}
                    </Box>
                </Box>
                {mode !== 'reroute' ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            alignItems: 'start',
                            px: 1,
                            flex: 1,
                            cursor: 'text',
                            overflowY: 'auto'
                        }}
                        onClick={() => {
                            if (textInputRef.current) {
                                textInputRef.current.focus()
                            }
                        }}
                    >
                        <InputBase
                            multiline
                            fullWidth
                            value={draft}
                            autoFocus={props.autoFocus}
                            placeholder={props.placeholder ?? t('placeholder')}
                            minRows={props.minRows}
                            maxRows={props.maxRows}
                            onChange={(e) => {
                                setDraft(e.target.value)
                            }}
                            onPaste={(e) => {
                                handlePasteFile(e)
                            }}
                            sx={{
                                width: 1,
                                fontSize: '0.95rem'
                            }}
                            onKeyDown={(e: any) => {
                                if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                                    setHoldCtrlShift(true)
                                }
                                if (draft.length === 0 || draft.trim().length === 0) return
                                if (e.key === 'Enter' && (e.ctrlKey === true || e.metaKey === true) && !sending) {
                                    post(postHome)
                                }
                            }}
                            onKeyUp={(e: any) => {
                                if (e.key === 'Shift' || e.key === 'Control') {
                                    setHoldCtrlShift(false)
                                }
                            }}
                            inputRef={textInputRef}
                        />
                    </Box>
                ) : (
                    <Box p={1} />
                )}

                <Box display="flex" gap={1}>
                    {medias.map((media, i) => (
                        <Paper
                            key={i}
                            elevation={0}
                            sx={{
                                position: 'relative',
                                width: '75px',
                                height: '75px',
                                backgroundImage: `url(${
                                    media.media.mediaType.startsWith('model') ? modelPoster : media.key
                                })`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                            onClick={(e) => {
                                setMediaMenuAnchorEl(e.currentTarget)
                                setSelectedMediaIndex(i)
                            }}
                        >
                            <CCIconButton
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setMedias((medias) => medias.filter((_, j) => i !== j))
                                }}
                                sx={{
                                    position: 'absolute',
                                    backgroundColor: 'background.paper',
                                    p: 0.1,
                                    top: -10,
                                    right: -10
                                }}
                            >
                                <CancelIcon
                                    sx={{
                                        color: 'text.primary'
                                    }}
                                />
                            </CCIconButton>
                            {media.media.flag && (
                                <Tooltip title={media.media.flag} arrow placement="top">
                                    <FeedbackIcon
                                        sx={{
                                            position: 'absolute',
                                            backgroundColor: 'background.paper',
                                            p: 0.1,
                                            bottom: -10,
                                            right: -10
                                        }}
                                    />
                                </Tooltip>
                            )}
                            {media.media.mediaURL === '' && (
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(0, 0, 0, 0.3)'
                                    }}
                                >
                                    <CircularProgress
                                        variant={media.progress === 1 ? 'indeterminate' : 'determinate'}
                                        value={media.progress * 100}
                                        sx={{
                                            color: 'white'
                                        }}
                                    />
                                </Box>
                            )}
                        </Paper>
                    ))}
                </Box>

                {props.mobile ? (
                    <>
                        <Collapse
                            unmountOnExit
                            in={draft.length > 0}
                            sx={{
                                maxHeight: '20%',
                                overflowY: 'auto'
                            }}
                        >
                            <Divider
                                sx={{
                                    my: 1,
                                    borderStyle: 'dashed'
                                }}
                            />
                            <EditorPreview
                                hideActions
                                draft={draft}
                                emojiDict={emojiDict}
                                selectedSubprofileID={selectedSubprofile?.id}
                            />
                        </Collapse>
                        {textInputRef.current && (
                            <>
                                <EmojiSuggestion
                                    mobile
                                    textInputRef={textInputRef.current}
                                    text={draft}
                                    setText={setDraft}
                                    updateEmojiDict={setEmojiDict}
                                />
                                <UserSuggestion
                                    mobile
                                    textInputRef={textInputRef.current}
                                    text={draft}
                                    setText={setDraft}
                                />
                            </>
                        )}
                        <EditorActions
                            post={() => {
                                post(postHome)
                            }}
                            disablePostButton={sending || uploading}
                            draft={draft}
                            setDraft={setDraft}
                            textInputRef={textInputRef}
                            uploadImage={uploadMedia}
                            insertEmoji={insertEmoji}
                            setEmojiDict={setEmojiDict}
                            submitButtonLabel={et(mode)}
                            onAddMedia={
                                mode === 'media'
                                    ? (media) => {
                                          setMedias((medias) => [
                                              ...medias,
                                              { key: media.mediaURL, progress: 1, media }
                                          ])
                                      }
                                    : undefined
                            }
                            whisperUsers={participants}
                            setWhisperUsers={setParticipants}
                            isPrivate={isPrivate}
                        />
                    </>
                ) : (
                    <>
                        {textInputRef.current && (
                            <>
                                <EmojiSuggestion
                                    textInputRef={textInputRef.current}
                                    text={draft}
                                    setText={setDraft}
                                    updateEmojiDict={setEmojiDict}
                                />
                                <UserSuggestion textInputRef={textInputRef.current} text={draft} setText={setDraft} />
                            </>
                        )}
                        <EditorActions
                            post={() => {
                                post(postHome)
                            }}
                            disableMedia={mode === 'plaintext' || mode === 'reroute'}
                            disableEmoji={mode === 'plaintext' || mode === 'reroute'}
                            disablePostButton={sending || uploading}
                            draft={draft}
                            setDraft={setDraft}
                            textInputRef={textInputRef}
                            uploadImage={uploadMedia}
                            insertEmoji={insertEmoji}
                            setEmojiDict={setEmojiDict}
                            submitButtonLabel={et(mode)}
                            onAddMedia={
                                mode === 'media'
                                    ? (media) => {
                                          setMedias((medias) => [
                                              ...medias,
                                              { key: media.mediaURL, progress: 1, media }
                                          ])
                                      }
                                    : undefined
                            }
                            whisperUsers={participants}
                            setWhisperUsers={setParticipants}
                            isPrivate={isPrivate}
                        />
                        <Collapse unmountOnExit in={draft.length > 0}>
                            <Divider
                                sx={{
                                    my: 1,
                                    borderStyle: 'dashed'
                                }}
                            />

                            <EditorPreview
                                draft={draft}
                                emojiDict={emojiDict}
                                selectedSubprofileID={selectedSubprofile?.id}
                            />
                        </Collapse>
                    </>
                )}
            </Box>

            <Menu
                anchorEl={modeMenuAnchor}
                open={Boolean(modeMenuAnchor)}
                onClose={() => {
                    setModeMenuAnchor(null)
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {Object.keys(ModeSets)
                        .filter((key) => ModeSets[key as EditorMode].selectable)
                        .map((key) => (
                            <Tooltip
                                key={key}
                                title={key}
                                arrow
                                placement="right"
                                sx={{
                                    '& .MuiTooltip-tooltip': {
                                        fontSize: '0.8rem'
                                    }
                                }}
                            >
                                <CCIconButton
                                    onClick={() => {
                                        const newMode = key as EditorMode
                                        setMode(newMode)
                                        setModeMenuAnchor(null)

                                        if (mode === 'media' && newMode !== 'media') {
                                            if (newMode !== 'plaintext' && medias.length > 0) {
                                                const mediaLiteral = medias.map((media) => {
                                                    if (media.media.mediaType.startsWith('image')) {
                                                        return `![image](${media.media.mediaURL})`
                                                    } else if (media.media.mediaType.startsWith('video')) {
                                                        return `<video controls><source src="${media.media.mediaURL}#t=0.1"></video>`
                                                    }
                                                    return ''
                                                })
                                                setDraft((draft) => {
                                                    return draft + '\n' + mediaLiteral.join('\n')
                                                })
                                            }
                                            setMedias([])
                                        }
                                    }}
                                >
                                    {ModeSets[key as EditorMode].icon}
                                </CCIconButton>
                            </Tooltip>
                        ))}
                </Box>
            </Menu>
            <Popover
                open={Boolean(mediaMenuAnchorEl)}
                anchorEl={mediaMenuAnchorEl}
                onClose={() => {
                    setMediaMenuAnchorEl(null)
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
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
            >
                <TextField
                    label="URL"
                    value={medias[selectedMediaIndex]?.media.mediaURL}
                    onChange={(e) => {
                        setMedias((medias) => {
                            const newMedias = [...medias]
                            newMedias[selectedMediaIndex] = {
                                ...newMedias[selectedMediaIndex],
                                media: {
                                    ...newMedias[selectedMediaIndex].media,
                                    mediaURL: e.target.value
                                }
                            }
                            return newMedias
                        })
                    }}
                />
                <FormControl>
                    <InputLabel>Type</InputLabel>
                    <Select
                        label="Type"
                        value={medias[selectedMediaIndex]?.media.mediaType}
                        onChange={(e) => {
                            setMedias((medias) => {
                                const newMedias = [...medias]
                                newMedias[selectedMediaIndex] = {
                                    ...newMedias[selectedMediaIndex],
                                    media: {
                                        ...newMedias[selectedMediaIndex].media,
                                        mediaType: e.target.value
                                    }
                                }
                                return newMedias
                            })
                        }}
                    >
                        <MenuItem value="image/png">PNG</MenuItem>
                        <MenuItem value="image/jpeg">JPEG</MenuItem>
                        <MenuItem value="image/gif">GIF</MenuItem>
                        <MenuItem value="video/mp4">MP4</MenuItem>
                        <MenuItem value="video/mov">MOV</MenuItem>
                        <MenuItem value="model/gltf-binary">GLB</MenuItem>
                    </Select>
                </FormControl>
                <CCComboBox
                    label={t('flags')}
                    options={{
                        [t('flag-warn')]: 'warn',
                        [t('flag-nude')]: 'nude',
                        [t('flag-porn')]: 'porn',
                        [t('flag-hard')]: 'hard'
                    }}
                    value={medias[selectedMediaIndex]?.media.flag ?? ''}
                    onChange={(newvalue) => {
                        setMedias((medias) => {
                            const newMedias = [...medias]
                            newMedias[selectedMediaIndex] = {
                                ...newMedias[selectedMediaIndex],
                                media: {
                                    ...newMedias[selectedMediaIndex].media,
                                    flag: newvalue === '' ? undefined : newvalue
                                }
                            }
                            return newMedias
                        })
                    }}
                    helperText={t('freeDescription')}
                />
                <Button
                    onClick={() => {
                        setMediaMenuAnchorEl(null)
                    }}
                >
                    Done
                </Button>
            </Popover>
        </Box>
    )
})

CCPostEditor.displayName = 'CCEditor'
