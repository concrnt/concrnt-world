import { type Message, type MarkdownMessageSchema, type RerouteMessageSchema } from '@concrnt/worldlib'
import { MessageViewBase } from './MessageViewBase'
import { useMemo } from 'react'
import { CfmRenderer } from '../ui/CfmRenderer'
import { TranslatorProvider } from '../../context/Translator'

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
            <CfmRenderer
                messagebody={props.message.document.body.body ?? 'no content'}
                emojiDict={props.message.document.body.emojis ?? {}}
            />
        ),
        [props.message.id]
    )

    return (
        <TranslatorProvider originalText={props.message.document.body.body ?? 'no content'}>
            <MessageViewBase {...props}>{renderer}</MessageViewBase>
        </TranslatorProvider>
    )
}
