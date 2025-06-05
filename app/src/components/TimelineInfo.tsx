import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Divider,
    FormControlLabel,
    FormGroup,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useClient } from '../context/ClientContext'
import {
    type Timeline,
    type CommunityTimelineSchema,
    type Association,
    type ReadAccessRequestAssociationSchema,
    Schemas
} from '@concrnt/worldlib'
import { CCEditor, type CCEditorError } from './ui/cceditor'
import { useSnackbar } from 'notistack'
import { PolicyEditor } from './ui/PolicyEditor'
import { CCUserChip } from './ui/CCUserChip'
import { CCComboBox } from './ui/CCComboBox'
import { useConfirm } from '../context/Confirm'
import { WatchRequestAcceptButton } from './WatchRequestAccpetButton'
import { fetchWithTimeout, IsCCID, IsCSID } from '@concrnt/client'
import { MessageContainer } from './Message/MessageContainer'
import { SearchBox } from './ui/SearchBox'
import { TimelineBanner } from './TimelineBanner'
import { useTranslation } from 'react-i18next'

export interface TimelineInfoProps {
    id: string
    writers?: string[]
    readers?: string[]
}

interface SearchEntry {
    id: string
    owner: string
}

interface SearchResult {
    content?: SearchEntry[]
    limit?: number
    offset?: number
}

