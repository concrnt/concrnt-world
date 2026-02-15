import { type CommunityTimelineSchema } from '@concrnt/worldlib'

type UpsertTimeline = (timelineId: string) => void

type CreateCommunityTimelineResult = {
    id?: string
}

type CreateCommunityTimeline = (body: CommunityTimelineSchema) => Promise<CreateCommunityTimelineResult>

export const createCommunityTimelineAndAddToLibrary = async ({
    body,
    createCommunityTimeline,
    upsertTimeline,
    onCreated,
    onFailed
}: {
    body: CommunityTimelineSchema
    createCommunityTimeline: CreateCommunityTimeline
    upsertTimeline?: UpsertTimeline
    onCreated: (timelineId: string) => void
    onFailed: (error?: unknown) => void
}): Promise<void> => {
    try {
        const timeline = await createCommunityTimeline(body)
        const id = timeline?.id
        if (!id) {
            onFailed(new Error('Timeline creation returned no id'))
            return
        }

        upsertTimeline?.(id)
        onCreated(id)
    } catch (error) {
        onFailed(error)
    }
}

