import {
    Box,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Checkbox
} from '@mui/material'
import { useEffect, useState } from 'react'
import { CCDrawer } from '../ui/CCDrawer'
import { type DeepPartial } from '../../util'
import { type BadgeSeriesType, useConcord } from '../../context/ConcordContext'
import { useTranslation } from 'react-i18next'

export interface BadgeSeriesProps {
    address: string
    onDone?: (hash: string) => void
}

export const BadgeSeries = (props: BadgeSeriesProps): JSX.Element => {
    const concord = useConcord()
    const { t } = useTranslation('', { keyPrefix: 'pages.concord.badges' })

    const [processing, setProcessing] = useState<boolean>(false)

    const [series, setSeries] = useState<BadgeSeriesType[]>([])

    const [createSeries, setCreateSeries] = useState<boolean>(false)
    const [seriesDraft, setSeriesDraft] = useState<DeepPartial<BadgeSeriesType>>({})

    const [mintingSeries, setMintingSeries] = useState<string>('')
    const [mintUriDraft, setMintUriDraft] = useState<string>('')
    const [receiverDraft, setReceiverDraft] = useState<string>('')

    useEffect(() => {
        if (!props.address) return
        concord.getSeries(props.address).then((resp) => {
            setSeries(resp)
        })
    }, [props.address])

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Typography variant="h3">{t('series')}</Typography>
                <Button
                    disabled={processing || !concord.cosmJS}
                    onClick={() => {
                        setCreateSeries(true)
                    }}
                >
                    {t('addNew')}
                </Button>
            </Box>
            <Box>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Visual</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>isTransferable</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {series?.map((b: any, i: number) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <img src={b.uri} alt={b.name} width="64" height="64" />
                                </TableCell>
                                <TableCell>{b.name}</TableCell>
                                <TableCell>{b.description}</TableCell>
                                <TableCell>{b.data.transferable ? 'Yes' : 'No'}</TableCell>
                                <TableCell>
                                    <Button
                                        disabled={!concord.cosmJS}
                                        onClick={() => {
                                            setMintingSeries(b.id)
                                        }}
                                    >
                                        {t('mint')}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
            <CCDrawer
                open={createSeries}
                onClose={() => {
                    setCreateSeries(false)
                }}
            >
                <Box
                    sx={{
                        p: 1,
                        wordBreak: 'break-all',
                        whiteSpace: 'pre-wrap',
                        userSelect: 'text',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}
                >
                    <Typography variant="h3">{t('newSeries')}</Typography>
                    <TextField
                        label="Name"
                        value={seriesDraft?.name}
                        onChange={(e) => {
                            setSeriesDraft({ ...seriesDraft, name: e.target.value })
                        }}
                    />
                    <TextField
                        label="Description"
                        value={seriesDraft?.description}
                        onChange={(e) => {
                            setSeriesDraft({ ...seriesDraft, description: e.target.value })
                        }}
                    />
                    <TextField
                        label="URI"
                        value={seriesDraft?.uri}
                        onChange={(e) => {
                            setSeriesDraft({ ...seriesDraft, uri: e.target.value })
                        }}
                    />
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Typography>Transferable</Typography>
                        <Checkbox
                            checked={seriesDraft?.data?.transferable}
                            onChange={(e) => {
                                setSeriesDraft({
                                    ...seriesDraft,
                                    data: { ...seriesDraft?.data, transferable: e.target.checked }
                                })
                            }}
                        />
                    </Box>
                    <Button
                        disabled={processing}
                        onClick={() => {
                            if (!concord) return
                            setProcessing(true)
                            concord
                                .createBadgeSeries(
                                    seriesDraft?.name || '',
                                    seriesDraft?.description || '',
                                    seriesDraft?.uri || '',
                                    seriesDraft?.data?.transferable || false
                                )
                                .finally(() => {
                                    setProcessing(false)
                                    setCreateSeries(false)
                                })
                        }}
                    >
                        {t('create')}
                    </Button>
                </Box>
            </CCDrawer>
            <CCDrawer
                open={!!mintingSeries}
                onClose={() => {
                    setMintingSeries('')
                }}
            >
                <Box
                    sx={{
                        p: 1,
                        wordBreak: 'break-all',
                        whiteSpace: 'pre-wrap',
                        userSelect: 'text',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}
                >
                    <Typography variant="h3">{t('mintBadge')}</Typography>
                    <Typography>{mintingSeries}</Typography>
                    <TextField
                        label="Receiver"
                        value={receiverDraft}
                        onChange={(e) => {
                            setReceiverDraft(e.target.value)
                        }}
                    />
                    <TextField
                        label="URI"
                        value={mintUriDraft}
                        onChange={(e) => {
                            setMintUriDraft(e.target.value)
                        }}
                    />
                    <Button
                        disabled={processing}
                        onClick={() => {
                            if (!concord) return
                            setProcessing(true)
                            concord.mintBadge(mintingSeries, mintUriDraft, receiverDraft).finally(() => {
                                setProcessing(false)
                                setMintingSeries('')
                            })
                        }}
                    >
                        {t('mint')}
                    </Button>
                </Box>
            </CCDrawer>
        </Box>
    )
}
