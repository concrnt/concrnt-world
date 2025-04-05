import { ListItem, ListItemButton, type SxProps } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { IsCSID } from '@concrnt/client'
import {
    Schemas,
    Timeline,
    type CommunityTimelineSchema,
    type ProfileSchema,
    type SubprofileTimelineSchema
} from '@concrnt/worldlib'
import { useClient } from '../../context/ClientContext'
import TagIcon from '@mui/icons-material/Tag'
import CloudOffIcon from '@mui/icons-material/CloudOff'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import { FaTheaterMasks } from 'react-icons/fa'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'

export interface ListItemTimelineProps {
    timelineID: string
    sx?: SxProps
    onClick?: () => void
    secondaryAction?: JSX.Element | JSX.Element[]
    selected?: boolean
}

export const ListItemTimeline = (props: ListItemTimelineProps): JSX.Element | null => {
    const { client } = useClient()
    const [timeline, setTimeline] = useState<Timeline<any> | null | undefined>(null)
    const [profile, setProfile] = useState<ProfileSchema | null | undefined>(null)

    const [isOnline, setIsOnline] = useState<boolean>(false)

    useEffect(() => {
        client.getTimeline<any>(props.timelineID).then((e) => {
            if (!e) return
            setTimeline(e)
            client.api.getDomainOnlineStatus(e.host).then((online) => {
                setIsOnline(online)
            })

            if (e.schema === Schemas.emptyTimeline) {
                const timeline: Timeline<CommunityTimelineSchema> = e
                client.getUser(timeline.author).then((user) => {
                    setProfile(user?.profile)
                })
            } else if (e.schema === Schemas.subprofileTimeline) {
                const timeline: Timeline<SubprofileTimelineSchema> = e
                client.api
                    .getProfile<ProfileSchema>(timeline.document.body.subprofile, timeline.author)
                    .then((profile) => {
                        if (!profile) return
                        setProfile(profile.parsedDoc.body)
                    })
            }
        })
    }, [props.timelineID])

    if (!timeline) {
        return (
            <ListItem dense disablePadding secondaryAction={props.secondaryAction}>
                <ListItemButton dense disabled sx={props.sx}>
                    <HelpOutlineIcon />
                    Not found
                </ListItemButton>
            </ListItem>
        )
    }

    if (!isOnline) {
        return (
            <ListItem dense disablePadding secondaryAction={props.secondaryAction}>
                <ListItemButton dense disabled sx={props.sx}>
                    <CloudOffIcon />
                    {timeline?.document.body.name || profile?.username || 'Unknown'}
                </ListItemButton>
            </ListItem>
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
        <ListItem dense disablePadding secondaryAction={props.secondaryAction}>
            <ListItemButton
                dense
                component={RouterLink}
                to={link}
                sx={props.sx}
                onClick={props.onClick}
                selected={props.selected}
            >
                {timeline?.owner && IsCSID(timeline.owner) ? <TagIcon /> : <AlternateEmailIcon />}
                {timeline?.document.body.name || profile?.username || 'Unknown'}
                {timeline?.schema === Schemas.subprofileTimeline && <FaTheaterMasks />}
            </ListItemButton>
        </ListItem>
    )
}
