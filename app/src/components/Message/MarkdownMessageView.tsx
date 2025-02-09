import { type Message, type MarkdownMessageSchema, type RerouteMessageSchema } from '@concrnt/worldlib'
import { MessageViewBase } from './MessageViewBase'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'
import { useMemo } from 'react'

export interface MarkdownMessageViewProps {
    message: Message<MarkdownMessageSchema>
    rerouted?: Message<RerouteMessageSchema>
    userCCID?: string
    beforeMessage?: JSX.Element
    lastUpdated?: number
    forceExpanded?: boolean
    clipHeight?: number
    simple?: boolean
    additionalMenuItems?: JSX.Element | JSX.Element[]
}

export const MarkdownMessageView = (props: MarkdownMessageViewProps): JSX.Element => {
    const renderer = useMemo(
        () => (
            <MarkdownRenderer
                messagebody={props.message.document.body.body ?? 'no content'}
                emojiDict={props.message.document.body.emojis ?? {}}
            />
        ),
        [props.message.id]
    )

    return <MessageViewBase {...props}>{renderer}</MessageViewBase>
}
