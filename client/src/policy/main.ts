import { Client } from '../client'
import { InlineAllowDenyPolicy } from './inlineAllowDenyPolicy'
import { InlineReadWritePolicy } from './inlineReadWritePolicy'
import { RestrictAckeesPolicy } from './restrictAckees'

export interface Policy {
    isRegistered(): boolean
    getPolicySchemaURL(): string
    getPolicyParams(): any

    isWriteable(client: Client): boolean
    isReadable(client: Client): boolean
    isWritePublic(): boolean
    isReadPublic(): boolean

    isRequestable(): boolean

    copyWithAddReaders(readers: string[]): Policy
    copyWithAddWriters(writers: string[]): Policy
    copyWithNewReaders(readers: string[]): Policy
    copyWithNewWriters(writers: string[]): Policy
    copyWithNewReadPublic(readPublic: boolean): Policy
    copyWithNewWritePublic(writePublic: boolean): Policy

    getWriters(): string[] | undefined
    getReaders(): string[] | undefined
}

export const loadPolicy = (policy?: string, policyParamsStr?: string, resource?: any): Policy => {
    if (!policy) {
        return new DefaultPolicy()
    }
    switch (policy) {
        case 'https://policy.concrnt.world/t/inline-read-write.json':
            return new InlineReadWritePolicy(policy, policyParamsStr)
        case 'https://policy.concrnt.world/t/inline-allow-deny.json':
            return new InlineAllowDenyPolicy(policy, policyParamsStr)
        case 'https://policy.concrnt.world/t/restrict-ackees.json':
            return new RestrictAckeesPolicy(policy, policyParamsStr, resource)
        default:
            return new UnknownPolicy(policy, policyParamsStr)
    }
}

export class UnknownPolicy implements Policy {
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

    getPolicySchemaURL(): string {
        return this.policy
    }

    getPolicyParams(): any {
        return this.policyParams
    }

    isRegistered(): boolean {
        return false
    }

    isWriteable(): boolean {
        return true
    }

    isWritePublic(): boolean {
        return true
    }

    isReadable(): boolean {
        return true
    }

    isReadPublic(): boolean {
        return true
    }

    isRequestable(): boolean {
        return false
    }

    getWriters(): string[] | undefined {
        return undefined
    }

    getReaders(): string[] | undefined {
        return undefined
    }

    copyWithAddReaders(_readers: string[]): Policy {
        throw new Error(`copyWithAddReaders not supported for ${this.policy}`)
    }

    copyWithAddWriters(_writers: string[]): Policy {
        throw new Error(`copyWithAddWriters not supported for ${this.policy}`)
    }

    copyWithNewReaders(_readers: string[]): Policy {
        throw new Error(`getParamsWithNewReaders not supported for ${this.policy}`)
    }

    copyWithNewWriters(_writers: string[]): Policy {
        throw new Error(`setParamsWithNewWriters not supported for ${this.policy}`)
    }

    copyWithNewReadPublic(_readPublic: boolean): Policy {
        throw new Error(`getParamsWithNewReadPublic not supported for ${this.policy}`)
    }

    copyWithNewWritePublic(_writePublic: boolean): Policy {
        throw new Error(`getParamsWithNewWritePublic not supported for ${this.policy}`)
    }
}

export class DefaultPolicy implements Policy {
    getPolicySchemaURL(): string {
        return ''
    }

    getPolicyParams(): any {
        return {}
    }

    isRegistered(): boolean {
        return true
    }

    isWritePublic(): boolean {
        return true
    }

    isWriteable(): boolean {
        return true
    }

    isReadPublic(): boolean {
        return true
    }

    isRequestable(): boolean {
        return true
    }

    isReadable(): boolean {
        return true
    }

    getWriters(): string[] | undefined {
        return undefined
    }

    getReaders(): string[] | undefined {
        return undefined
    }

    copyWithAddReaders(_readers: string[]): Policy {
        throw new Error('Default policy does not support this')
    }

    copyWithAddWriters(_writers: string[]): Policy {
        throw new Error('Default policy does not support this')
    }

    copyWithNewReaders(_readers: string[]): Policy {
        throw new Error('Default policy does not support this')
    }

    copyWithNewWriters(_writers: string[]): Policy {
        throw new Error('Default policy does not support this')
    }

    copyWithNewReadPublic(_readPublic: boolean): Policy {
        throw new Error('Default policy does not support this')
    }

    copyWithNewWritePublic(_writePublic: boolean): Policy {
        throw new Error('Default policy does not support this')
    }
}
