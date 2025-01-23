import {
    type Message,
    type ReplyMessageSchema,
    Schemas,
    type MarkdownMessageSchema,
    type RerouteMessageSchema
} from '@concurrent-world/client'
import { Box, Tooltip } from '@mui/material'
import { useCallback, useMemo, useRef } from 'react'

import { useClient } from '../../context/ClientContext'
import { CCUserIcon } from '../ui/CCUserIcon'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'

import TagIcon from '@mui/icons-material/Tag'
import LockIcon from '@mui/icons-material/Lock'
import { isPrivateTimeline } from '../../util'
import { useGlobalState } from '../../context/GlobalState'
import { SubprofileBadge } from '../ui/SubprofileBadge'
import { CCLink } from '../ui/CCLink'
import { useTimelineDrawer } from '../../context/TimelineDrawer'

export interface PostedStreamsProps {
    useUserIcon?: boolean
    message: Message<MarkdownMessageSchema | ReplyMessageSchema | RerouteMessageSchema>
}

export const PostedStreams = (props: PostedStreamsProps): JSX.Element => {
    const { client } = useClient()
    const { allKnownTimelines } = useGlobalState()

    const timelineDrawer = useTimelineDrawer()

    const postedStreams = useMemo(() => {
        const streams =
            props.message.postedStreams?.filter(
                (stream) =>
                    (stream.schema === Schemas.communityTimeline &&
                        (stream.author === client.ccid || stream.indexable)) ||
                    stream.schema === Schemas.emptyTimeline ||
                    stream.schema === Schemas.subprofileTimeline ||
                    allKnownTimelines.map((t) => t.id).includes(stream.id)
            ) ?? []
        const uniq = [...new Set(streams)]
        return uniq
    }, [props.message])

    const ButtonTimer = useRef<NodeJS.Timeout | null>(null)
    const ButtonOnPress = useCallback(
        (event: React.MouseEvent<HTMLAnchorElement> | React.TouchEvent<HTMLAnchorElement>, id: string) => {
            ButtonTimer.current = setTimeout(() => {
                event.preventDefault()
                timelineDrawer.open(id)
                ButtonTimer.current = null
            }, 500)
        },
        []
    )

    const ButtonOnRelease = useCallback(() => {
        if (ButtonTimer.current) {
            if (ButtonTimer.current) {
                clearTimeout(ButtonTimer.current)
                ButtonTimer.current = null
            }
        }
    }, [])

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 0.5,
                ml: 'auto'
            }}
        >
            {postedStreams.length === 0 && (
                <HelpOutlineIcon
                    sx={{
                        height: '1rem',
                        width: '1rem',
                        color: 'text.primary'
                    }}
                />
            )}
            {postedStreams.map((e) => {
                const isPrivate = isPrivateTimeline(e)

                switch (e.schema) {
                    case Schemas.communityTimeline:
                        return (
                            <CCLink
                                key={e.id}
                                to={'/timeline/' + e.cacheKey ?? e.id}
                                underline="hover"
                                sx={{
                                    fontweight: '400',
                                    fontSize: '12px',
                                    color: 'text.primary',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    flexShrink: 0
                                }}
                                onMouseDown={(event) => {
                                    ButtonOnPress(event, e.id)
                                }}
                                onMouseUp={ButtonOnRelease}
                                onTouchStart={(event) => {
                                    ButtonOnPress(event, e.id)
                                }}
                                onTouchEnd={ButtonOnRelease}
                            >
                                {isPrivate ? (
                                    <LockIcon sx={{ height: '1rem', width: '1rem' }} />
                                ) : (
                                    <TagIcon sx={{ height: '1rem', width: '1rem' }} />
                                )}
                                {e.document.body.shortname || e.document.body.name}
                            </CCLink>
                        )
                    case Schemas.emptyTimeline:
                        return props.useUserIcon ? (
                            <CCUserIcon
                                key={e.id}
                                sx={{
                                    height: '1rem',
                                    width: '1rem'
                                }}
                                ccid={e.author}
                            />
                        ) : (
                            <Tooltip
                                key={e.id}
                                arrow
                                placement="top"
                                title={
                                    <CCUserIcon
                                        sx={{
                                            height: '1rem',
                                            width: '1rem'
                                        }}
                                        ccid={e.author}
                                    />
                                }
                            >
                                <HomeOutlinedIcon
                                    sx={{
                                        height: '1rem',
                                        width: '1rem',
                                        color: 'text.primary'
                                    }}
                                />
                            </Tooltip>
                        )
                    case Schemas.subprofileTimeline:
                        return props.useUserIcon ? (
                            <SubprofileBadge
                                key={e.id}
                                characterID={e.document.body.subprofile}
                                authorCCID={e.author}
                                sx={{
                                    height: '1rem',
                                    width: '1rem'
                                }}
                            />
                        ) : (
                            <Tooltip
                                key={e.id}
                                arrow
                                placement="top"
                                title={
                                    <SubprofileBadge
                                        characterID={e.document.body.subprofile}
                                        authorCCID={e.author}
                                        sx={{
                                            height: '1rem',
                                            width: '1rem'
                                        }}
                                    />
                                }
                            >
                                <HomeOutlinedIcon
                                    sx={{
                                        height: '1rem',
                                        width: '1rem',
                                        color: 'text.primary'
                                    }}
                                />
                            </Tooltip>
                        )
                    default:
                        return null
                }
            })}
        </Box>
    )
}
