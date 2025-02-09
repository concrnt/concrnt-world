import { type RerouteMessageSchema, type Message, type MediaMessageSchema } from '@concrnt/worldlib'
import { EmbeddedGallery } from '../ui/EmbeddedGallery'
import { MessageViewBase } from './MessageViewBase'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'
import { useMemo } from 'react'

export interface MediaMessageViewProps {
    message: Message<MediaMessageSchema>
    rerouted?: Message<RerouteMessageSchema>
    userCCID?: string
    beforeMessage?: JSX.Element
    lastUpdated?: number
    forceExpanded?: boolean
    clipHeight?: number
    simple?: boolean
    additionalMenuItems?: JSX.Element | JSX.Element[]
}

export const MediaMessageView = (props: MediaMessageViewProps): JSX.Element => {
    const gallery = useMemo(() => {
        if (props.message.document.body.medias) {
            return <EmbeddedGallery medias={props.message.document.body.medias} />
        }
    }, [props.message.id])

    const renderer = useMemo(
        () => (
            <MarkdownRenderer
                messagebody={props.message.document.body.body ?? 'no content'}
                emojiDict={props.message.document.body.emojis ?? {}}
            />
        ),
        [props.message.id]
    )

    return (
        <MessageViewBase {...props} afterMessage={gallery}>
            {renderer}
        </MessageViewBase>
    )
}
