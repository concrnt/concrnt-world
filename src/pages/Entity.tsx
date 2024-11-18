import { Box, Collapse, Divider, Tab, Tabs } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useClient } from '../context/ClientContext'
import { Schemas, type User } from '@concurrent-world/client'
import { type VListHandle } from 'virtua'
import { TimelineHeader } from '../components/TimelineHeader'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import { Profile } from '../components/Profile'
import { QueryTimelineReader } from '../components/QueryTimeline'
import { TimelineFilter } from '../components/TimelineFilter'

export function EntityPage(): JSX.Element {
    const { client } = useClient()
    const { id } = useParams()

    const path = useLocation()
    const tab = path.pathname.split('/')[2] ?? ''

    const navigate = useNavigate()

    const [user, setUser] = useState<User | null | undefined>(null)

    const timelineRef = useRef<VListHandle>(null)

    const [showHeader, setShowHeader] = useState(false)

    const subProfileID = path.hash.replace('#', '')

    const [filter, setFilter] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (!id) return
        client.getUser(id).then((user) => {
            setUser(user)
            document.title = `${user?.profile?.username || 'anonymous'}${
                user?.alias ? `(@${user.alias})` : ''
            } - Concrnt`
        })
    }, [id])

    const targetTimeline = useMemo(() => {
        switch (tab ?? '') {
            case '':
            case 'media':
                if (subProfileID) return 'world.concrnt.t-subhome.' + subProfileID + '@' + user?.ccid
                return user?.homeTimeline
            case 'activity':
                return user?.associationTimeline
        }
    }, [user, tab, subProfileID])

    const query = useMemo(() => {
        switch (tab) {
            case 'media':
                return { schema: Schemas.mediaMessage }
            case 'activity':
                return { schema: filter }
            default:
                return {}
        }
    }, [tab, filter])

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'background.paper',
                minHeight: '100%',
                position: 'relative'
            }}
        >
            <Box position="absolute" top="0" left="0" width="100%" zIndex="1">
                <Collapse in={showHeader}>
                    <TimelineHeader
                        title={user?.profile?.username || 'anonymous'}
                        titleIcon={<AlternateEmailIcon />}
                        onTitleClick={() => {
                            timelineRef.current?.scrollToIndex(0, { align: 'start', smooth: true })
                        }}
                    />
                </Collapse>
            </Box>
            {targetTimeline && (
                <QueryTimelineReader
                    ref={timelineRef}
                    timeline={targetTimeline}
                    query={query}
                    perspective={user?.ccid}
                    onScroll={(top) => {
                        setShowHeader(top > 180)
                    }}
                    header={
                        <>
                            <Profile
                                user={user ?? undefined}
                                id={id}
                                overrideSubProfileID={subProfileID}
                                onSubProfileClicked={(id) => {
                                    window.location.hash = id
                                }}
                            />
                            <Tabs
                                value={tab}
                                onChange={(_, value) => {
                                    if (value === '') navigate(`/${id}` + (subProfileID ? '#' + subProfileID : ''))
                                    else navigate(`/${id}/${value}` + (subProfileID ? '#' + subProfileID : ''))
                                }}
                                textColor="secondary"
                                indicatorColor="secondary"
                            >
                                <Tab label="カレント" value="" />
                                <Tab label="メディア" value="media" />
                                <Tab label="アクティビティ" value="activity" />
                            </Tabs>
                            <Divider />
                            {tab === 'activity' && (
                                <>
                                    <TimelineFilter selected={filter} setSelected={setFilter} sx={{ px: 1 }} />
                                    <Divider />
                                </>
                            )}
                        </>
                    }
                />
            )}
        </Box>
    )
}
