import { type RerouteMessageSchema, type Message, type MediaMessageSchema } from '@concrnt/worldlib'
import { EmbeddedGallery } from '../ui/EmbeddedGallery'
import { MessageViewBase } from './MessageViewBase'
import { useMemo } from 'react'
import { CfmRenderer } from '../ui/CfmRenderer'
import { TranslatorProvider } from '../../context/Translator'

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
            <CfmRenderer
                messagebody={props.message.document.body.body ?? 'no content'}
                emojiDict={props.message.document.body.emojis ?? {}}
            />
        ),
        [props.message.id]
    )

    return (
        <TranslatorProvider originalText={props.message.document.body.body ?? 'no content'}>
            <MessageViewBase {...props} afterMessage={gallery}>
                {renderer}
            </MessageViewBase>
        </TranslatorProvider>
    )
}
