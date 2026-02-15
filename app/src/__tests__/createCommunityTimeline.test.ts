import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCommunityTimelineAndAddToLibrary } from '../utils/createCommunityTimeline'
import { type CommunityTimelineSchema } from '@concrnt/worldlib'

describe('createCommunityTimelineAndAddToLibrary', () => {
    const timelineBody = { name: 'sample' } as unknown as CommunityTimelineSchema

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('calls upsert and navigation hook when timeline is created', async () => {
        const createCommunityTimeline = vi.fn().mockResolvedValue({ id: 'timeline:example' })
        const upsertTimeline = vi.fn()
        const onCreated = vi.fn()
        const onFailed = vi.fn()

        await createCommunityTimelineAndAddToLibrary({
            body: timelineBody,
            createCommunityTimeline,
            upsertTimeline,
            onCreated,
            onFailed
        })

        expect(createCommunityTimeline).toHaveBeenCalledWith(timelineBody)
        expect(upsertTimeline).toHaveBeenCalledWith('timeline:example')
        expect(onCreated).toHaveBeenCalledWith('timeline:example')
        expect(onFailed).not.toHaveBeenCalled()
    })

    it('navigates even if library upsert is unavailable', async () => {
        const createCommunityTimeline = vi.fn().mockResolvedValue({ id: 'timeline:example' })
        const onCreated = vi.fn()
        const onFailed = vi.fn()

        await createCommunityTimelineAndAddToLibrary({
            body: timelineBody,
            createCommunityTimeline,
            onCreated,
            onFailed
        })

        expect(onCreated).toHaveBeenCalledWith('timeline:example')
        expect(onFailed).not.toHaveBeenCalled()
    })

    it('reports failure and does not navigate when created timeline has no id', async () => {
        const createCommunityTimeline = vi.fn().mockResolvedValue({})
        const upsertTimeline = vi.fn()
        const onCreated = vi.fn()
        const onFailed = vi.fn()

        await createCommunityTimelineAndAddToLibrary({
            body: timelineBody,
            createCommunityTimeline,
            upsertTimeline,
            onCreated,
            onFailed
        })

        expect(upsertTimeline).not.toHaveBeenCalled()
        expect(onCreated).not.toHaveBeenCalled()
        expect(onFailed).toHaveBeenCalledTimes(1)
    })

    it('reports failure when create API throws', async () => {
        const createCommunityTimeline = vi.fn().mockRejectedValue(new Error('network failed'))
        const upsertTimeline = vi.fn()
        const onCreated = vi.fn()
        const onFailed = vi.fn()

        await createCommunityTimelineAndAddToLibrary({
            body: timelineBody,
            createCommunityTimeline,
            upsertTimeline,
            onCreated,
            onFailed
        })

        expect(upsertTimeline).not.toHaveBeenCalled()
        expect(onCreated).not.toHaveBeenCalled()
        expect(onFailed).toHaveBeenCalledTimes(1)
    })
})

