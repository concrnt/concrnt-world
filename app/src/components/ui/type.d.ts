import { Handler } from 'mdast-util-to-hast'

declare module 'mdast-util-to-hast' {
    type Options = {
        handlers?: Record<string, Handler>
    }
}
