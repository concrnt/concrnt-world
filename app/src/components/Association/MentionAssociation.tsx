import {
    type Association,
    type ReactionAssociationSchema,
    type Message,
    type ReplyMessageSchema,
    type MarkdownMessageSchema,
    type User,
    UserProfile
} from '@concrnt/worldlib'
import { ContentWithCCAvatar } from '../ContentWithCCAvatar'
import { Box, Typography } from '@mui/material'
import { TimeDiff } from '../ui/TimeDiff'
import { type ReactElement, useEffect, useState } from 'react'
import { CCLink } from '../ui/CCLink'

export interface MentionAssociationProps {
    association: Association<ReactionAssociationSchema>
    perspective: string
    withoutContent?: boolean
}

export const MentionAssociation = (props: MentionAssociationProps): ReactElement => {
    const [target, setTarget] = useState<Message<MarkdownMessageSchema | ReplyMessageSchema> | null>(null)
    const isMeToOther = props.association?.authorUser?.ccid !== props.perspective

    const Nominative = props.association?.authorProfile.username ?? 'anonymous'
    const Possessive = (target?.authorProfile.username ?? 'anonymous') + "'s"

    const actionUser: User | undefined = isMeToOther ? props.association.authorUser : target?.authorUser
    const actionUserProfile: UserProfile = isMeToOther ? props.association.authorProfile : target?.authorProfile!

    const targetLink = target ? `/${target.author}/${target.id}` : '#' // Link to mention message
    useEffect(() => {
        props.association.getTargetMessage().then(setTarget)
    }, [props.association])

    if (!target) {
        return <></>
    }

    return (
        <ContentWithCCAvatar author={actionUser} linkTo={targetLink} profile={actionUserProfile}>
            <Box display="flex" justifyContent="space-between">
                <Typography>
                    {isMeToOther ? (
                        <>
                            <CCLink to={actionUser ? `/${actionUser?.ccid}` : '#'}>
                                <b>{Nominative}</b>
                            </CCLink>{' '}
                            mentioned You in message with{' '}
                            <img
                                height="13px"
                                src={props.association.document.body.imageUrl}
                                alt={props.association.document.body.shortcode}
                            />
                        </>
                    ) : (
                        <>
                            {Nominative} mentioned You in message with{' '}
                            <img
                                height="13px"
                                src={props.association.document.body.imageUrl}
                                alt={props.association.document.body.shortcode}
                            />
                        </>
                    )}
                </Typography>
                <CCLink fontSize="0.75rem" to={targetLink}>
                    <TimeDiff date={new Date(props.association.cdate)} />
                </CCLink>
            </Box>
            {(!props.withoutContent && (
                <blockquote style={{ margin: 0, paddingLeft: '1rem', borderLeft: '4px solid #ccc' }}>
                    {target?.document.body.body}
                </blockquote>
            )) ||
                undefined}
        </ContentWithCCAvatar>
    )
}
