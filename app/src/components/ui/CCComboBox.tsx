import { TextField, type SxProps, Autocomplete } from '@mui/material'
import { useMemo, useState } from 'react'

export interface CCComboBoxProps {
    sx?: SxProps
    options: Record<string, string>
    value: string
    onChange: (value: string) => void
    label: string
    error?: boolean
    helperText?: string
}

export const CCComboBox = (props: CCComboBoxProps): JSX.Element => {
    const [inputValue, setInputValue] = useState(
        Object.keys(props.options)[Object.values(props.options).indexOf(props.value)] || props.value
    )

    const keys = useMemo(() => Object.keys(props.options), [props.options])

    return (
        <Autocomplete
            fullWidth
            freeSolo
            placeholder={'Select or Input'}
            sx={props.sx}
            value={props.value}
            inputValue={inputValue}
            onInputChange={(_, value) => {
                setInputValue(keys[Object.values(props.options).indexOf(value)] || value)
                props.onChange(props.options[value] || value)
            }}
            options={
                keys.includes(inputValue.toLowerCase())
                    ? keys
                    : keys.filter((option) => {
                          return option.toLowerCase().includes(inputValue.toLowerCase())
                      })
            }
            filterOptions={(options, _) => {
                return options
            }}
            renderInput={(params) => (
                <TextField {...params} label={props.label} error={props.error} helperText={props.helperText} />
            )}
        />
    )
}
