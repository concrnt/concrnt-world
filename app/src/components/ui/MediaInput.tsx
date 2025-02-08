import { Box, Button, TextField } from '@mui/material'
import { useRef, useState } from 'react'
import { useSnackbar } from 'notistack'
import { useStorage } from '../../context/StorageContext'

interface MediaInputProps {
    value: string
    label?: string
    onChange: (value: string) => void
}

export function MediaInput(props: MediaInputProps): JSX.Element {
    const storage = useStorage()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const { enqueueSnackbar } = useSnackbar()

    const uploadImage = async (imageFile: File): Promise<void> => {
        const isImage = imageFile.type.includes('image')
        if (isImage) {
            setUploading(true)
            const result = await storage.uploadFile(imageFile).finally(() => {
                setUploading(false)
            })
            if (!result) {
                enqueueSnackbar('Failed to upload image', { variant: 'error' })
            } else {
                props.onChange(result)
            }
        }
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                width: '100%'
            }}
        >
            <TextField
                sx={{
                    display: 'flex',
                    flexGrow: 1
                }}
                value={props.value}
                onChange={(event) => {
                    props.onChange(event.target.value)
                }}
                label={props.label}
                variant="outlined"
            />
            {storage?.isUploadReady && (
                <Button
                    sx={{
                        display: 'flex',
                        height: '100%'
                    }}
                    color="primary"
                    disabled={uploading}
                    onClick={() => {
                        if (fileInputRef.current) {
                            fileInputRef.current.click()
                        }
                    }}
                >
                    {uploading ? 'Uploading...' : 'Upload'}
                    <input
                        hidden
                        type="file"
                        ref={fileInputRef}
                        onChange={(event) => {
                            if (event.target.files) {
                                uploadImage(event.target.files[0])
                            }
                        }}
                    />
                </Button>
            )}
        </Box>
    )
}
