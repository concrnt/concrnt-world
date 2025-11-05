import { Box, Button, Typography, alpha, useTheme } from '@mui/material'
import { MessageHeader } from './MessageHeader'
import { MessageActions } from './MessageActions'
import { MessageReactions } from './MessageReactions'
import { type RerouteMessageSchema, type Message, Schemas } from '@concrnt/worldlib'
import { PostedTimelines } from './PostedTimelines'
import { ContentWithCCAvatar } from '../ContentWithCCAvatar'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ReplayIcon from '@mui/icons-material/Replay'
import { useMemo, useState } from 'react'
import { AutoSummaryProvider } from '../../context/AutoSummaryContext'
import { useTranslator } from '../../context/Translator'
import { useTranslation } from 'react-i18next'

export interface MessageViewProps {
    message: Message<any>
    rerouted?: Message<RerouteMessageSchema>
    userCCID?: string
    beforeMessage?: JSX.Element
    lastUpdated?: number
    forceExpanded?: boolean
    clipHeight?: number
    simple?: boolean
    additionalMenuItems?: JSX.Element | JSX.Element[]
    children?: JSX.Element
    afterMessage?: JSX.Element
}

const gradationHeight = 80

export const MessageViewBase = (props: MessageViewProps): JSX.Element => {
    const theme = useTheme()
    const clipHeight = props.clipHeight ?? 450
    const [expanded, setExpanded] = useState(props.forceExpanded ?? false)

    const { t } = useTranslation('', { keyPrefix: 'common' })
    const { translatedText, processing } = useTranslator()

    const reroutedsame = useMemo(() => {
        if (!props.rerouted) return false
        const A =
            props.rerouted.postedTimelines?.filter(
                (timeline) => timeline.schema === Schemas.communityTimeline || timeline.schema === Schemas.emptyTimeline
            ) ?? []
        const B =
            props.message.postedTimelines?.filter(
                (timeline) => timeline.schema === Schemas.communityTimeline || timeline.schema === Schemas.emptyTimeline
            ) ?? []
        if (A.length !== B.length) return false
        const Aids = A.map((e) => e.id).sort()
        const Bids = B.map((e) => e.id).sort()
        return Aids.every((v, i) => v === Bids[i])
    }, [props.rerouted, props.message])

    const apId = props.message.document.meta?.apActorId

    return (
        <ContentWithCCAvatar
            message={props.message}
            profile={props.message.authorProfile}
            author={props.message.authorUser}
            apId={apId}
        >
            <MessageHeader
                message={props.message}
                additionalMenuItems={props.additionalMenuItems}
                timeLink={props.message.document.meta?.apObjectRef} // Link to external message
            />
            {props.beforeMessage}
            <AutoSummaryProvider limit={props.simple ? 0 : 1}>
                <Box
                    sx={{
                        position: 'relative',
                        maxHeight: expanded ? 'none' : `${clipHeight}px`,
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            display: expanded ? 'none' : 'flex',
                            position: 'absolute',
                            top: `${clipHeight - gradationHeight}px`,
                            left: '0',
                            width: '100%',
                            height: `${gradationHeight}px`,
                            background: `linear-gradient(${alpha(theme.palette.background.paper, 0)}, ${
                                theme.palette.background.paper
                            })`,
                            alignItems: 'center',
                            zIndex: 1,
                            justifyContent: 'center'
                        }}
                    >
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={(e) => {
                                e.stopPropagation()
                                setExpanded(true)
                            }}
                        >
                            {t('showMore')}
                        </Button>
                    </Box>
                    <Box itemProp="articleBody">{props.children}</Box>
                </Box>
                <>
                    {processing && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t('translating')}
                        </Typography>
                    )}
                    {translatedText && (
                        <>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {t('translatedByChromeLLM')}
                            </Typography>
                            <Typography>{translatedText}</Typography>
                        </>
                    )}
                </>
                {props.afterMessage}
            </AutoSummaryProvider>
            {(!props.simple && (
                <>
                    <MessageReactions message={props.message} />
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row-reverse',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: 1,
                            mt: 1
                        }}
                    >
                        <Box display="flex" flexDirection="row" alignItems="center">
                            <PostedTimelines useUserIcon={!!props.rerouted} message={props.message} />
                            {props.rerouted &&
                                (reroutedsame ? (
                                    <ReplayIcon sx={{ color: 'text.secondary', fontSize: '90%' }} />
                                ) : (
                                    <>
                                        <ArrowForwardIcon sx={{ color: 'text.secondary', fontSize: '90%' }} />
                                        <PostedTimelines useUserIcon message={props.rerouted} />
                                    </>
                                ))}
                        </Box>
                        <Box
                            flex={1}
                            display="flex"
                            flexDirection="row"
                            alignItems="center"
                            justifyContent="flex-start"
                        >
                            <MessageActions message={props.message} userCCID={props.userCCID} />
                        </Box>
                    </Box>
                </>
            )) ||
                undefined}
        </ContentWithCCAvatar>
    )
}
