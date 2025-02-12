import { InputBase, Paper } from '@mui/material'
import { useState } from 'react'
import { CCIconButton } from './CCIconButton'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'

export interface SearchBoxProps {
    onEnter: (query: string) => void
    updateFocused?: (focused: boolean) => void
    disabled?: boolean
    placeholder?: string
    onClear?: () => void
}

export const SearchBox = (props: SearchBoxProps): JSX.Element => {
    const [query, setQuery] = useState<string>('')

    return (
        <Paper
            component="form"
            sx={{
                p: '2px 4px',
                display: 'flex',
                alignItems: 'center'
            }}
            onSubmit={(e) => {
                props.onEnter(query)
                e.preventDefault()
            }}
            onFocus={() => {
                props.updateFocused?.(true)
            }}
            onBlur={() => {
                props.updateFocused?.(false)
            }}
        >
            <InputBase
                disabled={props.disabled}
                sx={{ ml: 1, flex: 1 }}
                placeholder={props.placeholder}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value)
                }}
                endAdornment={
                    query && (
                        <CCIconButton
                            sx={{ width: '8px', height: '8px', p: '10px' }}
                            onClick={() => {
                                setQuery('')
                                props.onClear?.()
                            }}
                        >
                            <ClearIcon />
                        </CCIconButton>
                    )
                }
            />
            <CCIconButton
                disabled={props.disabled}
                sx={{ p: '10px' }}
                onClick={() => {
                    props.onEnter(query)
                }}
            >
                <SearchIcon />
            </CCIconButton>
        </Paper>
    )
}
