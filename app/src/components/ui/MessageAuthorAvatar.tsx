import { useEffect, useState } from 'react'
import { useClient } from '../../context/ClientContext'
import { CCAvatar } from './CCAvatar'
import {
    type Message,
    type ReplyMessageSchema,
    type RerouteMessageSchema,
    type MarkdownMessageSchema,
    type MediaMessageSchema,
    type PlaintextMessageSchema
} from '@concrnt/worldlib'
import { Skeleton, SxProps } from '@mui/material'
import { SubprofileBadge } from './SubprofileBadge'

export interface MessageAuthorAvatarProps {
    messageID: string
    messageOwner: string
    resolveHint?: string
    circle?: boolean
    sx?: SxProps
}

export const MessageAuthorAvatar = (props: MessageAuthorAvatarProps): JSX.Element => {
    const { client } = useClient()

    const [message, setMessage] = useState<Message<
        MarkdownMessageSchema | ReplyMessageSchema | RerouteMessageSchema | PlaintextMessageSchema | MediaMessageSchema
    > | null>()

    useEffect(() => {
        client
            .getMessage<any>(props.messageID, props.messageOwner, props.resolveHint)
            .then((msg) => {
                setMessage(msg)
            })
            .catch((e) => {
                console.error('Failed to fetch message for avatar', e)
            })
    }, [props.messageID, props.messageOwner])

    if (!message) {
        return <Skeleton variant={props.circle ? 'circular' : 'rectangular'} sx={props.sx} />
    }

    if (message.document.body.profileOverride?.profileID) {
        return (
            <SubprofileBadge
                circle={props.circle}
                characterID={message.document.body.profileOverride.profileID}
                authorCCID={props.messageOwner}
                sx={props.sx}
            />
        )
    }

    return (
        <CCAvatar
            alt={message.authorUser?.profile?.username}
            avatarURL={message.authorUser?.profile?.avatar}
            identiconSource={props.messageOwner}
            avatarOverride={message.document.body.profileOverride?.avatar}
            sx={props.sx}
            circle={props.circle}
        />
    )
}
