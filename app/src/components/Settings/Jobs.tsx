import { useEffect, useState } from 'react'
import { useClient } from '../../context/ClientContext'
import { useTranslation } from 'react-i18next'
import { type Job, type JobRequest } from '../../model'
import {
    Box,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'

import RefreshIcon from '@mui/icons-material/Refresh'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

import ScheduleIcon from '@mui/icons-material/Schedule'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import ClearIcon from '@mui/icons-material/Clear'
import { Codeblock } from '../ui/Codeblock'
import { usePreference } from '../../context/PreferenceContext'
import { humanReadableTimeDiff } from '../../util'

const statusIcons: Record<string, JSX.Element> = {
    pending: <ScheduleIcon />,
    running: <PlayCircleOutlineIcon />,
    completed: <CheckCircleOutlineIcon />,
    failed: <ErrorOutlineIcon />,
    canceled: <ClearIcon />
}

interface ListItemJobProps {
    job: Job
    onSelected?: () => void
    secondaryAction?: JSX.Element
}

function ListItemJob({ job, secondaryAction, onSelected }: ListItemJobProps): JSX.Element {
    return (
        <ListItem disablePadding secondaryAction={secondaryAction}>
            <ListItemButton
                dense
                onClick={() => {
                    onSelected?.()
                }}
            >
                <Tooltip arrow title={job.status} placement="top">
                    <ListItemIcon>{statusIcons[job.status]}</ListItemIcon>
                </Tooltip>
                <ListItemText primary={job.type} secondary={humanReadableTimeDiff(new Date(job.scheduled))} />
            </ListItemButton>
        </ListItem>
    )
}

export function Jobs(): JSX.Element {
    const { client } = useClient()
    const { t } = useTranslation('', { keyPrefix: 'settings.jobs' })
    const [selected, setSelected] = useState<Job | null>(null)
    const [menuSelected, setMenuSelected] = useState<Job | null>(null)
    const [jobs, setJobs] = useState<Job[]>([])
    const [isDevMode] = usePreference('devMode')

    const pending = jobs.filter((job) => job.status === 'pending')
    const running = jobs.filter((job) => job.status === 'running')
    const completedOrFailed = jobs.filter(
        (job) => job.status === 'completed' || job.status === 'failed' || job.status === 'canceled'
    )

    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)

    const [jobType, setJobType] = useState<string>('hello')
    const [jobPayload, setJobPayload] = useState<string>('{}')
    const [jobScheduled, setJobScheduled] = useState<number>(1)

    const loadJobs = async (): Promise<void> => {
        client?.api
            .fetchWithCredential<Job[]>(client.host, '/api/v1/jobs', {
                method: 'GET'
            })
            .then(async (data) => {
                setJobs(data.content ?? [])
            })
    }

    useEffect(() => {
        loadJobs()
    }, [])

    return (
        <>
            <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h4">ジョブ一覧</Typography>
                <IconButton
                    onClick={() => {
                        loadJobs()
                    }}
                >
                    <RefreshIcon />
                </IconButton>
            </Box>

            <Typography variant="h5">実行待ち</Typography>
            <List>
                {pending.map((job) => {
                    return (
                        <ListItemJob
                            key={job.id}
                            job={job}
                            onSelected={() => {
                                setSelected(job)
                            }}
                            secondaryAction={
                                <IconButton
                                    onClick={(e) => {
                                        setMenuAnchorEl(e.currentTarget)
                                        setMenuSelected(job)
                                    }}
                                >
                                    <MoreHorizIcon />
                                </IconButton>
                            }
                        />
                    )
                })}
            </List>

            <Typography variant="h5">実行中</Typography>
            <List>
                {running.map((job) => {
                    return (
                        <ListItemJob
                            key={job.id}
                            job={job}
                            onSelected={() => {
                                setSelected(job)
                            }}
                        />
                    )
                })}
            </List>

            <Typography variant="h5">終了済み</Typography>
            <List>
                {completedOrFailed.map((job) => {
                    return (
                        <ListItemJob
                            key={job.id}
                            job={job}
                            onSelected={() => {
                                setSelected(job)
                            }}
                        />
                    )
                })}
            </List>

            {selected && (
                <>
                    <Typography variant="h5">ジョブ詳細</Typography>
                    <Codeblock language="json">{JSON.stringify(selected, null, 2)}</Codeblock>
                </>
            )}

            {isDevMode && (
                <>
                    <TextField
                        label="Type"
                        value={jobType}
                        onChange={(e) => {
                            setJobType(e.target.value)
                        }}
                    />

                    <TextField
                        label="Payload"
                        value={jobPayload}
                        onChange={(e) => {
                            setJobPayload(e.target.value)
                        }}
                    />

                    <TextField
                        type="number"
                        label="Scheduled in minutes"
                        value={jobScheduled}
                        onChange={(e) => {
                            setJobScheduled(parseInt(e.target.value))
                        }}
                    />

                    <Button
                        onClick={() => {
                            const job: JobRequest = {
                                type: jobType,
                                payload: jobPayload,
                                scheduled: new Date(Date.now() + jobScheduled * 60 * 1000).toISOString()
                            }

                            client?.api
                                .fetchWithCredential(client.host, '/api/v1/jobs', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(job)
                                })
                                .then(async (res) => {
                                    loadJobs()
                                })
                        }}
                    >
                        ジョブ作成(dev)
                    </Button>
                </>
            )}

            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={() => {
                    setMenuAnchorEl(null)
                }}
            >
                <MenuItem
                    onClick={() => {
                        if (!menuSelected) return
                        client?.api
                            .fetchWithCredential(client.host, `/api/v1/job/${menuSelected?.id}`, {
                                method: 'DELETE'
                            })
                            .then(async (res) => {
                                loadJobs()
                            })
                        setMenuAnchorEl(null)
                        setMenuSelected(null)
                    }}
                >
                    キャンセル
                </MenuItem>
            </Menu>
        </>
    )
}
