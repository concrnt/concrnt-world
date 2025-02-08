import type { Meta } from '@storybook/react'
import { Box, Typography } from '@mui/material'
import { CCComboBox } from './CCComboBox'
import { useEffect, useState } from 'react'

interface Props extends Meta {
    defaultValue?: string
}

export const Default = (props: Props): JSX.Element => {
    const [value, setValue] = useState<string>('')

    const options = {
        option1: 'value1',
        option2: 'value2',
        option3: 'value3'
    }

    useEffect(() => {
        setValue(props.defaultValue ?? '')
    }, [props.defaultValue])

    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <CCComboBox
                value={value}
                onChange={(newValue) => {
                    setValue(newValue)
                }}
                options={options}
                label="Select an option"
            />
            <Typography>{value}</Typography>
        </Box>
    )
}

export default {
    title: 'ui/CCComboBox',
    component: Default,
    tags: [],
    argTypes: {},
    args: {},
    parameters: {}
}
