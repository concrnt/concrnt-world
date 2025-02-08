import { Chip, alpha, useTheme } from '@mui/material'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import { useSnackbar } from 'notistack'

export const CopyChip = (props: { label: string; content?: string; limit?: number }): JSX.Element => {
    const theme = useTheme()
    const { enqueueSnackbar } = useSnackbar()

    const safecontent = props.content || ''

    const limit = props.limit || Infinity
    const length = safecontent.length
    const content =
        length > limit ? `${safecontent.slice(0, limit / 2)}...${safecontent.slice(length - limit / 2)}` : props.content

    const label = `${props.label}: ${content}`

    return (
        <Chip
            sx={{
                cursor: 'pointer',
                backgroundColor: alpha(theme.palette.text.primary, 0.1)
            }}
            size="small"
            label={label}
            deleteIcon={<ContentPasteIcon />}
            onDelete={() => {
                navigator.clipboard.writeText(safecontent)
                enqueueSnackbar('Copied', { variant: 'info' })
            }}
        />
    )
}
