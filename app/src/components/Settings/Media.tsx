import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Checkbox,
    Divider,
    FormControlLabel,
    FormGroup,
    IconButton,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePreference } from '../../context/PreferenceContext'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { useTranslation } from 'react-i18next'
import { Codeblock } from '../ui/Codeblock'
import { type s3Config } from '../../model'
import { useClient } from '../../context/ClientContext'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import CodeIcon from '@mui/icons-material/Code'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { useMediaViewer } from '../../context/MediaViewer'

interface File {
    id: string
    url: string
    ownerId: string
    size: number
    cdate: string
}

interface FileResponse {
    content: File[]
    next?: string
    prev?: string
}

export const MediaSettings = (): JSX.Element => {
    const { client } = useClient()
    const [s3Config, setS3Config] = usePreference('s3Config')
    const [storageProvider, setStorageProvider] = usePreference('storageProvider')
    const [imgurClientID, setImgurClientID] = usePreference('imgurClientID')
    const clientIdRef = useRef<HTMLInputElement>(null)
    const mediaViewer = useMediaViewer()

    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const [buttonText, setButtonText] = useState<string>('Save')

    const [_s3Config, _setS3Config] = useState<s3Config>(s3Config)

    const handleS3ConfigChange = (key: string, value: any): void => {
        _setS3Config({ ..._s3Config, [key]: value })
    }

    const domainProfileAvailable = useMemo(() => {
        return 'mediaserver' in client.domainServices || 'world.concrnt.mediaserver' in client.domainServices
    }, [client.domainServices])

    const [deleteMenu, setDeleteMenu] = useState<null | HTMLElement>(null)

    const [itr, setItr] = useState<{ mode: 'before' | 'after'; cursor: string | null }>({
        mode: 'before',
        cursor: null
    })
    const [fileResponse, setFileResponse] = useState<FileResponse | null>(null)

    useEffect(() => {
        if (storageProvider !== 'domain') return
        const url = itr.cursor ? `/storage/files?limit=9&${itr.mode}=${itr.cursor}` : '/storage/files?limit=9'
        client.api.fetchWithCredential<File[]>(client.host, url, {}).then((data) => {
            if (data) setFileResponse(data)
        })
    }, [storageProvider, itr])

    const deleteFile = (id: string): void => {
        client.api
            .fetchWithCredential(client.host, `/storage/file/${id}`, {
                method: 'DELETE'
            })
            .then((_) => {
                setFileResponse({
                    content: fileResponse?.content.filter((e) => e.id !== id) ?? [],
                    next: fileResponse?.next,
                    prev: fileResponse?.prev
                })
            })
    }

    const handleS3ConfigSave = (): void => {
        setS3Config(_s3Config)
        setButtonText('OK!')
        setTimeout(() => {
            setButtonText('Save')
        }, 2000)
    }

    const handleSave = (): void => {
        if (clientIdRef.current) {
            setImgurClientID(clientIdRef.current.value)
            setButtonText('OK!')
            setTimeout(() => {
                setButtonText('Save')
            }, 2000)
        }
    }

    const { t } = useTranslation('', { keyPrefix: 'settings.media' })

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}
        >
            <Typography variant="h3">{t('imagePostSettings')}</Typography>

            <Typography>{t('storageProviderLabel')}</Typography>
            <Select
                value={storageProvider}
                onChange={(v) => {
                    setStorageProvider(v.target.value as 'domain' | 'imgur' | 's3')
                }}
            >
                <MenuItem value="domain" disabled={!domainProfileAvailable}>
                    domain {domainProfileAvailable ? '' : '(not available)'}
                </MenuItem>
                <MenuItem value="imgur">imgur</MenuItem>
                <MenuItem value="s3">s3</MenuItem>
            </Select>

            {storageProvider === 'domain' && (
                <>
                    <Alert severity="info">
                        <AlertTitle>Domain Storage</AlertTitle>
                        {t('descs.domain')}
                    </Alert>
                    <ImageList cols={3} gap={8}>
                        {(fileResponse?.content ?? []).map((file) => (
                            <ImageListItem
                                key={file.id}
                                sx={{ cursor: 'pointer' }}
                                onClick={() => {
                                    mediaViewer.openSingle(file.url)
                                }}
                            >
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: '300px',
                                        backgroundImage: `url(${file.url})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                />
                                <ImageListItemBar
                                    title={file.id}
                                    subtitle={file.cdate}
                                    actionIcon={
                                        <IconButton
                                            sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                            onClick={(e) => {
                                                setSelectedFile(file)
                                                setDeleteMenu(e.currentTarget)
                                                e.stopPropagation()
                                            }}
                                        >
                                            <MoreHorizIcon />
                                        </IconButton>
                                    }
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '1em'
                        }}
                    >
                        <Button
                            onClick={() => {
                                setItr({ mode: 'after', cursor: fileResponse?.prev ?? null })
                            }}
                            disabled={!fileResponse?.prev}
                        >
                            prev
                        </Button>
                        <Button
                            onClick={() => {
                                setItr({ mode: 'before', cursor: fileResponse?.next ?? null })
                            }}
                            disabled={!fileResponse?.next}
                        >
                            next
                        </Button>
                    </Box>
                    <Menu
                        anchorEl={deleteMenu}
                        open={Boolean(deleteMenu)}
                        onClose={() => {
                            setDeleteMenu(null)
                        }}
                    >
                        <MenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(selectedFile?.url || '')
                                setDeleteMenu(null)
                            }}
                        >
                            <ListItemIcon>
                                <ContentPasteIcon />
                            </ListItemIcon>
                            <ListItemText>画像URLをコピー</ListItemText>
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(`![${selectedFile?.id}](${selectedFile?.url})`)
                                setDeleteMenu(null)
                            }}
                        >
                            <ListItemIcon>
                                <CodeIcon />
                            </ListItemIcon>
                            <ListItemText>Markdownコードをコピー</ListItemText>
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                selectedFile && deleteFile(selectedFile.id)
                                setDeleteMenu(null)
                            }}
                        >
                            <ListItemIcon>
                                <DeleteForeverIcon />
                            </ListItemIcon>
                            <ListItemText>{t('deleteCompletely')}</ListItemText>
                        </MenuItem>
                    </Menu>
                </>
            )}

            {storageProvider === 'imgur' && (
                <>
                    <Alert severity="info">
                        <AlertTitle>Imgur</AlertTitle>
                        {t('descs.imgur')}
                    </Alert>

                    <Paper sx={{ padding: '1em', display: 'flex', flexDirection: 'column', gap: '1em' }}>
                        <Typography>
                            {t('afterRegisteringImgur')}
                            <a href={'https://api.imgur.com/oauth2/addclient'}>{t('thisPage')}</a>
                            {t('oauth2')}
                        </Typography>
                        <Box>
                            <TextField
                                label="ClientId"
                                variant="outlined"
                                fullWidth={true}
                                defaultValue={imgurClientID}
                                inputRef={clientIdRef}
                                type="password"
                            />
                        </Box>
                        <Button onClick={handleSave}>{buttonText}</Button>
                    </Paper>
                </>
            )}
            {storageProvider === 's3' && (
                <>
                    <Alert severity="info">
                        <AlertTitle>S3</AlertTitle>
                        {t('descs.s3')}
                    </Alert>

                    <Paper sx={{ padding: '1em', display: 'flex', flexDirection: 'column', gap: '1em' }}>
                        <Typography>{t('corsSettings')}</Typography>
                        <Codeblock language={'json'}>
                            {`[{
    "AllowedOrigins": [
        "*"
    ],
        "AllowedMethods": [
        "GET",
        "POST",
        "PUT",
        "DELETE"
    ],
    "AllowedHeaders": [
        "*"
    ]
}]`}
                        </Codeblock>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
                            <TextField
                                label="endpoint"
                                variant="outlined"
                                fullWidth={true}
                                defaultValue={s3Config.endpoint}
                                onChange={(v) => {
                                    handleS3ConfigChange('endpoint', v.target.value)
                                }}
                                type="text"
                            />
                            <TextField
                                label="accessKeyId"
                                variant="outlined"
                                fullWidth={true}
                                defaultValue={s3Config.accessKeyId}
                                onChange={(v) => {
                                    handleS3ConfigChange('accessKeyId', v.target.value)
                                }}
                                type="text"
                            />
                            <TextField
                                label="secretAccessKey"
                                variant="outlined"
                                fullWidth={true}
                                defaultValue={s3Config.secretAccessKey}
                                onChange={(v) => {
                                    handleS3ConfigChange('secretAccessKey', v.target.value)
                                }}
                                type="password"
                            />
                            <TextField
                                label="bucketName"
                                variant="outlined"
                                fullWidth={true}
                                defaultValue={s3Config.bucketName}
                                onChange={(v) => {
                                    handleS3ConfigChange('bucketName', v.target.value)
                                }}
                                type="text"
                            />
                            <TextField
                                label="publicUrl"
                                variant="outlined"
                                fullWidth={true}
                                defaultValue={s3Config.publicUrl}
                                onChange={(v) => {
                                    handleS3ConfigChange('publicUrl', v.target.value)
                                }}
                                type="text"
                            />
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={_s3Config.forcePathStyle}
                                            onChange={(v) => {
                                                handleS3ConfigChange('forcePathStyle', v.target.checked)
                                            }}
                                        />
                                    }
                                    label="forcePathStyle"
                                />
                            </FormGroup>
                            <Button onClick={handleS3ConfigSave}>{buttonText}</Button>
                        </Box>
                    </Paper>
                </>
            )}
            <Divider />
        </Box>
    )
}
