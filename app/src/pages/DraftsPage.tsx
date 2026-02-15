import { useMemo, useState } from 'react'
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import PushPinIcon from '@mui/icons-material/PushPin'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import ScheduleIcon from '@mui/icons-material/Schedule'
import { useTranslation } from 'react-i18next'

import { useDraftContext, type DraftEntry } from '../context/DraftContext'
import { useEditorModal } from '../components/EditorModal'
import { usePersistent } from '../hooks/usePersistent'
import { LS_PREFIX } from '../appConfig'

const sortEntries = (entries: DraftEntry[]): DraftEntry[] => {
    return [...entries].sort((a, b) => {
        if ((a.pinned ?? false) !== (b.pinned ?? false)) {
            return b.pinned ? 1 : -1
        }
        return b.updatedAt - a.updatedAt
    })
}

const toLocalDatetimeString = (date: Date): string => {
    const pad = (n: number): string => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const DraftPreview = ({ draftKey }: { draftKey: string }): JSX.Element => {
    const prefix = draftKey ? `${LS_PREFIX}${draftKey}:` : LS_PREFIX
    const [draft] = usePersistent<string>(prefix + 'draft', '')

    return (
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', maxHeight: '3em', overflow: 'hidden' }}>
            {draft || '(empty)'}
        </Typography>
    )
}

export const DraftsPage = (): JSX.Element => {
    const { entries, removeDraft, togglePinDraft, scheduleDraft, updateDraft } = useDraftContext()
    const editorModal = useEditorModal()
    const { t } = useTranslation('', { keyPrefix: 'pages.drafts' })

    const sorted = useMemo(() => sortEntries(entries), [entries])

    const [scheduleTarget, setScheduleTarget] = useState<string | null>(null)
    const [scheduleDate, setScheduleDate] = useState('')

    const openScheduleDialog = (entryId: string): void => {
        const defaultDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
        setScheduleDate(toLocalDatetimeString(defaultDate))
        setScheduleTarget(entryId)
    }

    const confirmSchedule = (): void => {
        if (!scheduleTarget || !scheduleDate) return
        const timestamp = new Date(scheduleDate).getTime()
        if (isNaN(timestamp) || timestamp <= Date.now()) return
        scheduleDraft(scheduleTarget, timestamp)
        setScheduleTarget(null)
    }

    return (
        <Box
            sx={{
                height: '100%',
                overflow: 'hidden',
                backgroundColor: 'background.paper',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                <Typography variant="h5" sx={{ flex: 1 }}>
                    {t('title')}
                </Typography>
            </Box>
            <Box sx={{ overflowY: 'auto', flex: 1, p: 1 }}>
                {sorted.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                        {t('noDrafts')}
                    </Paper>
                ) : (
                    sorted.map((entry) => (
                        <Paper key={entry.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                            <Stack direction="row" alignItems="flex-start" spacing={1}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography fontWeight="bold" variant="subtitle2">
                                        {entry.title || entry.key}
                                    </Typography>
                                    <DraftPreview draftKey={entry.key} />
                                    <Stack direction="row" spacing={1} mt={0.5} alignItems="center">
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(entry.updatedAt).toLocaleString()}
                                        </Typography>
                                        {entry.scheduledAt && (
                                            <Chip
                                                icon={<ScheduleIcon />}
                                                size="small"
                                                label={`${t('scheduledFor')} ${new Date(entry.scheduledAt).toLocaleString()}`}
                                                color={(entry.retryCount ?? 0) > 0 ? 'warning' : 'info'}
                                                variant="outlined"
                                            />
                                        )}
                                        {(entry.retryCount ?? 0) > 0 && entry.scheduledAt && (
                                            <Chip
                                                size="small"
                                                label={`retry ${entry.retryCount}/3`}
                                                color="warning"
                                                variant="outlined"
                                            />
                                        )}
                                        {entry.lastError && !entry.scheduledAt && (
                                            <Chip
                                                icon={<ErrorOutlineIcon />}
                                                size="small"
                                                label={t('failed')}
                                                color="error"
                                                variant="outlined"
                                                onDelete={() => updateDraft(entry.id, { lastError: undefined, retryCount: undefined })}
                                            />
                                        )}
                                    </Stack>
                                </Box>
                                <Stack direction="row" spacing={0.5}>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            const prefix = entry.key ? `${LS_PREFIX}${entry.key}:` : LS_PREFIX
                                            const raw = localStorage.getItem(prefix + 'draft')
                                            let text = ''
                                            if (raw) {
                                                try { text = JSON.parse(raw) } catch { text = raw }
                                            }
                                            editorModal.open({ draft: text, draftKey: entry.key })
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => togglePinDraft(entry.id)}>
                                        {entry.pinned ? <PushPinIcon fontSize="small" color="primary" /> : <PushPinOutlinedIcon fontSize="small" />}
                                    </IconButton>
                                    {entry.scheduledAt ? (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => scheduleDraft(entry.id, undefined)}
                                        >
                                            {t('cancel')}
                                        </Button>
                                    ) : (
                                        <IconButton size="small" onClick={() => openScheduleDialog(entry.id)}>
                                            <ScheduleIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    <IconButton size="small" color="error" onClick={() => removeDraft(entry.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Stack>
                        </Paper>
                    ))
                )}
            </Box>

            <Dialog open={scheduleTarget !== null} onClose={() => setScheduleTarget(null)}>
                <DialogTitle>{t('schedule')}</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {t('scheduleWarning')}
                    </Alert>
                    <TextField
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setScheduleTarget(null)}>{t('cancel')}</Button>
                    <Button variant="contained" onClick={confirmSchedule}>{t('schedule')}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
