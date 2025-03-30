import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Checkbox,
    Divider,
    FormControlLabel,
    FormGroup,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography
} from '@mui/material'
import { useMemo, useRef, useState } from 'react'
import { usePreference } from '../../context/PreferenceContext'
import { useTranslation } from 'react-i18next'
import { Codeblock } from '../ui/Codeblock'
import { type s3Config } from '../../model'
import { useClient } from '../../context/ClientContext'
import { MediaServerInventory } from './MediaServerInventory'

export const MediaSettings = (): JSX.Element => {
    const { client } = useClient()
    const [s3Config, setS3Config] = usePreference('s3Config')
    const [storageProvider, setStorageProvider] = usePreference('storageProvider')
    const [imgurClientID, setImgurClientID] = usePreference('imgurClientID')
    const clientIdRef = useRef<HTMLInputElement>(null)

    const [buttonText, setButtonText] = useState<string>('Save')

    const [_s3Config, _setS3Config] = useState<s3Config>(s3Config)

    const handleS3ConfigChange = (key: string, value: any): void => {
        _setS3Config({ ..._s3Config, [key]: value })
    }

    const domainProfileAvailable = useMemo(() => {
        return 'mediaserver' in client.domainServices || 'world.concrnt.mediaserver' in client.domainServices
    }, [client.domainServices])

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
                    <MediaServerInventory />
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
