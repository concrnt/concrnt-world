import { Box, Button, Grid, ListItemIcon, ListItemText, Menu, MenuItem, TextField, Typography } from '@mui/material'
import { ProfileEditor } from '../ProfileEditor'
import { useClient } from '../../context/ClientContext'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import {
    type ProfileSchema,
    type CoreProfile,
    type Schema,
    type BadgeRef,
    type CoreTimeline,
    Schemas,
    type SubprofileTimelineSchema
} from '@concurrent-world/client'
import { useEffect, useState } from 'react'
import { CCDrawer } from '../ui/CCDrawer'
import { CCEditor } from '../ui/cceditor'
import { SubProfileCard } from '../SubProfileCard'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'

import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import PublishIcon from '@mui/icons-material/Publish'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import EditIcon from '@mui/icons-material/Edit'
import { useLocation } from 'react-router-dom'
import { type Badge } from '../../model'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { usePreference } from '../../context/PreferenceContext'
import { useConcord } from '../../context/ConcordContext'
import MedicationIcon from '@mui/icons-material/Medication'

export const ProfileSettings = (): JSX.Element => {
    const { client } = useClient()
    const concord = useConcord()
    const { enqueueSnackbar } = useSnackbar()
    const [enableConcord] = usePreference('enableConcord')

    const { t } = useTranslation('', { keyPrefix: 'settings.profile' })

    const path = useLocation()
    const hash = path.hash.replace('#', '')

    const [allProfiles, setAllProfiles] = useState<Array<CoreProfile<any>>>([])
    const [allEnabledTimelines, setAllEnabledTimelines] = useState<Array<CoreTimeline<any>>>([])
    const [openProfileEditor, setOpenProfileEditor] = useState(false)

    const [schemaURLDraft, setSchemaURLDraft] = useState<string>('https://schema.concrnt.world/p/basic.json')
    const [schemaURL, setSchemaURL] = useState<any>(null)
    const [editingProfile, setEditingProfile] = useState<CoreProfile<any> | null>(null)

    const [latestProfile, setLatestProfile] = useState<ProfileSchema | null | undefined>(client.user?.profile)

    const [subprofileDraft, setSubprofileDraft] = useState<any>(null)
    const [badges, setBadges] = useState<Badge[]>([])

    const load = (): void => {
        if (!client?.ccid) return
        if (!client.user?.profile) return

        client.api.getProfileBySemanticID<ProfileSchema>('world.concrnt.p', client.ccid).then((profile) => {
            setLatestProfile(profile?.document.body)
            client.api.getProfiles({ author: client.ccid }).then((profiles) => {
                const subprofiles = (profiles ?? []).filter((p) => p.id !== profile?.id)
                setAllProfiles(subprofiles)
            })
        })

        concord.getBadges(client.ccid).then((badges) => {
            setBadges(badges)
        })
    }

    useEffect(() => {
        for (const profile of allProfiles) {
            client.api.getTimeline('world.concrnt.t-subhome.' + profile.id + '@' + client.ccid!).then((timeline) => {
                if (!timeline) return
                setAllEnabledTimelines((prev) => {
                    if (prev.find((t) => t.id === timeline.id)) {
                        return prev
                    }
                    return [...prev, timeline]
                })
            })
        }
    }, [allProfiles])

    useEffect(() => {
        load()
    }, [client])

    const enabledSubprofiles = latestProfile?.subprofiles ?? []

    useEffect(() => {
        let isMounted = true
        const timer = setTimeout(() => {
            if (isMounted) {
                setSchemaURL(schemaURLDraft)
            }
        }, 300)
        return () => {
            isMounted = false
            clearTimeout(timer)
        }
    }, [schemaURLDraft])

    useEffect(() => {
        if (hash) {
            setSchemaURLDraft(hash)
            setOpenProfileEditor(true)
        }
    }, [hash])

    const [badgeMenuAnchor, setBadgeMenuAnchor] = useState<null | HTMLElement>(null)
    const [selectedBadge, setSelectedBadge] = useState<null | Badge>(null)
    const [badgeAction, setBadgeAction] = useState<null | 'publish' | 'unpublish'>(null)

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1
            }}
        >
            <Typography variant="h3">{t('title')}</Typography>
            <Box
                sx={{
                    width: '100%',
                    borderRadius: 1,
                    overflow: 'hidden',
                    mb: 1
                }}
            >
                <ProfileEditor
                    id={''}
                    initial={client?.user?.profile}
                    onSubmit={() => {
                        enqueueSnackbar(t('updated'), { variant: 'success' })
                    }}
                />
            </Box>

            {enableConcord && badges.length > 0 && (
                <>
                    <Typography variant="h3">バッジ</Typography>
                    <Box>
                        <Grid container spacing={2}>
                            {badges.map((badge) => {
                                const published = latestProfile?.badges?.find(
                                    (b) => b.badgeId === badge.badgeId && b.seriesId === badge.classId
                                )
                                return (
                                    <Grid item key={badge.badgeId}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 1,
                                                width: '80px',
                                                height: '80px',
                                                position: 'relative',
                                                cursor: 'pointer'
                                            }}
                                            onClick={(e) => {
                                                setBadgeMenuAnchor(e.currentTarget)
                                                setSelectedBadge(badge)
                                                setBadgeAction(published ? 'unpublish' : 'publish')
                                            }}
                                        >
                                            {published && (
                                                <CheckCircleIcon
                                                    sx={{
                                                        position: 'absolute',
                                                        right: 0,
                                                        bottom: 0,
                                                        color: 'primary.main',
                                                        fontSize: '2rem',
                                                        backgroundColor: 'background.paper',
                                                        borderRadius: '50%',
                                                        transform: 'translate(20%, 20%)'
                                                    }}
                                                />
                                            )}
                                            <Box
                                                component="img"
                                                src={badge.uri}
                                                alt={badge.name}
                                                sx={{
                                                    borderRadius: 1
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                )
                            })}
                        </Grid>
                        <Menu
                            anchorEl={badgeMenuAnchor}
                            open={Boolean(badgeMenuAnchor)}
                            onClose={() => {
                                setBadgeMenuAnchor(null)
                            }}
                        >
                            {badgeAction === 'publish' && (
                                <MenuItem
                                    onClick={() => {
                                        if (!latestProfile || !selectedBadge) return
                                        const newBadgeRef: BadgeRef = {
                                            badgeId: selectedBadge.badgeId,
                                            seriesId: selectedBadge.classId
                                        }
                                        const badges = [...(latestProfile.badges ?? []), newBadgeRef]
                                        client
                                            .setProfile({
                                                badges
                                            })
                                            .then((_) => {
                                                setBadgeMenuAnchor(null)
                                                load()
                                            })
                                    }}
                                >
                                    <ListItemIcon>
                                        <PublishIcon />
                                    </ListItemIcon>
                                    <ListItemText>公開する</ListItemText>
                                </MenuItem>
                            )}
                            {badgeAction === 'unpublish' && (
                                <MenuItem
                                    onClick={() => {
                                        if (!latestProfile || !selectedBadge) return
                                        const badges = (latestProfile.badges ?? []).filter(
                                            (b) =>
                                                b.badgeId !== selectedBadge.badgeId ||
                                                b.seriesId !== selectedBadge.classId
                                        )
                                        client
                                            .setProfile({
                                                badges
                                            })
                                            .then((_) => {
                                                setBadgeMenuAnchor(null)
                                                load()
                                            })
                                    }}
                                >
                                    <ListItemIcon>
                                        <VisibilityOffIcon />
                                    </ListItemIcon>
                                    <ListItemText>非公開にする</ListItemText>
                                </MenuItem>
                            )}
                            <MenuItem
                                onClick={() => {
                                    if (!selectedBadge) return
                                    concord.inspectBadge({
                                        seriesId: selectedBadge.classId,
                                        badgeId: selectedBadge.badgeId
                                    })
                                    setBadgeMenuAnchor(null)
                                }}
                            >
                                <ListItemIcon>
                                    <ManageSearchIcon />
                                </ListItemIcon>
                                <ListItemText>詳細</ListItemText>
                            </MenuItem>
                        </Menu>
                    </Box>
                </>
            )}

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <Typography variant="h3">サブプロフィール</Typography>
                <Button
                    onClick={() => {
                        setSubprofileDraft({})
                        setOpenProfileEditor(true)
                    }}
                >
                    新規
                </Button>
            </Box>
            {allProfiles.map((character) => {
                const published = enabledSubprofiles.includes(character.id)
                const withTimeline = allEnabledTimelines.find((t) => t.document.body.subprofile === character.id)

                const menuItems = [
                    <MenuItem
                        key="publish"
                        onClick={() => {
                            let subprofiles
                            if (published) {
                                subprofiles = enabledSubprofiles.filter((id) => id !== character.id)
                            } else {
                                subprofiles = [...enabledSubprofiles, character.id]
                            }

                            client
                                .setProfile({
                                    subprofiles
                                })
                                .then((_) => {
                                    load()
                                })
                        }}
                    >
                        <ListItemIcon>
                            {published ? (
                                <VisibilityOffIcon sx={{ color: 'text.primary' }} />
                            ) : (
                                <PublishIcon sx={{ color: 'text.primary' }} />
                            )}
                        </ListItemIcon>
                        <ListItemText>{published ? <>非公開にする</> : <>公開する</>}</ListItemText>
                    </MenuItem>,
                    <MenuItem
                        key="edit"
                        onClick={() => {
                            setSubprofileDraft(character.document.body)
                            setEditingProfile(character)
                            setSchemaURL(character.schema)
                            setSchemaURLDraft(character.schema)
                        }}
                    >
                        <ListItemIcon>
                            <EditIcon sx={{ color: 'text.primary' }} />
                        </ListItemIcon>
                        <ListItemText>編集</ListItemText>
                    </MenuItem>,
                    <MenuItem
                        key="delete"
                        disabled={published}
                        onClick={() => {
                            client.api.deleteProfile(character.id).then((_) => {
                                load()
                            })
                        }}
                    >
                        <ListItemIcon>
                            <DeleteForeverIcon sx={{ color: 'error.main' }} />
                        </ListItemIcon>
                        <ListItemText>{published ? <>削除するには非公開にしてください</> : <>削除</>}</ListItemText>
                    </MenuItem>
                ]

                if (!withTimeline) {
                    menuItems.push(
                        <MenuItem
                            key="fix"
                            onClick={() => {
                                client.api
                                    .upsertTimeline<SubprofileTimelineSchema>(
                                        Schemas.subprofileTimeline,
                                        {
                                            subprofile: character.id
                                        },
                                        {
                                            semanticID: 'world.concrnt.t-subhome.' + character.id
                                        }
                                    )
                                    .then((_) => {
                                        client.api.invalidateTimeline(
                                            'world.concrnt.t-subhome.' + character.id + '@' + client.ccid!
                                        )
                                        enqueueSnackbar('サブプロフィールタイムラインを修正しました', {
                                            variant: 'success'
                                        })
                                        load()
                                    })
                            }}
                        >
                            <ListItemIcon>
                                <MedicationIcon sx={{ color: 'text.primary' }} />
                            </ListItemIcon>
                            <ListItemText>サブプロフィールタイムラインを修正</ListItemText>
                        </MenuItem>
                    )
                }

                return (
                    <SubProfileCard key={character.id} character={character} additionalMenuItems={menuItems}>
                        {published ? <>掲載中</> : <>未掲載</>}
                        {withTimeline ? (
                            <></>
                        ) : (
                            <>
                                <br />
                                サブプロフィールタイムラインがありません
                            </>
                        )}
                    </SubProfileCard>
                )
            })}
            <CCDrawer
                open={openProfileEditor || editingProfile !== null}
                onClose={() => {
                    setOpenProfileEditor(false)
                    setEditingProfile(null)
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '30px',
                        p: 3
                    }}
                >
                    {openProfileEditor && (
                        <>
                            <Typography variant="h3">新規サブプロフィール</Typography>
                            <TextField
                                label="テンプレートのURL"
                                value={schemaURLDraft}
                                onChange={(e) => {
                                    setSchemaURLDraft(e.target.value)
                                }}
                            />
                            <CCEditor schemaURL={schemaURL} value={subprofileDraft} setValue={setSubprofileDraft} />
                            <Button
                                onClick={() => {
                                    client.api
                                        .upsertProfile(schemaURL as Schema, subprofileDraft, {})
                                        .then((profile) => {
                                            client.api
                                                .upsertTimeline<SubprofileTimelineSchema>(
                                                    Schemas.subprofileTimeline,
                                                    {
                                                        subprofile: profile.id
                                                    },
                                                    {
                                                        semanticID: 'world.concrnt.t-subhome.' + profile.id
                                                    }
                                                )
                                                .then((_) => {
                                                    setOpenProfileEditor(false)
                                                    load()
                                                })
                                        })
                                }}
                            >
                                作成
                            </Button>
                        </>
                    )}
                    {editingProfile && (
                        <>
                            <Typography variant="h3">サブプロフィールの編集</Typography>
                            <TextField
                                label="テンプレートのURL"
                                value={schemaURLDraft}
                                onChange={(e) => {
                                    setSchemaURLDraft(e.target.value)
                                }}
                            />
                            <CCEditor schemaURL={schemaURL} value={subprofileDraft} setValue={setSubprofileDraft} />
                            <Button
                                onClick={() => {
                                    client.api
                                        .upsertProfile(schemaURL, subprofileDraft, {
                                            id: editingProfile.id
                                        })
                                        .then((_) => {
                                            setEditingProfile(null)
                                            // client.api.invalidateProfileByID(editingProfile.id)
                                            load()
                                        })
                                }}
                            >
                                更新
                            </Button>
                        </>
                    )}
                </Box>
            </CCDrawer>
        </Box>
    )
}
