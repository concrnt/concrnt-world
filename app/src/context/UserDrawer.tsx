import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useClient } from './ClientContext'
import { CCDrawer } from '../components/ui/CCDrawer'
import { Schemas, type User } from '@concrnt/worldlib'
import { TimelineHeader } from '../components/TimelineHeader'
import { type VListHandle } from 'virtua'

import { Box, Collapse, Divider, Tab, Tabs } from '@mui/material'

import { useLocation } from 'react-router-dom'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import { Profile } from '../components/Profile'
import { QueryTimelineReader } from '../components/QueryTimeline'
import { TimelineFilter } from '../components/TimelineFilter'
import { useTranslation } from 'react-i18next'

export interface UserDrawerState {
    open: (id: string) => void
}

const UserDrawerContext = createContext<UserDrawerState | undefined>(undefined)

interface UserDrawerProps {
    children: JSX.Element | JSX.Element[]
}

export const UserDrawerProvider = (props: UserDrawerProps): JSX.Element => {
    const { client } = useClient()

    const [CCID, setCCID] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        if (!CCID) return
        client.getUser(CCID).then((user) => {
            setUser(user)
        })
    }, [CCID])

    const { t } = useTranslation('', { keyPrefix: 'common' })

    const timelineRef = useRef<VListHandle>(null)

    const [showHeader, setShowHeader] = useState(false)

    const path = useLocation()
    const subProfileID = path.hash.replace('#', '')

    const [filter, setFilter] = useState<string | undefined>(undefined)

    const [tab, setTab] = useState<'' | 'media' | 'activity'>('')

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

    const open = useCallback((id: string) => {
        setCCID(id)
    }, [])

    return (
        <UserDrawerContext.Provider
            value={useMemo(() => {
                return {
                    open
                }
            }, [])}
        >
            {props.children}
            <CCDrawer
                open={!!CCID}
                onClose={() => {
                    setCCID(null)
                    // hash がある場合は削除
                    if (subProfileID) {
                        window.location.hash = ''
                    }
                    setUser(null)
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'background.paper',
                        minHeight: '100%',
                        position: 'relative'
                    }}
                >
                    {user && targetTimeline && (
                        <>
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
                                            onSubProfileClicked={(id) => {
                                                window.location.hash = id
                                            }}
                                        />
                                        <Tabs
                                            value={tab}
                                            onChange={(_, value) => {
                                                setTab(value)
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
                        </>
                    )}
                </Box>
            </CCDrawer>
        </UserDrawerContext.Provider>
    )
}

export function useUserDrawer(): UserDrawerState {
    return useContext(UserDrawerContext) as UserDrawerState
}
