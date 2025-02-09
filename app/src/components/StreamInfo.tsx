import {
    Box,
    Button,
    Divider,
    FormControlLabel,
    FormGroup,
    IconButton,
    InputBase,
    Paper,
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
import IosShareIcon from '@mui/icons-material/IosShare'
import { CCEditor, type CCEditorError } from './ui/cceditor'
import { useSnackbar } from 'notistack'
import { CCWallpaper } from './ui/CCWallpaper'
import { WatchButton } from './WatchButton'
import { PolicyEditor } from './ui/PolicyEditor'
import { CCUserChip } from './ui/CCUserChip'
import { CCIconButton } from './ui/CCIconButton'
import { CCComboBox } from './ui/CCComboBox'
import { useConfirm } from '../context/Confirm'
import { WatchRequestAcceptButton } from './WatchRequestAccpetButton'
import { fetchWithTimeout, IsCCID, IsCSID } from '@concrnt/client'
import SearchIcon from '@mui/icons-material/Search'
import { MessageContainer } from './Message/MessageContainer'
import ClearIcon from '@mui/icons-material/Clear'

export interface StreamInfoProps {
    id: string
    detailed?: boolean
    writers?: string[]
    readers?: string[]
}

interface SearchEntry {
    id: string
    owner: string
}

export function StreamInfo(props: StreamInfoProps): JSX.Element {
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
    const [query, setQuery] = useState<string>('')
    const [searchResults, setSearchResults] = useState<null | SearchEntry[]>(null)
    const [searchedQuery, setSearchedQuery] = useState<string>('')

    const [searchService, setSearchService] = useState<string | null>(null)

    const search = useCallback(
        (query: string) => {
            fetch(`${searchService}/timeline/${props.id}?q=${query}`)
                .then((res) => res.json())
                .then((data) => {
                    setSearchedQuery(query)
                    setSearchResults(data.content ?? [])
                })
        },
        [props.id, searchService]
    )

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
            setPolicyParams(JSON.stringify(e.policyParams))
            setVisible(e.indexable)
            setSchemaDraft(e.schema)
            setPolicyDraft(e.policy || '')

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
                    基本的な権限設定: 'https://policy.concrnt.world/t/inline-read-write.json'
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
            {searchResults === null ? (
                <Box>
                    <Typography variant="caption">ここに検索結果が表示されます</Typography>
                </Box>
            ) : (
                <>
                    {searchResults.length === 0 ? (
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
                                {searchResults.map((result) => (
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
                        </>
                    )}
                </>
            )}
        </Box>
    )

    return (
        <>
            <CCWallpaper
                override={timeline.document.body.banner}
                sx={{
                    minHeight: '150px'
                }}
                innerSx={{
                    display: 'flex',
                    padding: 2,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 1
                }}
            >
                <>
                    <Paper sx={{ flex: 2, padding: 2, userSelect: 'text' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <Typography variant="h1">{timeline.document.body.name}</Typography>
                            <WatchButton minimal timelineFQID={timeline.fqid} />
                            <CCIconButton
                                onClick={() => {
                                    navigator.clipboard.writeText(`https://concrnt.world/timeline/${props.id}`)
                                    enqueueSnackbar('リンクをコピーしました', { variant: 'success' })
                                }}
                            >
                                <IosShareIcon
                                    sx={{
                                        color: 'text.primary'
                                    }}
                                />
                            </CCIconButton>
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                    textDecoration: 'underline'
                                }
                            }}
                            onClick={() => {
                                navigator.clipboard.writeText(props.id)
                                enqueueSnackbar('IDをコピーしました', { variant: 'success' })
                            }}
                        >
                            {props.id}
                        </Typography>
                        <Divider />
                        <Typography>{timeline.document.body.description || 'まだ説明はありません'}</Typography>
                    </Paper>

                    {props.detailed && (
                        <Paper
                            component="form"
                            sx={{
                                p: '2px 4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            onSubmit={(e) => {
                                search(query)
                                e.preventDefault()
                            }}
                            onFocus={() => {
                                setSearchFocused(true)
                            }}
                            onBlur={() => {
                                setSearchFocused(false)
                            }}
                        >
                            <InputBase
                                disabled={searchService === null}
                                sx={{ ml: 1, flex: 1 }}
                                placeholder={
                                    searchService === null
                                        ? `${timeline.host}では検索が利用できません`
                                        : 'Search (beta)'
                                }
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value)
                                }}
                                endAdornment={
                                    query && (
                                        <IconButton
                                            type="button"
                                            sx={{ width: '8px', height: '8px', p: '10px' }}
                                            onClick={() => {
                                                setQuery('')
                                                setSearchResults(null)
                                                setSearchFocused(false)
                                            }}
                                        >
                                            <ClearIcon />
                                        </IconButton>
                                    )
                                }
                            />
                            <IconButton
                                disabled={searchService === null}
                                type="button"
                                sx={{ p: '10px' }}
                                onClick={() => {
                                    search(query)
                                }}
                            >
                                <SearchIcon />
                            </IconButton>
                        </Paper>
                    )}
                </>
            </CCWallpaper>
            {props.detailed && (
                <>
                    {searchFocused || query ? (
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
            )}
        </>
    )
}
