import { Client } from '../client'
import { Policy } from './main'

export class InlineReadWritePolicy implements Policy {
    policy: string
    policyParams?: any

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

    isRequestable(): boolean {
        return true
    }

    isRegistered(): boolean {
        return true
    }

    getPolicySchemaURL(): string {
        return this.policy
    }

    getPolicyParams(): any {
        return this.policyParams
    }

    isWritePublic(): boolean {
        return this.policyParams.isWritePublic
    }

    isWriteable(client: Client): boolean {
        return this.policyParams.isWritePublic ? true : this.policyParams.writer?.includes(client.ccid ?? '')
    }

    isReadPublic(): boolean {
        return this.policyParams.isReadPublic
    }

    isReadable(client: Client): boolean {
        return this.policyParams.isReadPublic ? true : this.policyParams.reader?.includes(client.ccid ?? '')
    }

    getWriters(): string[] | undefined {
        if (this.policyParams.isWritePublic) {
            return undefined
        }
        return this.policyParams.writer
    }

    getReaders(): string[] | undefined {
        if (this.policyParams.isReadPublic) {
            return undefined
        }
        return this.policyParams.reader
    }

    copyWithAddReaders(readers: string[]): Policy {
        const newReaders = [...new Set([...this.policyParams.reader, ...readers])]
        return new InlineReadWritePolicy(this.policy, JSON.stringify({ ...this.policyParams, reader: newReaders }))
    }

    copyWithAddWriters(writers: string[]): Policy {
        const newWriters = [...new Set([...this.policyParams.writer, ...writers])]
        return new InlineReadWritePolicy(this.policy, JSON.stringify({ ...this.policyParams, writer: newWriters }))
    }

    copyWithNewReaders(readers: string[]): Policy {
        return new InlineReadWritePolicy(this.policy, JSON.stringify({ ...this.policyParams, reader: readers }))
    }

    copyWithNewWriters(writers: string[]): Policy {
        return new InlineReadWritePolicy(this.policy, JSON.stringify({ ...this.policyParams, writer: writers }))
    }

    copyWithNewReadPublic(readPublic: boolean): Policy {
        return new InlineReadWritePolicy(
            this.policy,
            JSON.stringify({ ...this.policyParams, isReadPublic: readPublic })
        )
    }

    copyWithNewWritePublic(writePublic: boolean): Policy {
        return new InlineReadWritePolicy(
            this.policy,
            JSON.stringify({ ...this.policyParams, isWritePublic: writePublic })
        )
    }
}
