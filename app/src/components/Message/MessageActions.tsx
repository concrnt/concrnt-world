import { Box, Link, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import ReplyIcon from '@mui/icons-material/Reply'
import { CCAvatar } from '../ui/CCAvatar'
import StarIcon from '@mui/icons-material/Star'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import AddReactionIcon from '@mui/icons-material/AddReaction'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import RepeatIcon from '@mui/icons-material/Repeat'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import LinkIcon from '@mui/icons-material/Link'
import GTranslateIcon from '@mui/icons-material/GTranslate'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import IosShareIcon from '@mui/icons-material/IosShare'
import TranslateIcon from '@mui/icons-material/Translate'
import {
    type Association,
    type LikeAssociationSchema,
    type Message,
    type ReplyMessageSchema,
    Schemas,
    type MarkdownMessageSchema
} from '@concrnt/worldlib'
import { useState } from 'react'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
// import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove'
import { useEmojiPicker } from '../../context/EmojiPickerContext'
import { Link as RouterLink } from 'react-router-dom'
import { IconButtonWithNumber } from '../ui/IconButtonWithNumber'
import { useInspector } from '../../context/Inspector'
import { enqueueSnackbar } from 'notistack'
import { usePreference } from '../../context/PreferenceContext'
import { useConcord } from '../../context/ConcordContext'
import { useEditorModal } from '../EditorModal'
import { useConfirm } from '../../context/Confirm'
import { useTranslation } from 'react-i18next'
import { convertToGoogleTranslateCode } from '../../util'
import { useGlobalState } from '../../context/GlobalState'
import { MarkdownMessageView } from './MarkdownMessageView'
import { useTranslator } from '../../context/Translator'
import { haptic } from 'ios-haptics'

export interface MessageActionsProps {
    message: Message<MarkdownMessageSchema | ReplyMessageSchema>
    userCCID?: string
}

export const MessageActions = (props: MessageActionsProps): JSX.Element => {
    const inspector = useInspector()
    const concord = useConcord()
    const [enableConcord] = usePreference('enableConcord')
    const editorModal = useEditorModal()
    const { isMobileSize } = useGlobalState()

    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

    const confirm = useConfirm()

    const ownFavorite = props.message?.ownAssociations.find(
        (association) => association.schema === Schemas.likeAssociation
    )
    const [favoriteMembers, setFavoriteMembers] = useState<Array<Association<LikeAssociationSchema>>>([])

    const replyCount = props.message.associationCounts?.[Schemas.replyAssociation] ?? 0
    const likeCount = props.message.associationCounts?.[Schemas.likeAssociation] ?? 0
    const rerouteCount = props.message.associationCounts?.[Schemas.rerouteAssociation] ?? 0

    const emojiPicker = useEmojiPicker()

    const loadFavoriteMembers = (): void => {
        props.message.getFavorites().then((favorites) => {
            setFavoriteMembers(favorites)
        })
    }
    const translator = useTranslator()

    const { t, i18n } = useTranslation('', { keyPrefix: 'ui.messageActions' })
    const { translate } = useTranslator()

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: 'min(60vw, 300px)',
                    flexShrink: 0
                }}
            >
                {/* left */}
                <IconButtonWithNumber
                    icon={<ReplyIcon sx={{ fontSize: { xs: '70%', sm: '80%' } }} />}
                    onClick={(e) => {
                        e.stopPropagation()
                        editorModal.open({
                            mode: 'reply',
                            target: props.message,
                            streamPickerInitial: props.message.postedTimelines?.filter(
                                (t) => t.schema === Schemas.communityTimeline
                            )
                        })
                    }}
                    message={replyCount}
                />
                <IconButtonWithNumber
                    icon={<RepeatIcon sx={{ fontSize: { xs: '70%', sm: '80%' } }} />}
                    onClick={(e) => {
                        e.stopPropagation()
                        editorModal.open({
                            mode: 'reroute',
                            target: props.message
                        })
                    }}
                    message={rerouteCount}
                />
                <Tooltip
                    arrow
                    title={
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1
                            }}
                        >
                            {favoriteMembers.map((fav) => (
                                <Box
                                    key={fav.author}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        textDecoration: 'none'
                                    }}
                                    component={RouterLink}
                                    to={
                                        fav.document.meta?.apActorId
                                            ? `/ap/${fav.document.meta.apActorId}`
                                            : `/${fav.author}`
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation()
                                    }}
                                >
                                    <CCAvatar
                                        sx={{
                                            height: '20px',
                                            width: '20px'
                                        }}
                                        avatarURL={fav.authorProfile.avatar}
                                        identiconSource={fav.author}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: '0.8rem',
                                            color: '#fff'
                                        }}
                                    >
                                        {fav.authorProfile.username ?? 'anonymous'}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    }
                    placement="top"
                    disableHoverListener={likeCount === 0}
                    onOpen={() => {
                        loadFavoriteMembers()
                    }}
                >
                    <IconButtonWithNumber
                        icon={
                            ownFavorite ? (
                                <StarIcon sx={{ fontSize: { xs: '70%', sm: '80%' } }} />
                            ) : (
                                <StarOutlineIcon sx={{ fontSize: { xs: '70%', sm: '80%' } }} />
                            )
                        }
                        onClick={(e) => {
                            e.stopPropagation()
                            haptic()
                            if (ownFavorite) {
                                props.message.deleteAssociation(ownFavorite)
                            } else {
                                props.message.favorite().catch(() => {
                                    enqueueSnackbar(t('common.communicationFailed'), { variant: 'error' })
                                })
                            }
                        }}
                        message={likeCount}
                    />
                </Tooltip>
                <IconButtonWithNumber
                    icon={<AddReactionIcon sx={{ fontSize: { xs: '70%', sm: '80%' } }} />}
                    onClick={(e) => {
                        e.stopPropagation()
                        emojiPicker.open(e.currentTarget, (emoji) => {
                            props.message.reaction(emoji.shortcode, emoji.imageURL).catch(() => {
                                enqueueSnackbar(t('common.communicationFailed'), { variant: 'error' })
                            })
                            emojiPicker.close()
                        })
                    }}
                    message={0}
                />
                <IconButtonWithNumber
                    icon={<MoreHorizIcon sx={{ fontSize: { xs: '70%', sm: '80%' } }} />}
                    onClick={(e) => {
                        setMenuAnchor(e.currentTarget)
                    }}
                    message={0}
                />
            </Box>
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null)
                }}
                onClick={(e) => {
                    e.stopPropagation()
                }}
            >
                {isMobileSize ? (
                    <MenuItem
                        onClick={(e) => {
                            e.stopPropagation()
                            navigator.share({
                                title: props.message.document.body.body,
                                text: props.message.document.body.body,
                                url: 'https://concrnt.world/' + props.message.author + '/' + props.message.id
                            })
                            setMenuAnchor(null)
                        }}
                    >
                        <ListItemIcon>
                            <IosShareIcon sx={{ color: 'text.primary' }} />
                        </ListItemIcon>
                        <ListItemText>{t('share')}</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem
                        onClick={(e) => {
                            const userid = props.message.authorUser?.alias ?? props.message.author
                            navigator.clipboard.writeText('https://concrnt.world/' + userid + '/' + props.message.id)
                            enqueueSnackbar(t('linkCopied'), { variant: 'success' })
                            setMenuAnchor(null)
                        }}
                    >
                        <ListItemIcon>
                            <LinkIcon sx={{ color: 'text.primary' }} />
                        </ListItemIcon>
                        <ListItemText>{t('copyLink')}</ListItemText>
                    </MenuItem>
                )}
                <MenuItem
                    onClick={(e) => {
                        props.message.document.body.body &&
                            navigator.clipboard.writeText(props.message.document.body.body)
                        setMenuAnchor(null)
                    }}
                >
                    <ListItemIcon>
                        <ContentPasteIcon sx={{ color: 'text.primary' }} />
                    </ListItemIcon>
                    <ListItemText>{t('copySource')}</ListItemText>
                </MenuItem>
                {enableConcord && (
                    <MenuItem
                        onClick={(e) => {
                            concord.draftSuperReaction(props.message)
                            setMenuAnchor(null)
                        }}
                    >
                        <ListItemIcon>
                            <AutoAwesomeIcon sx={{ color: 'text.primary' }} />
                        </ListItemIcon>
                        <ListItemText>{t('superReaction')}</ListItemText>
                    </MenuItem>
                )}
                {translator.isAvailable ? (
                    <MenuItem
                        onClick={(e) => {
                            translate()
                            setMenuAnchor(null)
                        }}
                    >
                        <ListItemIcon>
                            <TranslateIcon sx={{ color: 'text.primary' }} />
                        </ListItemIcon>
                        <ListItemText>{t('translate')}</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem
                        component={Link}
                        href={`https://translate.google.com/?sl=auto&tl=${convertToGoogleTranslateCode(
                            i18n.language
                        )}&text=${props.message.document.body.body}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                            setMenuAnchor(null)
                        }}
                    >
                        <ListItemIcon>
                            <GTranslateIcon sx={{ color: 'text.primary' }} />
                        </ListItemIcon>
                        <ListItemText>
                            {t('translate')}{' '}
                            <OpenInNewIcon
                                sx={{
                                    fontSize: 'small',
                                    verticalAlign: 'middle'
                                }}
                            />
                        </ListItemText>
                    </MenuItem>
                )}
                <MenuItem
                    onClick={(e) => {
                        e.stopPropagation()
                        inspector.inspectItem({ messageId: props.message.id, author: props.message.author })
                        setMenuAnchor(null)
                    }}
                >
                    <ListItemIcon>
                        <ManageSearchIcon sx={{ color: 'text.primary' }} />
                    </ListItemIcon>
                    <ListItemText>{t('inspect')}</ListItemText>
                </MenuItem>
                {/*
                    {service?.removeFromStream && props.message.author.ccid === props.userCCID && (
                        <MenuItem
                            onClick={() => {
                                service?.removeFromStream?.()
                            }}
                        >
                            <ListItemIcon>
                                <PlaylistRemoveIcon sx={{ color: 'text.primary' }} />
                            </ListItemIcon>
                            <ListItemText>{t('removeFromStream')}</ListItemText>
                        </MenuItem>
                    )}
                */}
                {props.message.author === props.userCCID && (
                    <MenuItem
                        onClick={(e) => {
                            e.stopPropagation()
                            confirm.open(
                                t('reallyDelete'),
                                () => {
                                    props.message.delete()
                                },
                                {
                                    confirmText: t('confirmDelete'),
                                    description: <MarkdownMessageView message={props.message} simple />
                                }
                            )
                        }}
                    >
                        <ListItemIcon>
                            <DeleteForeverIcon color="error" />
                        </ListItemIcon>
                        <ListItemText sx={{ color: 'error.main' }}>{t('delete')}</ListItemText>
                    </MenuItem>
                )}
            </Menu>
        </>
    )
}
