import { type ReadAccessRequestAssociationSchema, type Association, type Timeline } from '@concurrent-world/client'
import { ContentWithCCAvatar } from '../ContentWithCCAvatar'
import { Box, Typography } from '@mui/material'
import { TimeDiff } from '../ui/TimeDiff'
import { type ReactElement, useEffect, useState } from 'react'
import { TimelineChip } from '../ui/TimelineChip'
import { useClient } from '../../context/ClientContext'
import { WatchRequestAcceptButton } from '../WatchRequestAccpetButton'
import { CCLink } from '../ui/CCLink'

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
        <ContentWithCCAvatar author={props.association.authorUser}>
            <Box display="flex" justifyContent="space-between">
                <Typography>
                    <CCLink to={`/${props.association.author}`}>
                        {props.association.authorUser?.profile?.username}
                    </CCLink>{' '}
                    さんが
                    <TimelineChip timelineID={props.association.target + '@' + props.association.owner} />
                    への読み取りアクセスを希望しています
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
