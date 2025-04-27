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
import { useCallback, useEffect, useState } from 'react'
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
                enqueueSnackbar('更新しました', { variant: 'success' })
            })
            .catch((_) => {
                enqueueSnackbar('更新に失敗しました', { variant: 'error' })
            })
    }, [client.api, timeline, schemaDraft, props.id, visible, enqueueSnackbar, documentBody, policyDraft, policyParams])

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
                        <AlertTitle>このコミュニティにはカスタムポリシーが設定されています</AlertTitle>
                        そのため、読み込み権限・書き込み権限のあるユーザーの表示が正常に行われない場合があります。
                    </Alert>
                </>
            )}

            {isAuthor && (
                <>
                    <Typography variant="h3">閲覧リクエスト({requests.length})</Typography>
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
                    label="検索可能"
                />
            </FormGroup>
            <Typography variant="h3">権限</Typography>
            <Box>
                <Typography>空の場合パブリックになります。</Typography>
            </Box>
            <Typography variant="h3">スキーマ</Typography>
            <TextField
                label="Schema"
                error={!schemaDraft?.startsWith('https://')}
                helperText="JsonSchema URLを入力。基本的に変更する必要はありません"
                value={schemaDraft}
                onChange={(e) => {
                    setSchemaDraft(e.target.value)
                }}
            />
            <Box>
                <Typography variant="h3">属性</Typography>
                <CCEditor
                    schemaURL={schemaDraft}
                    value={documentBody}
                    setValue={(e) => {
                        setDocumentBody(e)
                    }}
                />
            </Box>
            <Typography variant="h3">ポリシー</Typography>

            <CCComboBox
                label="Policy"
                error={!policyDraft?.startsWith('https://') && policyDraft !== ''}
                helperText={
                    policyDraft === '' ? '空の場合はデフォルトポリシーが適用されます' : 'PolicyJSONのURLを入力。'
                }
                options={{
                    基本的な権限設定: 'https://policy.concrnt.world/t/inline-allow-deny.json',
                    '基本的な権限設定(レガシー)': 'https://policy.concrnt.world/t/inline-read-write.json',
                    フォロイー限定設定: 'https://policy.concrnt.world/t/restrict-ackees.json'
                }}
                value={policyDraft ?? ''}
                onChange={(value) => {
                    setPolicyDraft(value)
                }}
            />

            {policyDraft && (
                <Box>
                    <Typography variant="h3">ポリシーパラメーター</Typography>
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
                保存
            </Button>
            <Button
                color="error"
                onClick={() => {
                    confirm.open(
                        'コミュニティを削除しますか？',
                        () => {
                            client.api.deleteTimeline(props.id.split('@')[0]).then((_) => {
                                enqueueSnackbar('削除しました', { variant: 'success' })
                            })
                        },
                        {
                            confirmText: '削除',
                            description:
                                'この操作は取り消せません。コミュニティを削除しても、コミュニティに投稿されたメッセージは削除されませんが、リンクを失う可能性があります。'
                        }
                    )
                }}
            >
                削除
            </Button>
        </Box>
    )

    const searchTab = (
        <Box p={2}>
            {searchResult === null ? (
                <Box>
                    <Typography variant="caption">ここに検索結果が表示されます</Typography>
                </Box>
            ) : (
                <>
                    {!searchResult.content || searchResult.content.length === 0 ? (
                        <Box>
                            <Typography>見つかりませんでした</Typography>
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
                                <Typography variant="h3">{searchedQuery}の検索結果</Typography>
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
                                    Prev
                                </Button>
                                <Typography>{searchPage + 1}</Typography>
                                <Button
                                    disabled={searchResult.content.length < (searchResult.limit ?? 0)}
                                    onClick={() => {
                                        setSearchPage((e) => e + 1)
                                    }}
                                >
                                    Next
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
                    placeholder={searchService === null ? `${timeline.host}では検索が利用できません` : 'Search (beta)'}
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
                        <Tab value="info" label={'情報'} />
                        <Tab value="edit" label={'編集'} disabled={!isAuthor} />
                    </Tabs>

                    <Divider />

                    {tab === 'info' && infoTab}
                    {tab === 'edit' && editTab}
                </>
            )}
        </>
    )
}
