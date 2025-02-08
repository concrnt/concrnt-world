import type { Meta } from '@storybook/react'
import { CCChip } from './CCChip'

interface Props extends Meta {
    label: string
}

export const Default = (props: Props): JSX.Element => {
    return (
        <>
            <CCChip label={props.label} />
            <CCChip
                label={props.label}
                onDelete={() => {
                    console.log('delete')
                }}
            />
        </>
    )
}

export default {
    title: 'ui/CCChip',
    component: Default,
    tags: [],
    argTypes: {
        label: {
            control: {
                type: 'text'
            }
        }
    },
    args: {
        label: 'some text'
    },
    parameters: {}
}
