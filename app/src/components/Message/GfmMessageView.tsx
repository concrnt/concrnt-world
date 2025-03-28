import { type Message, type MarkdownMessageSchema, type RerouteMessageSchema } from '@concrnt/worldlib'
import { MessageViewBase } from './MessageViewBase'
import { lazy, Suspense, useMemo } from 'react'

const GfmRenderer = lazy(() => import('../ui/GfmRenderer'))

export interface GfmMessageViewProps {
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

export const GfmMessageView = (props: GfmMessageViewProps): JSX.Element => {
    const renderer = useMemo(
        () => (
            <Suspense fallback={<div>Loading...</div>}>
                <GfmRenderer
                    messagebody={props.message.document.body.body ?? 'no content'}
                    emojiDict={props.message.document.body.emojis ?? {}}
                />
            </Suspense>
        ),
        [props.message.id]
    )

    return <MessageViewBase {...props}>{renderer}</MessageViewBase>
}
