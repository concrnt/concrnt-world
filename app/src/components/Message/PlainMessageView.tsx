import { Typography } from '@mui/material'
import { type Message, type PlaintextMessageSchema, type RerouteMessageSchema } from '@concrnt/worldlib'
import { MessageViewBase } from './MessageViewBase'
import { TranslatorProvider } from '../../context/Translator'

export interface PlainMessageViewProps {
    message: Message<PlaintextMessageSchema>
    rerouted?: Message<RerouteMessageSchema>
    userCCID?: string
    beforeMessage?: JSX.Element
    lastUpdated?: number
    forceExpanded?: boolean
    clipHeight?: number
    simple?: boolean
    additionalMenuItems?: JSX.Element | JSX.Element[]
}

export const PlainMessageView = (props: PlainMessageViewProps): JSX.Element => {
    return (
        <TranslatorProvider originalText={props.message.document.body.body ?? 'no content'}>
            <MessageViewBase {...props}>
                <Typography
                    sx={{
                        whiteSpace: 'pre-wrap'
                    }}
                >
                    {props.message.document.body.body}
                </Typography>
            </MessageViewBase>
        </TranslatorProvider>
    )
}
