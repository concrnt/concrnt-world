import {
    type Association,
    type ReactionAssociationSchema,
    type Message,
    type ReplyMessageSchema,
    type MarkdownMessageSchema,
    type User,
    MediaMessageSchema,
    UserProfile
} from '@concrnt/worldlib'
import { ContentWithCCAvatar } from '../ContentWithCCAvatar'
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material'
import { TimeDiff } from '../ui/TimeDiff'
import { useEffect, useState } from 'react'
import { CfmRendererLite } from '../ui/CfmRendererLite'

import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { useClient } from '../../context/ClientContext'

import { FaTheaterMasks } from 'react-icons/fa'
import { CCLink } from '../ui/CCLink'
import { CCImage } from '../ui/CCImage'
import { useTranslation } from 'react-i18next'

export interface ReactionAssociationProps {
    association: Association<ReactionAssociationSchema>
    perspective?: string
    withoutContent?: boolean
}

export const ReactionAssociation = (props: ReactionAssociationProps): JSX.Element => {
    const { client } = useClient()
    const { t } = useTranslation('', { keyPrefix: 'pages.associations' })
    const [target, setTarget] = useState<Message<
        MarkdownMessageSchema | ReplyMessageSchema | MediaMessageSchema
    > | null>(null)
    const isMeToOther = props.association?.authorUser?.ccid !== props.perspective

    const Nominative = props.association?.authorProfile.username ?? 'anonymous'
    const Possessive = (target?.authorProfile.username ?? 'anonymous') + "'s"

    const actionUser: User | undefined = isMeToOther ? props.association.authorUser : target?.authorUser
    const actionUserProfile: UserProfile = isMeToOther ? props.association.authorProfile : target?.authorProfile!

    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

    const masked =
        (isMeToOther ? props.association.authorProfile.original : target?.authorProfile.original) !== undefined

    const targetLink = target ? `/${target.author}/${target.id}` : '#' // Link to reacted message
    useEffect(() => {
        props.association.getTargetMessage().then(setTarget)
    }, [props.association])

    if (!target) {
        return <></>
    }

    return (
        <ContentWithCCAvatar author={actionUser} linkTo={targetLink} profile={actionUserProfile}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" overflow="hidden">
                    <Box display="flex" alignItems="center" flexShrink={0} gap={0.5}>
                        <CCLink
                            underline="hover"
                            color="inherit"
                            to={props.association.author ? `/${props.association.author}` : '#'}
                        >
                            <Typography style={{ fontWeight: isMeToOther ? 600 : 'inherit' }}>{Nominative}</Typography>
                        </CCLink>
                        {masked && <FaTheaterMasks />}
                        <Typography>reacted</Typography>
                        <Typography style={{ fontWeight: !isMeToOther ? 600 : 'inherit' }}>{Possessive}</Typography>
                        <Typography>message with </Typography>
                        <img
                            height="13px"
                            src={props.association.document.body.imageUrl}
                            alt={props.association.document.body.shortcode}
                        />
                    </Box>
                </Box>
                <Box display="flex" gap={0.5}>
                    {(props.association.author === client?.ccid || props.association.owner === client?.ccid) && (
                        <IconButton
                            sx={{
                                width: { xs: '12px', sm: '18px' },
                                height: { xs: '12px', sm: '18px' },
                                color: 'text.disabled'
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                setMenuAnchor(e.currentTarget)
                            }}
                        >
                            <MoreHorizIcon sx={{ fontSize: '80%' }} />
                        </IconButton>
                    )}
                    <CCLink fontSize="0.75rem" to={targetLink}>
                        <TimeDiff date={new Date(props.association.cdate)} />
                    </CCLink>
                </Box>
            </Box>
            {(target && !props.withoutContent && (
                <>
                    <blockquote style={{ margin: 0, paddingLeft: '1rem', borderLeft: '4px solid #ccc' }}>
                        <CfmRendererLite
                            messagebody={target?.document.body.body ?? 'no content'}
                            emojiDict={target?.document.body.emojis ?? {}}
                        />
                    </blockquote>
                    {'medias' in target.document.body && (
                        <Box
                            display="flex"
                            gap={1}
                            flexWrap="wrap"
                            justifyContent="flex-start"
                            sx={{
                                marginTop: '0.5rem',
                                marginBottom: '0.5rem'
                            }}
                        >
                            {target.document.body.medias?.map((media, i) => (
                                <CCImage
                                    key={i}
                                    src={media.mediaURL}
                                    blurhash={media.blurhash}
                                    sx={{
                                        width: '75px',
                                        height: '75px'
                                    }}
                                    forceBlur={!!media.flag}
                                />
                            ))}
                        </Box>
                    )}
                </>
            )) ||
                undefined}
            <Box
                onClick={(e) => {
                    e.stopPropagation() // prevent to navigate other page
                }}
            >
                <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => {
                        setMenuAnchor(null)
                    }}
                >
                    <MenuItem
                        onClick={() => {
                            props.association.delete()
                            setMenuAnchor(null)
                        }}
                    >
                        <ListItemIcon>
                            <DeleteForeverIcon sx={{ color: 'text.primary' }} />
                        </ListItemIcon>
                        <ListItemText>{t('removeAssociation')}</ListItemText>
                    </MenuItem>
                </Menu>
            </Box>
        </ContentWithCCAvatar>
    )
}
