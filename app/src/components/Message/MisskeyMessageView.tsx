import { type Message, type MarkdownMessageSchema, type RerouteMessageSchema } from '@concrnt/worldlib'
import { MessageViewBase } from './MessageViewBase'
import { lazy, Suspense, useMemo } from 'react'
import { TranslatorProvider } from '../../context/Translator'

const MfmRenderer = lazy(() => import('../ui/MfmRenderer'))

export interface MisskeyMessageViewProps {
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

export const MisskeyMessageView = (props: MisskeyMessageViewProps): JSX.Element => {
    const renderer = useMemo(
        () => (
            <Suspense fallback={<div>Loading...</div>}>
                <MfmRenderer
                    messagebody={props.message.document.body.body ?? 'no content'}
                    emojiDict={props.message.document.body.emojis ?? {}}
                />
            </Suspense>
        ),
        [props.message.id]
    )

    return (
        <TranslatorProvider originalText={props.message.document.body.body ?? 'no content'}>
            <MessageViewBase {...props}>{renderer}</MessageViewBase>
        </TranslatorProvider>
    )
}
