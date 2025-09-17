import { Box, Collapse, Divider, Tab, Tabs } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useClient } from '../context/ClientContext'
import { type EmptyTimelineSchema, Schemas, type Timeline, type User } from '@concrnt/worldlib'
import { type VListHandle } from 'virtua'
import { TimelineHeader } from '../components/TimelineHeader'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import { Profile } from '../components/Profile'
import { QueryTimelineReader } from '../components/QueryTimeline'
import { TimelineFilter } from '../components/TimelineFilter'
import { PrivateTimelineDoor } from '../components/PrivateTimelineDoor'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

export function EntityPage(): JSX.Element {
    const { client } = useClient()
    const params = useParams()

    const idparamSplit = params.id?.split('@')
    const id: string | undefined = idparamSplit?.[0]
    const hint: string | undefined = idparamSplit?.[1]

    const { t } = useTranslation('', { keyPrefix: 'common' })

    const path = useLocation()
    let tab = path.pathname.split('/').pop()
    if (tab !== 'media' && tab !== 'activity') tab = ''

    const navigate = useNavigate()

    const [timeline, setTimeline] = useState<Timeline<EmptyTimelineSchema> | null>(null)
    const isPrivate = !timeline?.policy.isReadable(client)

    const [user, setUser] = useState<User | null | undefined>(null)

    const timelineRef = useRef<VListHandle>(null)

    const [showHeader, setShowHeader] = useState(false)

    const subProfileID = params.profileid ?? path.hash.replace('#', '')

    const timelineID = subProfileID ? 'world.concrnt.t-subhome.' + subProfileID + '@' + id : user?.homeTimeline

    const [filter, setFilter] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (!id) return
        client.getUser(id, hint, { TTL: 0 }).then((user) => {
            setUser(user)
        })
    }, [id])

    useEffect(() => {
        if (!timelineID) return
        client.api.invalidateTimeline(timelineID)
        client.getTimeline<EmptyTimelineSchema>(timelineID).then(setTimeline)
    }, [timelineID])

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
        <>
            <Helmet>
                <title>{`${user?.profile?.username || 'anonymous'}${
                    user?.alias ? `(@${user.alias})` : ''
                } - Concrnt`}</title>
                <meta name="description" content={user?.profile?.description || ''} />
                {user?.alias && <link rel="canonical" href={`https://concrnt.com/${user.alias}`} />}
            </Helmet>
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
                                timelineRef.current?.scrollToIndex(0, { align: 'start' })
                            }}
                        />
                    </Collapse>
                </Box>

                {user && (
                    <>
                        {timeline && isPrivate ? (
                            <>
                                <Profile
                                    user={user}
                                    overrideSubProfileID={subProfileID}
                                    onSubProfileClicked={(subID) => {
                                        if (subID) {
                                            navigate(`/${id}/profile/${subID}` + (tab ? '/' + tab : ''))
                                        } else {
                                            navigate(`/${id}` + (tab ? '/' + tab : ''))
                                        }
                                    }}
                                />
                                <PrivateTimelineDoor timeline={timeline} />
                            </>
                        ) : (
                            <>
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
                                                    user={user}
                                                    overrideSubProfileID={subProfileID}
                                                    onSubProfileClicked={(subID) => {
                                                        if (subID) {
                                                            navigate(`/${id}/profile/${subID}` + (tab ? '/' + tab : ''))
                                                        } else {
                                                            navigate(`/${id}` + (tab ? '/' + tab : ''))
                                                        }
                                                    }}
                                                />
                                                <Tabs
                                                    value={tab}
                                                    onChange={(_, value) => {
                                                        if (subProfileID) {
                                                            navigate(
                                                                `/${id}/profile/${subProfileID}` +
                                                                    (value ? '/' + value : '')
                                                            )
                                                        } else {
                                                            navigate(`/${id}` + (value ? '/' + value : ''))
                                                        }
                                                    }}
                                                    textColor="secondary"
                                                    indicatorColor="secondary"
                                                >
                                                    <Tab label={t('crnt')} value="" />
                                                    <Tab label={t('media')} value="media" />
                                                    <Tab label={t('activity')} value="activity" />
                                                </Tabs>
                                                <Divider />
                                                {tab === 'activity' && (
                                                    <>
                                                        <TimelineFilter
                                                            selected={filter}
                                                            setSelected={setFilter}
                                                            sx={{ px: 1 }}
                                                        />
                                                        <Divider />
                                                    </>
                                                )}
                                            </>
                                        }
                                    />
                                )}
                            </>
                        )}
                    </>
                )}
            </Box>
        </>
    )
}
