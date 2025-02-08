import { Box, Divider, Typography } from '@mui/material'
import { memo, useEffect, useState } from 'react'
import { fetchWithTimeout } from '../../util'
import { CCEditor, type CCEditorError } from './cceditor'

export interface PolicyEditorProps {
    policyURL?: string
    policy?: any
    disabled?: boolean
    value?: string
    setValue: (value?: string) => void
    setErrors?: (_: CCEditorError[] | undefined) => void
}

interface Policy {
    name: string
    version: string
    statements: any[]
    paramSchema: any
}

export const PolicyEditor = memo<PolicyEditorProps>((props: PolicyEditorProps): JSX.Element => {
    const [policy, setPolicy] = useState<Policy>(props.policy)

    const schema = policy?.paramSchema

    useEffect(() => {
        if (props.policy || !props.policyURL) return
        fetchWithTimeout(props.policyURL, { method: 'GET' })
            .then((e) => e.json())
            .then((e) => {
                if (e.versions) {
                    if (e.versions['2024-07-01']) {
                        setPolicy(e.versions['2024-07-01'])
                    }
                }

                if (e.version) {
                    setPolicy(e)
                }
            })
    }, [props.policyURL])

    if (!props.policyURL && !props.policy) {
        return <Box>Bad Input</Box>
    }

    let value = {}
    try {
        if (props.value) {
            value = JSON.parse(props.value)
        }
    } catch (_) {}

    return (
        <Box>
            {policy && (
                <>
                    <Typography variant="h3">{policy.name}</Typography>
                    <Divider />
                    <CCEditor
                        schema={schema}
                        value={value}
                        setValue={(value) => {
                            if (!value) props.setValue(undefined)
                            else props.setValue(JSON.stringify(value))
                        }}
                        setErrors={props.setErrors}
                    />
                </>
            )}
        </Box>
    )
})

PolicyEditor.displayName = 'PolicyEditor'
