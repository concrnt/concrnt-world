import { ListItemButton, type SxProps } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
    type Timeline,
    type CommunityTimelineSchema,
    IsCSID,
    Schemas,
    type ProfileSchema,
    type CoreTimeline,
    type SubprofileTimelineSchema
} from '@concurrent-world/client'
import { useClient } from '../../context/ClientContext'
import TagIcon from '@mui/icons-material/Tag'
import CloudOffIcon from '@mui/icons-material/CloudOff'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import { FaTheaterMasks } from 'react-icons/fa'

export interface ListItemTimelineProps {
    timelineID: string
    sx?: SxProps
    onClick?: () => void
}

export const ListItemTimeline = (props: ListItemTimelineProps): JSX.Element | null => {
    const { client } = useClient()
    const [timeline, setTimeline] = useState<Timeline<any> | null | undefined>(null)
    const [profile, setProfile] = useState<ProfileSchema | null | undefined>(null)

    useEffect(() => {
        client.getTimeline<any>(props.timelineID).then((e) => {
            if (!e) return
            setTimeline(e)

            if (e.schema === Schemas.emptyTimeline) {
                const timeline: CoreTimeline<CommunityTimelineSchema> = e
                client.getUser(timeline.author).then((user) => {
                    setProfile(user?.profile)
                })
            } else if (e.schema === Schemas.subprofileTimeline) {
                const timeline: CoreTimeline<SubprofileTimelineSchema> = e
                client.api
                    .getProfileByID<ProfileSchema>(timeline.document.body.subprofile, timeline.author)
                    .then((profile) => {
                        if (!profile) return
                        setProfile(profile.document.body)
                    })
            }
        })
    }, [props.timelineID])

    if (!timeline) {
        return (
            <ListItemButton dense disabled sx={props.sx}>
                <CloudOffIcon />
                offline
            </ListItemButton>
        )
    }

    let link = `/timeline/${props.timelineID}`

    const split = props.timelineID.split('@')
    if (split[0] === 'world.concrnt.t-home') {
        link = `/${split[1]}`
    } else if (timeline.schema === Schemas.subprofileTimeline) {
        link = `/${split[1]}#${timeline.document.body.subprofile}`
    }

    return (
        <ListItemButton dense component={RouterLink} to={link} sx={props.sx} onClick={props.onClick}>
            {timeline?.owner && IsCSID(timeline.owner) ? <TagIcon /> : <AlternateEmailIcon />}
            {timeline?.document.body.name || profile?.username || 'Unknown'}
            {timeline?.schema === Schemas.subprofileTimeline && <FaTheaterMasks />}
        </ListItemButton>
    )
}