export function TimelineInfo(props: TimelineInfoProps): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'ui.timelineInfo' })

    const { client } = useClient()
    const confirm = useConfirm()
    const { enqueueSnackbar } = useSnackbar()
    const [timeline, setTimeline] = useState<Timeline<CommunityTimelineSchema>>()
    const isAuthor = timeline?.author === client.ccid

    const [visible, setVisible] = useState(false)
    const [schemaDraft, setSchemaDraft] = useState('')
    const [policyDraft, setPolicyDraft] = useState<string | undefined>(undefined)

    const [documentBody, setDocumentBody] = useState<CommunityTimelineSchema | undefined>(timeline?.document.body)
    const [policyParams, setPolicyParams] = useState<string | undefined>()
    const [policyErrors, setPolicyErrors] = useState<CCEditorError[] | undefined>()

    const [requests, setRequests] = useState<Array<Association<ReadAccessRequestAssociationSchema>>>([])

    const [tab, setTab] = useState<'info' | 'edit'>('info')

    const [update, setUpdate] = useState(0)

    const [searchFocused, setSearchFocused] = useState(false)
    const [searchResult, setSearchResult] = useState<null | SearchResult>(null)
    const [searchedQuery, setSearchedQuery] = useState<string>('')
    const [searchPage, setSearchPage] = useState(0)

    const [searchService, setSearchService] = useState<string | null>(null)

    useEffect(() => {
        if (!searchService || !props.id || !searchedQuery) return
        fetch(`${searchService}/timeline/${props.id}?q=${searchedQuery}&limit=10&offset=${searchPage * 10}`)
            .then((res) => res.json())
            .then((data) => {
                setSearchResult(data)
            })
    }, [searchService, props.id, searchedQuery, searchPage])

    useEffect(() => {
        if (!timeline?.host) return

        fetchWithTimeout(`https://${timeline.host}/services`, {})
            .then((res) => res.json())
            .then((data) => {
                if ('net.concrnt.search' in data) {
                    const service = data['net.concrnt.search']
                    setSearchService(`https://${timeline.host}${service.path}`)
                }
            })
    }, [timeline?.host])

    useEffect(() => {
        if (!props.id) return
        client.getTimeline<CommunityTimelineSchema>(props.id, { cache: 'no-cache' }).then((e) => {
            if (!e) return
            setTimeline(e)
            setDocumentBody(e.document.body)
            setPolicyParams(JSON.stringify(e.policy.getPolicyParams()))
            setVisible(e.indexable)
            setSchemaDraft(e.schema)
            setPolicyDraft(e.policy.getPolicySchemaURL())

            e.getAssociations().then((assocs) => {
                setRequests(assocs.filter((e) => e.schema === Schemas.readAccessRequestAssociation))
            })
        })
    }, [props.id, update])

    const updateStream = useCallback(() => {
        if (!timeline) return

        const opts: any = {
            indexable: visible,
            policy: policyDraft,
            policyParams
        }

        const split = props.id.split('@')
        if (split.length === 2 && (IsCCID(split[1]) || IsCSID(split[1]))) {
            opts.semanticID = split[0]
        } else {
            opts.id = timeline.id
        }

        client.api
            .upsertTimeline(schemaDraft, documentBody, opts)
            .then((_) => {
                setUpdate((e) => e + 1)
                enqueueSnackbar(t('updated'), { variant: 'success' })
            })
            .catch((_) => {
                enqueueSnackbar(t('failedToUpdate'), { variant: 'error' })
            })
    }, [client.api, timeline, schemaDraft, props.id, visible, enqueueSnackbar, documentBody, policyDraft, policyParams])

    const options = useMemo(() => {
        const opts: Record<string, string> = {}
        opts[t('inlineAllowDeny')] = 'https://policy.concrnt.world/t/inline-allow-deny.json'
        opts[t('inlineReadWrite')] = 'https://policy.concrnt.world/t/inline-read-write.json'
        opts[t('restrictAckees')] = 'https://policy.concrnt.world/t/restrict-ackees.json'
        return opts
    }, [])

    if (!timeline) {
        return <>stream information not found</>
    }

    const settingValid =
        schemaDraft.startsWith('https://') && (policyDraft === '' || policyDraft?.startsWith('https://'))

    const infoTab = (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                p: 1
            }}
        >
            {!timeline.policy.isRegistered() && (
                <>
                    <Alert severity="info">
                        <AlertTitle>{t('warnCustomPolicy')}</AlertTitle>
                        {t('warnCustomPolicyDesc')}
                    </Alert>
                </>
            )}

            {isAuthor && (
                <>
                    <Typography variant="h3">{t('readRequests', { count: requests.length })}</Typography>
                    <Box>
                        {requests.map((request) => (
                            <WatchRequestAcceptButton
                                key={request.id}
                                request={request}
                                targetTimeline={timeline}
                                onAccept={() => {
                                    setRequests(requests.filter((e) => e.id !== request.id))
                                }}
                            />
                        ))}
                    </Box>
                </>
            )}

            <Typography variant="h3">Creator</Typography>
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap'
                }}
            >
                <CCUserChip avatar ccid={timeline.author} />
            </Box>
            {props.writers && props.writers.length > 0 && (
                <>
                    <Typography variant="h3">Writer</Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            flexWrap: 'wrap'
                        }}
                    >
                        {props.writers.map((e) => (
                            <CCUserChip avatar key={e} ccid={e} />
                        ))}
                    </Box>
                </>
            )}

            {props.readers && props.readers.length > 0 && (
                <>
                    <Typography variant="h3">Reader</Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            flexWrap: 'wrap'
                        }}
                    >
                        {props.readers.map((e) => (
                            <CCUserChip avatar key={e} ccid={e} />
                        ))}
                    </Box>
                </>
            )}
        </Box>
    )

    const editTab = (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                p: 1
            }}
        >
            <FormGroup>
                <FormControlLabel
                    control={
                        <Switch
                            checked={visible}
                            onChange={(e) => {
                                setVisible(e.target.checked)
                            }}
                        />
                    }
                    label={t('indexable')}
                />
            </FormGroup>
            <Typography variant="h3">{t('schema')}</Typography>
            <TextField
                label="Schema"
                error={!schemaDraft?.startsWith('https://')}
                helperText={t('schemaDesc')}
                value={schemaDraft}
                onChange={(e) => {
                    setSchemaDraft(e.target.value)
                }}
            />
            <Box>
                <Typography variant="h3">{t('attributes')}</Typography>
                <CCEditor
                    schemaURL={schemaDraft}
                    value={documentBody}
                    setValue={(e) => {
                        setDocumentBody(e)
                    }}
                />
            </Box>
            <Typography variant="h3">{t('policy')}</Typography>

            <CCComboBox
                label="Policy"
                error={!policyDraft?.startsWith('https://') && policyDraft !== ''}
                helperText={policyDraft === '' ? t('policyDesc') : t('enterPolicy')}
                options={options}
                value={policyDraft ?? ''}
                onChange={(value) => {
                    setPolicyDraft(value)
                }}
            />

            {policyDraft && (
                <Box>
                    <Typography variant="h3">{t('params')}</Typography>
                    <PolicyEditor
                        policyURL={policyDraft}
                        value={policyParams}
                        setValue={(e) => {
                            setPolicyParams(e)
                        }}
                        setErrors={(e) => {
                            setPolicyErrors(e)
                        }}
                    />
                </Box>
            )}
            <Button
                onClick={() => {
                    updateStream()
                }}
                disabled={!settingValid || (policyErrors && policyErrors.length > 0)}
            >
                {t('save')}
            </Button>
            <Button
                color="error"
                onClick={() => {
                    confirm.open(
                        t('deleteConfirm'),
                        () => {
                            client.api.deleteTimeline(props.id.split('@')[0]).then((_) => {
                                enqueueSnackbar(t('deleted'), { variant: 'success' })
                            })
                        },
                        {
                            confirmText: t('delete'),
                            description: t('deleteDesc')
                        }
                    )
                }}
            >
                {t('delete')}
            </Button>
        </Box>
    )

    const searchTab = (
        <Box p={2}>
            {searchResult === null ? (
                <Box>
                    <Typography variant="caption">{t('searchResultPlaceholder')}</Typography>
                </Box>
            ) : (
                <>
                    {!searchResult.content || searchResult.content.length === 0 ? (
                        <Box>
                            <Typography>{t('searchResultEmpty')}</Typography>
                        </Box>
                    ) : (
                        <>
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    listStyle: 'none',
                                    overflowX: 'hidden',
                                    overflowY: 'auto',
                                    overscrollBehaviorY: 'none',
                                    scrollbarGutter: 'stable',
                                    gap: 1
                                }}
                            >
                                <Typography variant="h3">{t('searchResultTitle', { query: searchedQuery })}</Typography>
                                {searchResult.content.map((result) => (
                                    <>
                                        <MessageContainer
                                            key={result.id}
                                            messageID={result.id}
                                            messageOwner={result.owner}
                                            after={<Divider />}
                                        />
                                    </>
                                ))}
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mt: 2
                                }}
                            >
                                <Button
                                    disabled={searchPage === 0}
                                    onClick={() => {
                                        setSearchPage((e) => e - 1)
                                    }}
                                >
                                    {t('prev')}
                                </Button>
                                <Typography>{searchPage + 1}</Typography>
                                <Button
                                    disabled={searchResult.content.length < (searchResult.limit ?? 0)}
                                    onClick={() => {
                                        setSearchPage((e) => e + 1)
                                    }}
                                >
                                    {t('next')}
                                </Button>
                            </Box>
                        </>
                    )}
                </>
            )}
        </Box>
    )

    return (
        <>
            <TimelineBanner timeline={timeline}>
                <SearchBox
                    onEnter={(query) => {
                        setSearchedQuery(query)
                    }}
                    updateFocused={setSearchFocused}
                    disabled={searchService === null}
                    placeholder={
                        searchService === null ? t('searchNotAvailable', { host: timeline.host }) : t('search')
                    }
                    onClear={() => {
                        setSearchResult(null)
                        setSearchedQuery('')
                        setSearchFocused(false)
                    }}
                />
            </TimelineBanner>
            {searchFocused || searchedQuery ? (
                searchTab
            ) : (
                <>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => {
                            setTab(v)
                        }}
                    >
                        <Tab value="info" label={t('info')} />
                        <Tab value="edit" label={t('edit')} disabled={!isAuthor} />
                    </Tabs>

                    <Divider />

                    {tab === 'info' && infoTab}
                    {tab === 'edit' && editTab}
                </>
            )}
        </>
    )
}
