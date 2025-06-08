import {
    Accordion,
    AccordionActions,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    List,
    ListItem,
    MenuItem,
    Select,
    Slider,
    Switch,
    TextField,
    Typography
} from '@mui/material'
import { usePreference } from '../../context/PreferenceContext'
import { useClient } from '../../context/ClientContext'
import { useEffect, useState } from 'react'
import { useSnackbar } from 'notistack'
import { CommunityTimelineSchema, Schemas, Timeline } from '@concrnt/worldlib'
import { useTranslation } from 'react-i18next'
import { type NotificationSubscription } from '../../model'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import TextIncreaseIcon from '@mui/icons-material/TextIncrease'
import TextDecreaseIcon from '@mui/icons-material/TextDecrease'
import DeleteIcon from '@mui/icons-material/Delete'
import { CCIconButton } from '../ui/CCIconButton'
import { ListItemTimeline } from '../ui/ListItemTimeline'
import { TimelineSelector } from '../ui/TimelineSelector'

export const GeneralSettings = (): JSX.Element => {
    const { client } = useClient()

    const [showEditorOnTop, setShowEditorOnTop] = usePreference('showEditorOnTop')
    const [stripExif, setStripExif] = usePreference('stripExif')
    const [showEditorOnTopMobile, setShowEditorOnTopMobile] = usePreference('showEditorOnTopMobile')
    const [muteWords, setMuteWords] = usePreference('muteWords')
    const [muteTimelines, setMuteTimelines] = usePreference('muteTimelines')
    const [devMode, setDevMode] = usePreference('devMode')
    const [enableConcord, setEnableConcord] = usePreference('enableConcord')
    const [autoSwitchMediaPostType, setAutoSwitchMediaPostType] = usePreference('autoSwitchMediaPostType')
    const [tutorialCompleted, setTutorialCompleted] = usePreference('tutorialCompleted')
    const [baseFontSize, setBaseFontSize] = usePreference('baseFontSize')
    const [inviteComment, setInviteComment] = useState<string>('')
    const [preferredTimeline, setPreferredTimeline] = useState<Timeline<CommunityTimelineSchema> | undefined>(undefined)

    const { enqueueSnackbar } = useSnackbar()

    const [currentLanguage, setCurrentLanguage] = useState<string>('')

    const { t, i18n } = useTranslation('', { keyPrefix: 'settings.general' })

    const [domainInfo, setDomainInfo] = useState<any>()
    const vapidKey = domainInfo?.meta?.vapidKey

    const [notification, setNotification] = useState<NotificationSubscription>()
    const [schemas, setSchemas] = useState<string[]>([])

    const [reload, setReload] = useState<number>(0)

    const [openMuteAdder, setOpenMuteAdder] = useState<boolean>(false)
    const [muteWordDraft, setMuteWordDraft] = useState<string>('')

    useEffect(() => {
        setCurrentLanguage(i18n.resolvedLanguage || 'en')
        fetch(`https://${client.host}/api/v1/domain`, {
            cache: 'no-cache'
        }).then((res) => {
            res.json().then((data) => {
                setDomainInfo(data.content)
            })
        })
        client.api
            .fetchWithCredential<any>(client.host, `/api/v1/notification/${client.ccid}/concrnt.world`, {})
            .then((data) => {
                setNotification(data.content)
                setSchemas(data.content.schemas ?? [])
            })
    }, [reload])

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}
        >
            <Box>
                <Typography variant="h3">{t('language')}</Typography>
                <Select
                    value={currentLanguage}
                    onChange={(e) => {
                        i18n.changeLanguage(e.target.value)
                        setCurrentLanguage(e.target.value)
                    }}
                    sx={{
                        marginLeft: 2
                    }}
                >
                    <MenuItem value={'en'}>English</MenuItem>
                    <MenuItem value={'ja'}>日本語</MenuItem>
                    <MenuItem value={'ko'}>한국어</MenuItem>
                    <MenuItem value={'th'}>ภาษาไทย</MenuItem>
                    <MenuItem value={'zh-Hans'}>简体中文</MenuItem>
                    <MenuItem value={'zh-Hant'}>繁體中文</MenuItem>
                </Select>
            </Box>
            <Box>
                <Typography variant="h3">{t('basic')}</Typography>
                <FormGroup
                    sx={{
                        marginLeft: 2
                    }}
                >
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showEditorOnTop}
                                onChange={(e) => {
                                    setShowEditorOnTop(e.target.checked)
                                }}
                            />
                        }
                        label={t('showEditorOnTop')}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showEditorOnTopMobile}
                                onChange={(e) => {
                                    setShowEditorOnTopMobile(e.target.checked)
                                }}
                            />
                        }
                        label={t('showEditorOnTopMobile')}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoSwitchMediaPostType}
                                onChange={(e) => {
                                    setAutoSwitchMediaPostType(e.target.checked)
                                }}
                            />
                        }
                        label={t('autoSwitchMediaPostType')}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={stripExif}
                                onChange={(e) => {
                                    setStripExif(e.target.checked)
                                }}
                            />
                        }
                        label={t('stripExif')}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={devMode}
                                onChange={(e) => {
                                    setDevMode(e.target.checked)
                                }}
                            />
                        }
                        label={t('developerMode')}
                    />
                    {enableConcord && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={enableConcord}
                                    onChange={(e) => {
                                        setEnableConcord(e.target.checked)
                                    }}
                                />
                            }
                            label={'Concord Network'}
                        />
                    )}
                </FormGroup>
            </Box>
            {tutorialCompleted && (
                <Button
                    onClick={(_) => {
                        setTutorialCompleted(false)
                    }}
                >
                    {t('showTutorial')}
                </Button>
            )}
            <Box>
                <Typography variant="h3">{t('fontSize')}</Typography>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        width: '80%',
                        marginLeft: 2
                    }}
                >
                    <TextDecreaseIcon
                        sx={{
                            fontSize: '18px'
                        }}
                    />
                    <Slider
                        value={baseFontSize}
                        onChange={(_, value) => {
                            setBaseFontSize(value as number)
                        }}
                        aria-labelledby="discrete-slider"
                        valueLabelDisplay="auto"
                        step={2}
                        marks
                        min={12}
                        max={20}
                    />
                    <TextIncreaseIcon
                        sx={{
                            fontSize: '30px'
                        }}
                    />
                </Box>
            </Box>

            <Box>
                <Typography variant="h3" gutterBottom>
                    {t('notification.title')}
                </Typography>
                {notification ? (
                    <>
                        <FormGroup
                            sx={{
                                marginLeft: 2
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={schemas.includes(Schemas.replyAssociation)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSchemas((prev) => [...prev, Schemas.replyAssociation])
                                            } else {
                                                setSchemas((prev) => prev.filter((s) => s !== Schemas.replyAssociation))
                                            }
                                        }}
                                    />
                                }
                                label={t('notification.reply')}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={schemas.includes(Schemas.mentionAssociation)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSchemas((prev) => [...prev, Schemas.mentionAssociation])
                                            } else {
                                                setSchemas((prev) =>
                                                    prev.filter((s) => s !== Schemas.mentionAssociation)
                                                )
                                            }
                                        }}
                                    />
                                }
                                label={t('notification.mention')}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={schemas.includes(Schemas.readAccessRequestAssociation)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSchemas((prev) => [...prev, Schemas.readAccessRequestAssociation])
                                            } else {
                                                setSchemas((prev) =>
                                                    prev.filter((s) => s !== Schemas.readAccessRequestAssociation)
                                                )
                                            }
                                        }}
                                    />
                                }
                                label={t('notification.viewerRequest')}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={schemas.includes(Schemas.likeAssociation)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSchemas((prev) => [...prev, Schemas.likeAssociation])
                                            } else {
                                                setSchemas((prev) => prev.filter((s) => s !== Schemas.likeAssociation))
                                            }
                                        }}
                                    />
                                }
                                label={t('notification.fav')}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={schemas.includes(Schemas.reactionAssociation)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSchemas((prev) => [...prev, Schemas.reactionAssociation])
                                            } else {
                                                setSchemas((prev) =>
                                                    prev.filter((s) => s !== Schemas.reactionAssociation)
                                                )
                                            }
                                        }}
                                    />
                                }
                                label={t('notification.reaction')}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={schemas.includes(Schemas.rerouteAssociation)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSchemas((prev) => [...prev, Schemas.rerouteAssociation])
                                            } else {
                                                setSchemas((prev) =>
                                                    prev.filter((s) => s !== Schemas.rerouteAssociation)
                                                )
                                            }
                                        }}
                                    />
                                }
                                label={t('notification.reroute')}
                            />
                        </FormGroup>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                width: '100%',
                                justifyContent: 'flex-end'
                            }}
                        >
                            <Button
                                color="error"
                                variant="text"
                                onClick={async () => {
                                    if (!client.ccid || !client.user?.notificationTimeline) {
                                        return
                                    }

                                    client.api
                                        .fetchWithCredential(
                                            client.host,
                                            `/api/v1/notification/${client.ccid}/concrnt.world`,
                                            {
                                                method: 'DELETE'
                                            }
                                        )
                                        .then((res) => {
                                            enqueueSnackbar(t('notification.disabled'), { variant: 'success' })
                                            setReload((prev) => prev + 1)
                                        })
                                        .catch((err) => {
                                            console.error(err)
                                            enqueueSnackbar(t('notification.failed'), { variant: 'error' })
                                        })
                                }}
                            >
                                {t('notification.disable')}
                            </Button>

                            <Button
                                onClick={async () => {
                                    if (!('serviceWorker' in navigator)) {
                                        console.error('Service Worker not supported')
                                        return
                                    }

                                    navigator.serviceWorker.ready.then((registration) => {
                                        registration.pushManager
                                            .subscribe({
                                                userVisibleOnly: true,
                                                applicationServerKey: vapidKey
                                            })
                                            .then((subscription) => {
                                                if (!client.ccid || !client.user?.notificationTimeline) {
                                                    return
                                                }

                                                const notifySub: NotificationSubscription = {
                                                    vendorID: 'concrnt.world',
                                                    owner: client.ccid,
                                                    schemas,
                                                    timelines: [client.user?.notificationTimeline],
                                                    subscription: JSON.stringify(subscription)
                                                }

                                                client.api
                                                    .fetchWithCredential(client.host, '/api/v1/notification', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json'
                                                        },
                                                        body: JSON.stringify(notifySub)
                                                    })
                                                    .then((res) => {
                                                        enqueueSnackbar(t('notification.updated'), {
                                                            variant: 'success'
                                                        })
                                                    })
                                                    .catch((err) => {
                                                        console.error(err)
                                                        enqueueSnackbar(t('notification.failed'), {
                                                            variant: 'error'
                                                        })
                                                    })
                                            })
                                            .catch((err) => {
                                                console.error(err)
                                                registration.pushManager.getSubscription().then((subscription) => {
                                                    subscription?.unsubscribe().then(() => {
                                                        enqueueSnackbar(t('notification.tryAgain'), {
                                                            variant: 'error'
                                                        })
                                                    })
                                                })
                                            })
                                    })
                                }}
                            >
                                {t('notification.update')}
                            </Button>
                        </Box>
                    </>
                ) : (
                    <>
                        <Button
                            disabled={!vapidKey}
                            onClick={async () => {
                                if (!('serviceWorker' in navigator)) {
                                    console.error('Service Worker not supported')
                                    return
                                }

                                navigator.serviceWorker.ready.then((registration) => {
                                    // check if the registration is already subscribed
                                    registration.pushManager
                                        .subscribe({
                                            userVisibleOnly: true,
                                            applicationServerKey: vapidKey
                                        })
                                        .then((subscription) => {
                                            if (!client.ccid || !client.user?.notificationTimeline) {
                                                return
                                            }

                                            const notifySub: NotificationSubscription = {
                                                vendorID: 'concrnt.world',
                                                owner: client.ccid,
                                                schemas: [
                                                    Schemas.replyAssociation,
                                                    Schemas.mentionAssociation,
                                                    Schemas.readAccessRequestAssociation
                                                ],
                                                timelines: [client.user?.notificationTimeline],
                                                subscription: JSON.stringify(subscription)
                                            }

                                            client.api
                                                .fetchWithCredential(client.host, '/api/v1/notification', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json'
                                                    },
                                                    body: JSON.stringify(notifySub)
                                                })
                                                .then((res) => {
                                                    enqueueSnackbar(t('notification.enabled'), { variant: 'success' })
                                                    setReload((prev) => prev + 1)
                                                })
                                                .catch((err) => {
                                                    console.error(err)
                                                    enqueueSnackbar(t('notification.failed'), { variant: 'error' })
                                                })
                                        })
                                        .catch((err) => {
                                            console.error(err)
                                            registration.pushManager.getSubscription().then((subscription) => {
                                                subscription?.unsubscribe().then(() => {
                                                    enqueueSnackbar(t('notification.tryAgain'), { variant: 'error' })
                                                })
                                            })
                                        })
                                })
                            }}
                        >
                            {vapidKey ? t('notification.enable') : t('notification.notsupported')}
                        </Button>
                    </>
                )}
            </Box>
            {!enableConcord && (
                <Accordion disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h4">{t('concordPreviewTitle')}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {t('concordDesc1')}
                        <br />
                        <ul>
                            <li>{t('concordDesc2')}</li>
                            <li>{t('concordDesc3')}</li>
                        </ul>
                    </AccordionDetails>
                    <AccordionActions>
                        <Button
                            onClick={(_) => {
                                setEnableConcord(true)
                            }}
                        >
                            {t('concordEnable')}
                        </Button>
                    </AccordionActions>
                </Accordion>
            )}
            <Typography variant="h3">{t('mute')} (beta)</Typography>
            <Box
                sx={{
                    marginLeft: 2
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Typography variant="h4">{t('wordMute')}</Typography>
                    <Button
                        onClick={(_) => {
                            setOpenMuteAdder(true)
                        }}
                    >
                        {t('add')}
                    </Button>
                </Box>
                <List dense>
                    {muteWords.map((word, index) => (
                        <ListItem
                            dense
                            key={index}
                            sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center'
                            }}
                            secondaryAction={
                                <CCIconButton
                                    onClick={(_) => {
                                        const newMuteWords = muteWords.filter((_, i) => i !== index)
                                        setMuteWords(newMuteWords)
                                    }}
                                >
                                    <DeleteIcon />
                                </CCIconButton>
                            }
                        >
                            <Typography variant="body1">{word}</Typography>
                        </ListItem>
                    ))}
                </List>

                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Typography variant="h4">{t('timelineMute')}</Typography>
                </Box>

                <List dense>
                    {muteTimelines.map((timelineID) => (
                        <ListItemTimeline
                            timelineID={timelineID}
                            key={timelineID}
                            secondaryAction={
                                <CCIconButton
                                    onClick={(_) => {
                                        setMuteTimelines(muteTimelines.filter((id) => id !== timelineID))
                                    }}
                                >
                                    <DeleteIcon />
                                </CCIconButton>
                            }
                        />
                    ))}
                </List>

                <Dialog
                    open={openMuteAdder}
                    onClose={(_) => {
                        setOpenMuteAdder(false)
                    }}
                >
                    <DialogTitle>{t('addMuteWord')}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>{t('addMuteWordDesc')}</DialogContentText>
                        <TextField
                            fullWidth
                            value={muteWordDraft}
                            onChange={(e) => {
                                setMuteWordDraft(e.target.value)
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            variant="text"
                            onClick={(_) => {
                                setOpenMuteAdder(false)
                                setMuteWordDraft('')
                            }}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            onClick={(_) => {
                                setMuteWords([...muteWords, muteWordDraft])
                                setOpenMuteAdder(false)
                            }}
                        >
                            {t('add')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
            <Accordion disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h4">{t('invitation')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {domainInfo?.meta?.registration == 'invite' && (
                        <Alert severity="info" sx={{ marginBottom: 2 }}>
                            {t('inviteNote')}
                        </Alert>
                    )}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}
                    >
                        <TextField
                            fullWidth
                            label={t('inviteComment')}
                            value={inviteComment}
                            onChange={(e) => {
                                setInviteComment(e.target.value)
                            }}
                            placeholder={'welcome'}
                        />
                        <TimelineSelector
                            label={t('inviteTimeline')}
                            selected={preferredTimeline}
                            setSelected={setPreferredTimeline}
                        />
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            justifyContent: 'flex-end',
                            marginTop: 2
                        }}
                    >
                        <Button
                            onClick={(_) => {
                                if (client.host === undefined) {
                                    return
                                }

                                let link = `${window.location.origin}/invitation#inviter=${client.ccid}&domain=${client.host}`
                                if (inviteComment) link += `&comment=${encodeURIComponent(inviteComment)}`
                                if (preferredTimeline) link += `&timeline=${preferredTimeline.id}`
                                if (domainInfo?.meta?.registration == 'invite') {
                                    const jwt = client.api.authProvider.issueJWT({
                                        aud: client.host,
                                        sub: 'CONCRNT_INVITE',
                                        exp: Math.floor(
                                            (new Date().getTime() + 14 * 24 * 60 * 60 * 1000) / 1000
                                        ).toString()
                                    })
                                    link += `&ticket=${jwt}`
                                }

                                navigator.clipboard.writeText(link)
                                enqueueSnackbar(t('copied'), { variant: 'success' })
                            }}
                        >
                            {t('copyInviteLink')}
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    )
}
