import {
    type CoreProfile,
    type ProfileSchema,
    Schemas,
    type SubprofileTimelineSchema,
    type Timeline,
    type User,
    type Association,
    type ReadAccessRequestAssociationSchema
} from '@concurrent-world/client'

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

interface SubprofileCardWithEditProps {
    mainProfile: ProfileSchema
    subProfile: CoreProfile<any>
    onModified?: () => void
}

export const SubprofileCardWithEdit = (props: SubprofileCardWithEditProps): JSX.Element => {
    const { client } = useClient()
    const { enqueueSnackbar } = useSnackbar()
    const confirm = useConfirm()

    const [timeline, setTimeline] = useState<Timeline<any> | null>(null)

    const enabledSubprofiles = props.mainProfile.subprofiles ?? []
    const published = enabledSubprofiles.includes(props.subProfile.id)

    const [schemaURLDraft, setSchemaURLDraft] = useState<string>('https://schema.concrnt.world/p/basic.json')
    const [schemaURL, setSchemaURL] = useState<any>(null)
    const [editingProfile, setEditingProfile] = useState<CoreProfile<any> | null>(null)
    const [subprofileDraft, setSubprofileDraft] = useState<any>(null)

    const [openReaderEditor, setOpenReaderEditor] = useState<boolean>(false)
    const [selectedUsers, setSelectedUsers] = useState<User[]>([])
    const [requests, setRequests] = useState<Array<Association<ReadAccessRequestAssociationSchema>>>([])

    const [update, setUpdate] = useState<number>(0)

    const isTimelineValid =
        timeline &&
        timeline.document.policy === 'https://policy.concrnt.world/t/inline-read-write.json' &&
        timeline.policyParams.isWritePublic === false &&
        timeline.policyParams.writer.includes(client.ccid)

    const isTimelinePrivate = timeline && timeline.policyParams.isReadPublic === false

    useEffect(() => {
        client.api.invalidateTimeline('world.concrnt.t-subhome.' + props.subProfile.id + '@' + client.ccid!)
        client.getTimeline('world.concrnt.t-subhome.' + props.subProfile.id + '@' + client.ccid!).then((timeline) => {
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
            <ListItemText>{published ? <>掲載をやめる</> : <>掲載する</>}</ListItemText>
        </MenuItem>,
        <MenuItem
            key="togglePrivate"
            onClick={() => {
                if (!timeline?.policyParams) return
                const currentPolicy = timeline.policyParams
                currentPolicy.isReadPublic = !currentPolicy.isReadPublic
                if (!currentPolicy.reader.includes(client.ccid)) {
                    currentPolicy.reader.push(client.ccid)
                }
                client.api
                    .upsertTimeline(
                        Schemas.subprofileTimeline,
                        {
                            subprofile: props.subProfile.id
                        },
                        {
                            semanticID: 'world.concrnt.t-subhome.' + props.subProfile.id,
                            indexable: false,
                            policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                            policyParams: JSON.stringify(currentPolicy)
                        }
                    )
                    .then(() => {
                        timeline.invalidate()
                        props.onModified?.()
                    })
            }}
        >
            <ListItemIcon>
                {isTimelinePrivate ? (
                    <LockOpenIcon sx={{ color: 'text.primary' }} />
                ) : (
                    <LockIcon sx={{ color: 'text.primary' }} />
                )}
            </ListItemIcon>
            <ListItemText>{isTimelinePrivate ? <>ホームを公開する</> : <>ホームを非公開にする</>}</ListItemText>
        </MenuItem>,
        <MenuItem
            key="edit"
            onClick={() => {
                setSubprofileDraft(props.subProfile.document.body)
                setEditingProfile(props.subProfile)
                setSchemaURL(props.subProfile.schema)
                setSchemaURLDraft(props.subProfile.schema)
            }}
        >
            <ListItemIcon>
                <EditIcon sx={{ color: 'text.primary' }} />
            </ListItemIcon>
            <ListItemText>編集</ListItemText>
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
                                  enqueueSnackbar('サブプロフィールタイムラインを修正しました', {
                                      variant: 'success'
                                  })
                                  props.onModified?.()
                              })
                      }}
                  >
                      <ListItemIcon>
                          <MedicationIcon sx={{ color: 'text.primary' }} />
                      </ListItemIcon>
                      <ListItemText>サブプロフィールタイムラインを修正</ListItemText>
                  </MenuItem>
              ]
            : []),
        ...(!timeline || isTimelinePrivate
            ? [
                  <MenuItem
                      key="managereaders"
                      onClick={() => {
                          if (!timeline) return
                          Promise.all(timeline.policyParams.reader.map((e: string) => client.getUser(e))).then(
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
                      <ListItemText>読者を管理</ListItemText>
                  </MenuItem>
              ]
            : []),
        <MenuItem
            key="delete"
            disabled={published}
            onClick={() => {
                confirm.open(
                    'サブプロフィールを削除しますか？',
                    () => {
                        client.api.deleteProfile(props.subProfile.id).then((_) => {
                            props.onModified?.()
                        })
                    },
                    { confirmText: '削除' }
                )
            }}
        >
            <ListItemIcon>
                <DeleteForeverIcon sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>{published ? <>削除するには非公開にしてください</> : <>削除</>}</ListItemText>
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
                        {published ? <>掲載中</> : <>未掲載</>}
                        {isTimelinePrivate ? <LockIcon /> : <></>}
                    </Box>
                    {requests.length > 0 ? <>{requests.length} 件の閲覧リクエスト</> : <></>}
                    {timeline ? (
                        <></>
                    ) : (
                        <>
                            <br />
                            サブプロフィールタイムラインがありません
                        </>
                    )}
                    {isTimelineValid ? (
                        <></>
                    ) : (
                        <>
                            <br />
                            サブプロフィールタイムラインの設定が不完全です
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
                        更新
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
                    <Typography variant="h3">閲覧ユーザーの編集</Typography>
                    <UserPicker selected={selectedUsers} setSelected={setSelectedUsers} />
                    <Button
                        onClick={() => {
                            if (!timeline) return
                            const reader = selectedUsers.map((u) => u.ccid)
                            const currentPolicy = timeline.policyParams
                            currentPolicy.reader = reader
                            client.api
                                .upsertTimeline(
                                    Schemas.subprofileTimeline,
                                    {
                                        subprofile: props.subProfile.id
                                    },
                                    {
                                        semanticID: 'world.concrnt.t-subhome.' + props.subProfile.id,
                                        indexable: false,
                                        policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                                        policyParams: JSON.stringify(currentPolicy)
                                    }
                                )
                                .then(() => {
                                    timeline.invalidate()
                                    setOpenReaderEditor(false)
                                    props.onModified?.()
                                    enqueueSnackbar('更新しました', { variant: 'success' })
                                })
                        }}
                    >
                        更新
                    </Button>
                    {requests.length > 0 && timeline && (
                        <>
                            <Divider />
                            <Typography variant="h4">閲覧リクエスト</Typography>
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
