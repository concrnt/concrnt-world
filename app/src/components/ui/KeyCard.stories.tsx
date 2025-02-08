import type { Meta } from '@storybook/react'
import { KeyCard } from './KeyCard'
import { Key } from '@concrnt/client'

interface Props extends Meta {
    id: string
    root: string
    parent: string
    revoked: boolean
    selected: boolean
    subText: string
}

export const Default = (props: Props): JSX.Element => {
    const keyBase: Omit<Key, 'parsedEnactDoc' | 'parsedRevokeDoc'> = {
        id: props.id,
        root: props.root,
        parent: props.parent,
        enactDocument: 'null',
        enactSignature: 'null',
        revokeDocument: props.revoked ? 'xxx' : undefined,
        revokeSignature: props.revoked ? 'xxx' : undefined,
        validSince: 'null',
        validUntil: 'null'
    }

    const key = Object.setPrototypeOf(keyBase, Key.prototype)

    return <KeyCard item={key} selected={props.selected} subText={props.subText} />
}

export default {
    title: 'ui/KeyCard',
    component: Default,
    tags: [],
    argTypes: {
        id: {
            control: {
                type: 'text'
            }
        },
        root: {
            control: {
                type: 'text'
            }
        },
        parent: {
            control: {
                type: 'text'
            }
        },
        revoked: {
            control: {
                type: 'boolean'
            }
        },
        selected: {
            control: {
                type: 'boolean'
            }
        },
        subText: {
            control: {
                type: 'text'
            }
        }
    },
    args: {
        id: 'cck1x9ee0xf4s7qrjze4n85malrdkreqtujfzq8jqv',
        root: 'con1t0tey8uxhkqkd4wcp4hd4jedt7f0vfhk29xdd2',
        parent: 'con1t0tey8uxhkqkd4wcp4hd4jedt7f0vfhk29xdd2',
        revoked: false,
        selected: false,
        subText: 'subText1'
    },
    parameters: {}
}
