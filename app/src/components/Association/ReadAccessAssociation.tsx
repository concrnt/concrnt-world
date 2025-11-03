import { type ReadAccessRequestAssociationSchema, type Association, type Timeline } from '@concrnt/worldlib'
import { ContentWithCCAvatar } from '../ContentWithCCAvatar'
import { Box, Typography } from '@mui/material'
import { TimeDiff } from '../ui/TimeDiff'
import { type ReactElement, useEffect, useState } from 'react'
import { TimelineChip } from '../ui/TimelineChip'
import { useClient } from '../../context/ClientContext'
import { WatchRequestAcceptButton } from '../WatchRequestAccpetButton'
import { CCLink } from '../ui/CCLink'
import { Trans } from 'react-i18next'

export interface ReadAccessAssociationProps {
    association: Association<ReadAccessRequestAssociationSchema>
}

export const ReadAccessAssociation = (props: ReadAccessAssociationProps): ReactElement => {
    const { client } = useClient()
    const [timeline, setTimeline] = useState<Timeline<any> | null>(null)

    useEffect(() => {
        client.getTimeline(props.association.target).then(setTimeline)
    }, [props.association])

    return (
        <ContentWithCCAvatar author={props.association.authorUser} profile={props.association.authorProfile}>
            <Box display="flex" justifyContent="space-between">
                <Typography>
                    <Trans
                        i18nKey="pages.associations.readAccessRequest"
                        components={{
                            username: (
                                <CCLink to={`/${props.association.author}`}>
                                    {props.association.authorProfile.username}
                                </CCLink>
                            ),
                            timeline: (
                                <TimelineChip timelineFQID={props.association.target + '@' + props.association.owner} />
                            )
                        }}
                    />
                </Typography>

                <TimeDiff date={new Date(props.association.cdate)} />
            </Box>
            <Box>
                {timeline && (
                    <Box
                        onClick={(e) => {
                            e.stopPropagation() // prevent to navigate other page
                        }}
                    >
                        <WatchRequestAcceptButton noAvatar request={props.association} targetTimeline={timeline} />
                    </Box>
                )}
            </Box>
        </ContentWithCCAvatar>
    )
}
