import {
    type ProfileSchema,
    Schemas,
    type SubprofileTimelineSchema,
    type Timeline,
    type User,
    type Association,
    type ReadAccessRequestAssociationSchema
} from '@concrnt/worldlib'

import { Profile } from '@concrnt/client'

import { useClient } from '../context/ClientContext'
import { useEffect, useState } from 'react'
import { Box, Button, Divider, ListItemIcon, ListItemText, MenuItem, TextField, Typography } from '@mui/material'

import { SubProfileCard } from './SubProfileCard'
import { useSnackbar } from 'notistack'
import { useConfirm } from '../context/Confirm'
import { CCDrawer } from './ui/CCDrawer'
import { CCEditor } from './ui/cceditor'

import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import EditIcon from '@mui/icons-material/Edit'
import MedicationIcon from '@mui/icons-material/Medication'
import PublishIcon from '@mui/icons-material/Publish'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import { UserPicker } from './ui/UserPicker'
import { WatchRequestAcceptButton } from './WatchRequestAccpetButton'
import { useTranslation } from 'react-i18next'

interface SubprofileCardWithEditProps {
    mainProfile: ProfileSchema
    subProfile: Profile<any>
    onModified?: () => void
}

export const SubprofileCardWithEdit = (props: SubprofileCardWithEditProps): JSX.Element => {
    const { t } = useTranslation('', { keyPrefix: 'settings.profile.subprofile' })

    const { client } = useClient()
    const { enqueueSnackbar } = useSnackbar()
    const confirm = useConfirm()

    const [timeline, setTimeline] = useState<Timeline<any> | null>(null)

    const enabledSubprofiles = props.mainProfile.subprofiles ?? []
    const published = enabledSubprofiles.includes(props.subProfile.id)

    const [schemaURLDraft, setSchemaURLDraft] = useState<string>('https://schema.concrnt.world/p/basic.json')
    const [schemaURL, setSchemaURL] = useState<any>(null)
    const [editingProfile, setEditingProfile] = useState<Profile<any> | null>(null)
    const [subprofileDraft, setSubprofileDraft] = useState<any>(null)

    const [openReaderEditor, setOpenReaderEditor] = useState<boolean>(false)
    const [selectedUsers, setSelectedUsers] = useState<User[]>([])
    const [requests, setRequests] = useState<Array<Association<ReadAccessRequestAssociationSchema>>>([])

    const [update, setUpdate] = useState<number>(0)

    const isTimelineValid = timeline && !timeline.policy.isWritePublic() && timeline.policy.isReadable(client)
    const isTimelinePublic = timeline && timeline.policy.isReadPublic()

    useEffect(() => {
        client.api.invalidateTimeline('world.concrnt.t-subhome.' + props.subProfile.id + '@' + client.ccid!)
        client
            .getTimeline('world.concrnt.t-subhome.' + props.subProfile.id + '@' + client.ccid!, { cache: 'no-cache' })
            .then((timeline) => {
                if (!timeline) return
                setTimeline(timeline)
                timeline.getAssociations().then((assocs) => {
                    setRequests(assocs.filter((e) => e.schema === Schemas.readAccessRequestAssociation))
                })
            })
    }, [props.subProfile.id, update])

    const menuItems = [
        <MenuItem
            key="publish"
            onClick={() => {
                let subprofiles
                if (published) {
                    subprofiles = enabledSubprofiles.filter((id) => id !== props.subProfile.id)
                } else {
                    subprofiles = [...enabledSubprofiles, props.subProfile.id]
                }

                client
                    .setProfile({
                        subprofiles
                    })
                    .then((_) => {
                        props.onModified?.()
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
            <ListItemText>{published ? <>{t('hideInProfile')}</> : <>{t('showInProfile')}</>}</ListItemText>
        </MenuItem>,
        <MenuItem
            key="togglePrivate"
            onClick={() => {
                if (!timeline || !client.ccid) return
                client.api
                    .upsertTimeline(
                        Schemas.subprofileTimeline,
                        {
                            subprofile: props.subProfile.id
                        },
                        {
                            semanticID: 'world.concrnt.t-subhome.' + props.subProfile.id,
                            indexable: false,
                            policy: timeline.policy.getPolicySchemaURL(),
                            policyParams: JSON.stringify(
                                timeline.policy
                                    .copyWithNewReadPublic(!isTimelinePublic)
                                    .copyWithAddReaders([client.ccid])
                                    .getPolicyParams()
                            )
                        }
                    )
                    .then(() => {
                        timeline.invalidate()
                        props.onModified?.()
                        setUpdate((prev) => prev + 1)
                        enqueueSnackbar(t('visibilityUpdated'), { variant: 'success' })
                    })
            }}
        >
            <ListItemIcon>
                {isTimelinePublic ? (
                    <LockIcon sx={{ color: 'text.primary' }} />
                ) : (
                    <LockOpenIcon sx={{ color: 'text.primary' }} />
                )}
            </ListItemIcon>
            <ListItemText>{isTimelinePublic ? <>{t('makePrivate')}</> : <>{t('makePublic')}</>}</ListItemText>
        </MenuItem>,
        <MenuItem
            key="edit"
            onClick={() => {
                setSubprofileDraft(props.subProfile.parsedDoc.body)
                setEditingProfile(props.subProfile)
                setSchemaURL(props.subProfile.schema)
                setSchemaURLDraft(props.subProfile.schema)
            }}
        >
            <ListItemIcon>
                <EditIcon sx={{ color: 'text.primary' }} />
            </ListItemIcon>
            <ListItemText>{t('edit')}</ListItemText>
        </MenuItem>,
        ...(!timeline || !isTimelineValid
            ? [
                  <MenuItem
                      key="fix"
                      onClick={() => {
                          client.api
                              .upsertTimeline<SubprofileTimelineSchema>(
                                  Schemas.subprofileTimeline,
                                  {
                                      subprofile: props.subProfile.id
                                  },
                                  {
                                      owner: client.ccid,
                                      indexable: false,
                                      policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                                      policyParams: `{"isWritePublic": false, "isReadPublic": true, "writer": ["${client.ccid}"], "reader": []}`,
                                      semanticID: 'world.concrnt.t-subhome.' + props.subProfile.id
                                  }
                              )
                              .then((_) => {
                                  client.api.invalidateTimeline(
                                      'world.concrnt.t-subhome.' + props.subProfile.id + '@' + client.ccid!
                                  )
                                  enqueueSnackbar(t('timelineFixed'), {
                                      variant: 'success'
                                  })
                                  props.onModified?.()
                              })
                      }}
                  >
                      <ListItemIcon>
                          <MedicationIcon sx={{ color: 'text.primary' }} />
                      </ListItemIcon>
                      <ListItemText>{t('fixTimeline')}</ListItemText>
                  </MenuItem>
              ]
            : []),
        ...(!timeline || !isTimelinePublic
            ? [
                  <MenuItem
                      key="managereaders"
                      onClick={() => {
                          if (!timeline) return
                          Promise.all((timeline.policy.getReaders() ?? []).map((e: string) => client.getUser(e))).then(
                              (users) => {
                                  setSelectedUsers(users.filter((u) => u) as User[])
                                  setOpenReaderEditor(true)
                              }
                          )
                      }}
                  >
                      <ListItemIcon>
                          <ManageAccountsIcon sx={{ color: 'text.primary' }} />
                      </ListItemIcon>
                      <ListItemText>{t('editViewerRestriction')}</ListItemText>
                  </MenuItem>
              ]
            : []),
        <MenuItem
            key="delete"
            disabled={published}
            onClick={() => {
                confirm.open(
                    t('confirmDelete'),
                    () => {
                        client.api.deleteProfile(props.subProfile.id).then((_) => {
                            props.onModified?.()
                        })
                    },
                    { confirmText: t('delete') }
                )
            }}
        >
            <ListItemIcon>
                <DeleteForeverIcon sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>{published ? <>{t('plzHideBeforeDelete')}</> : <>{t('delete')}</>}</ListItemText>
        </MenuItem>
    ]

    return (
        <>
            <SubProfileCard character={props.subProfile} additionalMenuItems={menuItems}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        p: 1
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 1,
                            justifyContent: 'flex-end'
                        }}
                    >
                        {published ? <>{t('shownInProfile')}</> : <>{t('hiddenInProfile')}</>}
                        {isTimelinePublic ? <></> : <LockIcon />}
                    </Box>
                    {requests.length > 0 ? <>{t('requestsWithCount', { count: requests.length })}</> : <></>}
                    {timeline ? (
                        <></>
                    ) : (
                        <>
                            <br />
                            {t('errNoTimeline')}
                        </>
                    )}
                    {isTimelineValid ? (
                        <></>
                    ) : (
                        <>
                            <br />
                            {t('errTimelineInvalid')}
                        </>
                    )}
                </Box>
            </SubProfileCard>
            <CCDrawer
                open={editingProfile !== null}
                onClose={() => {
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
                    <Typography variant="h3">{t('edit')}</Typography>
                    <TextField
                        label={t('templateURL')}
                        value={schemaURLDraft}
                        onChange={(e) => {
                            setSchemaURLDraft(e.target.value)
                        }}
                    />
                    <CCEditor schemaURL={schemaURL} value={subprofileDraft} setValue={setSubprofileDraft} />
                    <Button
                        onClick={() => {
                            if (!editingProfile) return
                            client.api
                                .upsertProfile(schemaURL, subprofileDraft, {
                                    id: editingProfile.id
                                })
                                .then((_) => {
                                    setEditingProfile(null)
                                    props.onModified?.()
                                })
                        }}
                    >
                        {t('update')}
                    </Button>
                </Box>
            </CCDrawer>
            <CCDrawer
                open={openReaderEditor}
                onClose={() => {
                    setOpenReaderEditor(false)
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
                    <Typography variant="h3">{t('editViewerRestriction')}</Typography>
                    <UserPicker selected={selectedUsers} setSelected={setSelectedUsers} />
                    <Button
                        onClick={() => {
                            if (!timeline) return
                            const readers = selectedUsers.map((u) => u.ccid)
                            client.api
                                .upsertTimeline(
                                    Schemas.subprofileTimeline,
                                    {
                                        subprofile: props.subProfile.id
                                    },
                                    {
                                        semanticID: 'world.concrnt.t-subhome.' + props.subProfile.id,
                                        indexable: false,
                                        policy: timeline.policy.getPolicySchemaURL(),
                                        policyParams: JSON.stringify(
                                            timeline.policy.copyWithNewReaders(readers).getPolicyParams()
                                        )
                                    }
                                )
                                .then(() => {
                                    timeline.invalidate()
                                    setOpenReaderEditor(false)
                                    props.onModified?.()
                                    enqueueSnackbar(t('updated'), { variant: 'success' })
                                })
                        }}
                    >
                        {t('update')}
                    </Button>
                    {requests.length > 0 && timeline && (
                        <>
                            <Divider />
                            <Typography variant="h4">{t('requests')}</Typography>
                            <Box>
                                {requests.map((request) => (
                                    <WatchRequestAcceptButton
                                        key={request.id}
                                        request={request}
                                        targetTimeline={timeline}
                                        onAccept={() => {
                                            setUpdate((prev) => prev + 1)
                                            if (request.authorUser)
                                                setSelectedUsers((prev) => [...prev, request.authorUser!])
                                        }}
                                    />
                                ))}
                            </Box>
                        </>
                    )}
                </Box>
            </CCDrawer>
        </>
    )
}
