import { Tooltip, Paper } from '@mui/material'
import {
    Schemas,
    UserProfile,
    type CommunityTimelineSchema,
    type ProfileSchema,
    type SubprofileTimelineSchema,
    type Timeline
} from '@concrnt/worldlib'
import TagIcon from '@mui/icons-material/Tag'
import { useClient } from '../../context/ClientContext'
import { useEffect, useState } from 'react'
import { TimelineCard } from '../TimelineCard'
import { CCChip } from './CCChip'
import { UserProfileCard } from '../UserProfileCard'
import HomeIcon from '@mui/icons-material/Home'

export interface TimelineChipProps {
    timelineFQID?: string
}

export const TimelineChip = (props: TimelineChipProps): JSX.Element => {
    const { client } = useClient()
    const [timeline, setTimeline] = useState<Timeline<any> | null | undefined>(undefined)
    const [profile, setProfile] = useState<UserProfile | null | undefined>(null)

    const domain = props.timelineFQID?.split('@')?.[1]

    useEffect(() => {
        if (timeline !== undefined) return
        if (!props.timelineFQID) return
        client.getTimeline<any>(props.timelineFQID).then((t) => {
            setTimeline(t)

            if (!t) return
            if (t.schema === Schemas.emptyTimeline) {
                const timeline: Timeline<CommunityTimelineSchema> = t
                client.getUser(timeline.author).then((user) => {
                    setProfile(user?.profile)
                })
            } else if (t.schema === Schemas.subprofileTimeline) {
                const timeline: Timeline<SubprofileTimelineSchema> = t
                client.api
                    .getProfile<ProfileSchema>(timeline.document.body.subprofile, timeline.author)
                    .then((profile) => {
                        if (!profile) return
                        setProfile({
                            ccid: timeline.author,
                            profileOverrideID: timeline.document.body.subprofile,
                            ...profile.parsedDoc.body
                        })
                    })
            }
        })
    }, [])

    if (!props.timelineFQID) {
        return <CCChip size={'small'} label={'loading...'} icon={<TagIcon />} />
    }

    if (!timeline) {
        return <CCChip size={'small'} label={props.timelineFQID} icon={<TagIcon />} />
    }

    let link = `/timeline/${props.timelineFQID}`

    const split = props.timelineFQID.split('@')
    if (split[0] === 'world.concrnt.t-home') {
        link = `/${split[1]}`
    } else if (timeline.schema === Schemas.subprofileTimeline) {
        link = `/${split[1]}#${timeline.document.body.subprofile}`
    }

    return (
        <Tooltip
            enterDelay={500}
            enterNextDelay={500}
            leaveDelay={300}
            placement="top"
            components={{
                Tooltip: Paper
            }}
            componentsProps={{
                tooltip: {
                    sx: {
                        m: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        minWidth: '300px'
                    }
                }
            }}
            title={
                profile ? (
                    <UserProfileCard profile={profile} />
                ) : (
                    <>
                        {domain && (
                            <TimelineCard
                                timelineFQID={props.timelineFQID}
                                name={timeline.document.body.name}
                                description={timeline.document.body.description}
                                banner={timeline.document.body.banner ?? ''}
                                domain={domain}
                            />
                        )}
                    </>
                )
            }
        >
            <CCChip
                to={link}
                size={'small'}
                label={timeline?.document.body.name ?? profile?.username ?? props.timelineFQID}
                icon={profile ? <HomeIcon /> : <TagIcon />}
            />
        </Tooltip>
    )
}
