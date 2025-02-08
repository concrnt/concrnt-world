import { TextField, type SxProps } from '@mui/material'

export interface CCTextFieldProps {
    label?: string
    fullWidth?: boolean
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
    value?: string
    placeholder?: string
    sx?: SxProps
}

export const CCTextField = (props: CCTextFieldProps): JSX.Element => {
    return (
        <TextField
            label={props.label}
            fullWidth={props.fullWidth}
            onChange={props.onChange}
            value={props.value}
            placeholder={props.placeholder}
            sx={{
                '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                        borderColor: 'text.disabled'
                    },
                    '&:hover fieldset': {
                        borderColor: 'text.primary'
                    }
                }
            }}
        />
    )
}
