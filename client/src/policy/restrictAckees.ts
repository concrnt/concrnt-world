import { Client } from '../client'
import { Policy } from './main'

export class RestrictAckeesPolicy implements Policy {
    policy: string
    policyParams?: {
        restrictWriters: boolean
        restrictReaders: boolean
    }
    resource: any

    constructor(policy: string, policyParamsStr?: string, resource?: any) {
        this.policy = policy
        if (policyParamsStr) {
            try {
                this.policyParams = JSON.parse(policyParamsStr)
            } catch (e) {
                console.error('CLIENT::Timeline::constructor::error', e)
            }
        }
        this.resource = resource
    }

    isRegistered(): boolean {
        return true
    }

    isRequestable(): boolean {
        return false
    }

    getPolicySchemaURL(): string {
        return this.policy
    }

    getPolicyParams(): any {
        return this.policyParams
    }

    isWritePublic(): boolean {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        return !this.policyParams.restrictWriters
    }

    isWriteable(client: Client): boolean {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        if (!this.policyParams.restrictWriters) return true
        if (this.resource?.author === client.ccid) return true

        return client.ackers.some((acker) => acker.ccid === client.ccid)
    }

    isReadPublic(): boolean {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        return !this.policyParams.restrictReaders
    }

    isReadable(client: Client): boolean {
        if (!this.policyParams) throw new Error('Policy params are not defined')
        if (!this.policyParams.restrictReaders) return true
        if (this.resource?.author === client.ccid) return true

        return client.ackers.some((acker) => acker.ccid === client.ccid)
    }

    getWriters(): string[] | undefined {
        return []
    }

    getReaders(): string[] | undefined {
        return []
    }

    copyWithAddReaders(_readers: string[]): Policy {
        throw new Error('copyWithAddReaders is not supported for RestrictAckeesPolicy')
    }

    copyWithAddWriters(_writers: string[]): Policy {
        throw new Error('copyWithAddWriters is not supported for RestrictAckeesPolicy')
    }

    copyWithNewReaders(_readers: string[]): Policy {
        throw new Error('copyWithNewReaders is not supported for RestrictAckeesPolicy')
    }

    copyWithNewWriters(_writers: string[]): Policy {
        throw new Error('copyWithNewWriters is not supported for RestrictAckeesPolicy')
    }

    copyWithNewReadPublic(_readPublic: boolean): Policy {
        throw new Error('copyWithNewReadPublic is not supported for RestrictAckeesPolicy')
    }

    copyWithNewWritePublic(_writePublic: boolean): Policy {
        throw new Error('copyWithNewWritePublic is not supported for RestrictAckeesPolicy')
    }
}
