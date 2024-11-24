import {
    type Message,
    type ReplyMessageSchema,
    Schemas,
    type MarkdownMessageSchema,
    type RerouteMessageSchema
} from '@concurrent-world/client'
import { Box, Link, Tooltip } from '@mui/material'
import { useMemo } from 'react'

import { Link as RouterLink } from 'react-router-dom'
import { useClient } from '../../context/ClientContext'
import { CCUserIcon } from '../ui/CCUserIcon'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'

import TagIcon from '@mui/icons-material/Tag'
import LockIcon from '@mui/icons-material/Lock'
import { isPrivateTimeline } from '../../util'
import { useGlobalState } from '../../context/GlobalState'
import { SubprofileBadge } from '../ui/SubprofileBadge'

export interface PostedStreamsProps {
    useUserIcon?: boolean
    message: Message<MarkdownMessageSchema | ReplyMessageSchema | RerouteMessageSchema>
}

export const PostedStreams = (props: PostedStreamsProps): JSX.Element => {
    const { client } = useClient()
    const globalState = useGlobalState()

    const postedStreams = useMemo(() => {
        const streams =
            props.message.postedStreams?.filter(
                (stream) =>
                    (stream.schema === Schemas.communityTimeline &&
                        (stream.author === client.ccid || stream.indexable)) ||
                    stream.schema === Schemas.emptyTimeline ||
                    stream.schema === Schemas.subprofileTimeline ||
                    globalState.allKnownTimelines.map((t) => t.id).includes(stream.id)
            ) ?? []
        const uniq = [...new Set(streams)]
        return uniq
    }, [props.message])

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
                        color: 'text.secondary'
                    }}
                />
            )}
            {postedStreams.map((e) => {
                const isPrivate = isPrivateTimeline(e)

                switch (e.schema) {
                    case Schemas.communityTimeline:
                        return (
                            <Link
                                key={e.id}
                                component={RouterLink}
                                to={'/timeline/' + e.cacheKey ?? e.id}
                                underline="hover"
                                sx={{
                                    fontweight: '400',
                                    fontSize: '12px',
                                    color: 'text.secondary',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center'
                                }}
                            >
                                {isPrivate ? (
                                    <LockIcon sx={{ height: '1rem', width: '1rem' }} />
                                ) : (
                                    <TagIcon sx={{ height: '1rem', width: '1rem' }} />
                                )}
                                {e.document.body.shortname || e.document.body.name}
                            </Link>
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
                                        color: 'text.secondary'
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
                                        color: 'text.secondary'
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
