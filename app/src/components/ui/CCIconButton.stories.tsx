import type { Meta } from '@storybook/react'
import { CCIconButton } from './CCIconButton'

import CottageIcon from '@mui/icons-material/Cottage'

interface Props extends Meta {}

export const Default = (_: Props): JSX.Element => {
    return (
        <>
            <CCIconButton>
                <CottageIcon />
            </CCIconButton>
            <CCIconButton disabled={true}>
                <CottageIcon />
            </CCIconButton>
        </>
    )
}

export default {
    title: 'ui/CCIconButton',
    component: Default,
    tags: [],
    argTypes: {},
    args: {},
    parameters: {}
}
