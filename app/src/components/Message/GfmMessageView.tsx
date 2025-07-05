import { type Message, type MarkdownMessageSchema, type RerouteMessageSchema } from '@concrnt/worldlib'
import { MessageViewBase } from './MessageViewBase'
import { lazy, Suspense, useMemo } from 'react'
import { TranslatorProvider } from '../../context/Translator'

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
                <GfmRenderer messagebody={props.message.document.body.body ?? 'no content'} />
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
