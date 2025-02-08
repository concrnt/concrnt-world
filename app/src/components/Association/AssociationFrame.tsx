import { memo, useEffect, useMemo, useState } from 'react'
import {
    type Association,
    type ReactionAssociationSchema,
    type LikeAssociationSchema,
    type ReplyAssociationSchema,
    type RerouteAssociationSchema,
    Schemas,
    type ReadAccessRequestAssociationSchema
} from '@concrnt/worldlib'
import { useClient } from '../../context/ClientContext'
import { Box, ListItem, type SxProps, Typography, alpha, useTheme } from '@mui/material'
import { MessageSkeleton } from '../MessageSkeleton'
import { MessageContainer } from '../Message/MessageContainer'
import { usePreference } from '../../context/PreferenceContext'
import { FavoriteAssociation } from './FavoriteAssociation'
import { ReactionAssociation } from './ReactionAssociation'
import { MentionAssociation } from './MentionAssociation'
import { ReadAccessAssociation } from './ReadAccessAssociation'

export interface AssociationFrameProp {
    associationID: string
    associationOwner: string
    lastUpdated: number
    after: JSX.Element | undefined
    perspective?: string
    sx?: SxProps
    dimOnHover?: boolean
}

export const AssociationFrame = memo<AssociationFrameProp>((props: AssociationFrameProp): JSX.Element | null => {
    const { client } = useClient()
    const theme = useTheme()
    const [isDevMode] = usePreference('devMode')
    const [association, setAssociation] = useState<Association<
        LikeAssociationSchema | ReactionAssociationSchema | ReplyAssociationSchema | RerouteAssociationSchema
    > | null>(null)
    const [fetching, setFetching] = useState<boolean>(true)

    useEffect(() => {
        client
            .getAssociation<
                LikeAssociationSchema | ReactionAssociationSchema | ReplyAssociationSchema | RerouteAssociationSchema
            >(props.associationID, props.associationOwner)
            .then((a) => {
                setAssociation(a ?? null)
            })
            .catch((e) => {
                console.warn(e)
            })
            .finally(() => {
                setFetching(false)
            })
    }, [props.associationID, props.associationOwner, props.lastUpdated])

    const style = useMemo(() => {
        if (!props.dimOnHover) return props.sx
        return {
            ...props.sx,
            '&:hover': {
                backgroundColor: alpha(theme.palette.divider, 0.05),
                transition: 'background-color 0.2s'
            }
        }
    }, [props.sx])

    if (fetching) {
        return (
            <>
                <Box sx={props.sx}>
                    <MessageSkeleton />
                </Box>
                {props.after}
            </>
        )
    }

    if (!association) {
        if (isDevMode) {
            return (
                <>
                    <Typography>Association not found</Typography>
                    {props.associationID}@{props.associationOwner}
                    {props.after}
                </>
            )
        }
        return <></>
    }

    switch (association.schema) {
        case Schemas.likeAssociation:
            return (
                <>
                    <Box sx={style}>
                        <FavoriteAssociation
                            association={association as Association<LikeAssociationSchema>}
                            perspective={props.perspective ?? client.ccid ?? ''}
                        />
                    </Box>
                    {props.after}
                </>
            )
        case Schemas.reactionAssociation:
            return (
                <>
                    <Box sx={style}>
                        <ReactionAssociation
                            association={association as Association<ReactionAssociationSchema>}
                            perspective={props.perspective ?? client.ccid ?? ''}
                        />
                    </Box>
                    {props.after}
                </>
            )
        case Schemas.replyAssociation:
            return (
                <>
                    <Box sx={style}>
                        <MessageContainer
                            messageID={(association as Association<ReplyAssociationSchema>).document.body.messageId}
                            messageOwner={
                                (association as Association<ReplyAssociationSchema>).document.body.messageAuthor
                            }
                        />
                    </Box>
                    {props.after}
                </>
            )
        case Schemas.rerouteAssociation:
            return (
                <>
                    <Box sx={style}>
                        <MessageContainer
                            messageID={(association as Association<RerouteAssociationSchema>).document.body.messageId}
                            messageOwner={
                                (association as Association<ReplyAssociationSchema>).document.body.messageAuthor
                            }
                        />
                    </Box>
                    {props.after}
                </>
            )
        case Schemas.mentionAssociation:
            return (
                <>
                    <Box sx={style}>
                        <MentionAssociation
                            association={association as Association<ReactionAssociationSchema>}
                            perspective={props.perspective ?? client.ccid ?? ''}
                        />
                    </Box>
                    {props.after}
                </>
            )
        case Schemas.readAccessRequestAssociation:
            return (
                <>
                    <Box sx={style}>
                        <ReadAccessAssociation
                            association={association as Association<ReadAccessRequestAssociationSchema>}
                        />
                    </Box>
                    {props.after}
                </>
            )
        default:
            return (
                <>
                    <Box sx={style}>
                        <ListItem sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Typography variant="caption" color="text.disabled">
                                Unknown association schema
                            </Typography>
                        </ListItem>
                    </Box>
                    {props.after}
                </>
            )
    }
})

AssociationFrame.displayName = 'AssociationFrame'
