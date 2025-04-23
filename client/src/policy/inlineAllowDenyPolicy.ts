import { Client } from '../client'
import { Policy } from './main'

export class InlineAllowDenyPolicy implements Policy {
    policy: string
    policyParams?: {
        writeListMode: boolean // false: Denylist, true: Allowlist
        writer: string[]
        readListMode: boolean // false: Denylist, true: Allowlist
        reader: string[]
    }

    constructor(policy: string, policyParamsStr?: string) {
        this.policy = policy
        if (policyParamsStr) {
            try {
                this.policyParams = JSON.parse(policyParamsStr)
            } catch (e) {
                console.error('CLIENT::Timeline::constructor::error', e)
            }
        }
    }

    isRegistered(): boolean {
        return true
    }

    isRequestable(): boolean {
        return true
    }

    getPolicySchemaURL(): string {
        return this.policy
    }

    getPolicyParams(): any {
        return this.policyParams
    }

    isWritePublic(): boolean {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        return this.policyParams.writeListMode
    }

    isWriteable(client: Client): boolean {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        if (!client.ccid) throw new Error('Client ccid is not defined')
        return this.policyParams.writeListMode
            ? this.policyParams.writer.includes(client.ccid)
            : !this.policyParams.writer.includes(client.ccid)
    }

    isReadPublic(): boolean {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        return this.policyParams.readListMode
    }

    isReadable(client: Client): boolean {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        if (!client.ccid) throw new Error('Client ccid is not defined')
        return this.policyParams.readListMode
            ? this.policyParams.reader.includes(client.ccid)
            : !this.policyParams.reader.includes(client.ccid)
    }

    getWriters(): string[] | undefined {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        if (!this.policyParams.writeListMode) {
            return undefined
        }
        return this.policyParams.writer
    }

    getReaders(): string[] | undefined {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        if (!this.policyParams.readListMode) {
            return undefined
        }
        return this.policyParams.reader
    }

    copyWithAddReaders(readers: string[]): Policy {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        if (!this.policyParams.readListMode) {
            throw new Error('Policy is not in read allowlist mode')
        }
        const newReaders = [...new Set([...this.policyParams.reader, ...readers])]
        return new InlineAllowDenyPolicy(this.policy, JSON.stringify({ ...this.policyParams, reader: newReaders }))
    }

    copyWithAddWriters(writers: string[]): Policy {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        if (!this.policyParams.writeListMode) {
            throw new Error('Policy is not in write allowlist mode')
        }
        const newWriters = [...new Set([...this.policyParams.writer, ...writers])]
        return new InlineAllowDenyPolicy(this.policy, JSON.stringify({ ...this.policyParams, writer: newWriters }))
    }

    copyWithNewReaders(readers: string[]): Policy {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        if (!this.policyParams.readListMode) {
            throw new Error('Policy is not in read allowlist mode')
        }
        return new InlineAllowDenyPolicy(this.policy, JSON.stringify({ ...this.policyParams, reader: readers }))
    }

    copyWithNewWriters(writers: string[]): Policy {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        if (!this.policyParams.writeListMode) {
            throw new Error('Policy is not in write allowlist mode')
        }
        return new InlineAllowDenyPolicy(this.policy, JSON.stringify({ ...this.policyParams, writer: writers }))
    }

    copyWithNewReadPublic(readPublic: boolean): Policy {
        return new InlineAllowDenyPolicy(
            this.policy,
            JSON.stringify({ ...this.policyParams, readListMode: !readPublic, reader: [] })
        )
    }

    copyWithNewWritePublic(writePublic: boolean): Policy {
        return new InlineAllowDenyPolicy(
            this.policy,
            JSON.stringify({ ...this.policyParams, writeListMode: !writePublic, writer: [] })
        )
    }
}
