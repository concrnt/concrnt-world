import {
    Accordion,
    AccordionActions,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Checkbox,
    Divider,
    FormControlLabel,
    FormGroup,
    MenuItem,
    Select,
    Switch,
    Typography
} from '@mui/material'
import { usePreference } from '../../context/PreferenceContext'
import { useClient } from '../../context/ClientContext'
import { useEffect, useState } from 'react'
import { useSnackbar } from 'notistack'
import { IssueJWT, Schemas } from '@concurrent-world/client'
import { useTranslation } from 'react-i18next'
import { type NotificationSubscription } from '../../model'

export const GeneralSettings = (): JSX.Element => {
    const { client } = useClient()
    const [invitationCode, setInvitationCode] = useState<string>('')

    const [showEditorOnTop, setShowEditorOnTop] = usePreference('showEditorOnTop')
    const [showEditorOnTopMobile, setShowEditorOnTopMobile] = usePreference('showEditorOnTopMobile')
    const [devMode, setDevMode] = usePreference('devMode')
    const [enableConcord, setEnableConcord] = usePreference('enableConcord')
    const [autoSwitchMediaPostType, setAutoSwitchMediaPostType] = usePreference('autoSwitchMediaPostType')
    const [tutorialCompleted, setTutorialCompleted] = usePreference('tutorialCompleted')

    const tags = client?.user?.tag ? client.user.tag.split(',') : []
    const { enqueueSnackbar } = useSnackbar()

    const [currentLanguage, setCurrentLanguage] = useState<string>('')

    const { t, i18n } = useTranslation('', { keyPrefix: 'settings.general' })

    const [domainInfo, setDomainInfo] = useState<any>()
    const vapidKey = domainInfo?.meta?.vapidKey

    const [notification, setNotification] = useState<NotificationSubscription>()
    const [schemas, setSchemas] = useState<string[]>([])

    const [reload, setReload] = useState<number>(0)

    useEffect(() => {
        setCurrentLanguage(i18n.resolvedLanguage || 'en')
        fetch(`https://${client.api.host}/api/v1/domain`, {
            cache: 'no-cache'
        }).then((res) => {
            res.json().then((data) => {
                setDomainInfo(data.content)
            })
        })
        client.api
            .fetchWithCredential(client.host, `/api/v1/notification/${client.ccid}/concrnt.world`, {})
            .then((res) => {
                res.json().then((data) => {
                    setNotification(data.content)
                    setSchemas(data.content.schemas)
                })
            })
    }, [reload])

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1
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
                >
                    <MenuItem value={'en'}>English</MenuItem>
                    <MenuItem value={'ja'}>日本語</MenuItem>
                    <MenuItem value={'kr'}>한국어 (translated by @Alternative)</MenuItem>
                    <MenuItem value={'th'}>ภาษาไทย</MenuItem>
                    <MenuItem value={'zh-Hans'}>简体中文</MenuItem>
                    <MenuItem value={'zh-Hant'}>繁體中文</MenuItem>
                </Select>
            </Box>
            <Box>
                <Typography variant="h3">{t('basic')}</Typography>
                <FormGroup>
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
                        label={'画像添付時に自動的に投稿タイプを切り替える'}
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
                    メニューにチュートリアルを表示する
                </Button>
            )}
            <Typography variant="h3" gutterBottom>
                通知(プレビュー)
            </Typography>
            通知機能は現在プレビュー版です。一部の通知には対応していません。また、通知の有効化にはブラウザでの通知許可が必要です。
            {notification ? (
                <>
                    <FormGroup>
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
                            label="リプライ"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={schemas.includes(Schemas.mentionAssociation)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSchemas((prev) => [...prev, Schemas.mentionAssociation])
                                        } else {
                                            setSchemas((prev) => prev.filter((s) => s !== Schemas.mentionAssociation))
                                        }
                                    }}
                                />
                            }
                            label="メンション"
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
                            label="閲覧申請"
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
                            label="お気に入り"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={schemas.includes(Schemas.reactionAssociation)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSchemas((prev) => [...prev, Schemas.reactionAssociation])
                                        } else {
                                            setSchemas((prev) => prev.filter((s) => s !== Schemas.reactionAssociation))
                                        }
                                    }}
                                />
                            }
                            label="リアクション"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={schemas.includes(Schemas.rerouteAssociation)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSchemas((prev) => [...prev, Schemas.rerouteAssociation])
                                        } else {
                                            setSchemas((prev) => prev.filter((s) => s !== Schemas.rerouteAssociation))
                                        }
                                    }}
                                />
                            }
                            label="リルート"
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
                                        enqueueSnackbar('通知を無効にしました', { variant: 'success' })
                                        setReload((prev) => prev + 1)
                                    })
                                    .catch((err) => {
                                        console.error(err)
                                        enqueueSnackbar('通知の無効化に失敗しました', { variant: 'error' })
                                    })
                            }}
                        >
                            通知を無効にする
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
                                                    enqueueSnackbar('通知設定を更新しました', { variant: 'success' })
                                                })
                                                .catch((err) => {
                                                    console.error(err)
                                                    enqueueSnackbar('通知設定の更新に失敗しました', {
                                                        variant: 'error'
                                                    })
                                                })
                                        })
                                        .catch((err) => {
                                            console.error(err)
                                            registration.pushManager.getSubscription().then((subscription) => {
                                                subscription?.unsubscribe().then(() => {
                                                    enqueueSnackbar('もう一度お試しください', { variant: 'error' })
                                                })
                                            })
                                        })
                                })
                            }}
                        >
                            更新
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
                                                enqueueSnackbar('通知を有効にしました', { variant: 'success' })
                                                setReload((prev) => prev + 1)
                                            })
                                            .catch((err) => {
                                                console.error(err)
                                                enqueueSnackbar('通知の有効化に失敗しました', { variant: 'error' })
                                            })
                                    })
                                    .catch((err) => {
                                        console.error(err)
                                        registration.pushManager.getSubscription().then((subscription) => {
                                            subscription?.unsubscribe().then(() => {
                                                enqueueSnackbar('もう一度お試しください', { variant: 'error' })
                                            })
                                        })
                                    })
                            })
                        }}
                    >
                        {vapidKey ? '通知を有効にする' : 'お使いのドメインは通知をサポートしていません'}
                    </Button>
                </>
            )}
            {!enableConcord && (
                <Accordion>
                    <AccordionSummary>
                        <Typography variant="h4">Concord Network(プレビュー)</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        Concord
                        NetworkはConcrnt本体の機能を拡張する、別の分散合意ネットワークです。以下の規約の元、有効化することができます。
                        <br />
                        <ul>
                            <li>
                                Concord
                                Networkは現在プレビュー版です。ネットワークは予告なくリセット・変更される予定で、その際ネットワーク上のデータは失われます。それらは再生されません。
                            </li>
                            <li>
                                Concord
                                Networkでは、内部でおたのしみ機能としてポイント機能が提供されますが、いかなる場合でもポイントを換金することはできません。これは、現金化、その他の有価物との交換、その他の仮想通貨とのスワップを含むがこれに限られません。
                            </li>
                        </ul>
                    </AccordionDetails>
                    <AccordionActions>
                        <Button
                            onClick={(_) => {
                                setEnableConcord(true)
                            }}
                        >
                            同意してConcord Networkを有効化
                        </Button>
                    </AccordionActions>
                </Accordion>
            )}
            {tags.includes('_invite') && (
                <>
                    <Typography variant="h3">招待</Typography>
                    {invitationCode === '' ? (
                        <Button
                            onClick={(_) => {
                                if (client.api.host === undefined) {
                                    return
                                }
                                if (!client?.keyPair?.privatekey) return
                                const jwt = IssueJWT(client.keyPair.privatekey, {
                                    iss: client.api.ckid || client.api.ccid,
                                    aud: client.host,
                                    sub: 'CONCRNT_INVITE',
                                    exp: Math.floor((new Date().getTime() + 24 * 60 * 60 * 1000) / 1000).toString()
                                }) // 24h validity
                                setInvitationCode(jwt)
                            }}
                        >
                            {t('generateInviteCode')}
                        </Button>
                    ) : (
                        <>
                            <Typography variant="body1">{t('inviteCode')}</Typography>
                            <pre
                                style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                    backgroundColor: '#333',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    color: '#fff'
                                }}
                            >
                                {invitationCode}
                            </pre>
                            <Button
                                onClick={(_) => {
                                    navigator.clipboard.writeText(invitationCode)
                                    enqueueSnackbar(t('copied'), { variant: 'success' })
                                }}
                            >
                                {t('copyInviteCode')}
                            </Button>
                        </>
                    )}
                </>
            )}
        </Box>
    )
}
