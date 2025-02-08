import { type RerouteMessageSchema, type Message, type MediaMessageSchema } from '@concrnt/worldlib'
import { EmbeddedGallery } from '../ui/EmbeddedGallery'
import { MessageViewBase } from './MessageViewBase'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'

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
    return (
        <MessageViewBase
            {...props}
            afterMessage={
                <>
                    {props.message.document.body.medias && (
                        <EmbeddedGallery medias={props.message.document.body.medias} />
                    )}
                </>
            }
        >
            <MarkdownRenderer
                messagebody={props.message.document.body.body ?? 'no content'}
                emojiDict={props.message.document.body.emojis ?? {}}
            />
        </MessageViewBase>
    )
}
