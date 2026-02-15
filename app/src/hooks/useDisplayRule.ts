import { useMemo } from 'react'
import { useLibrary, type DisplayRule } from '../context/LibraryContext'

const RULE_PRIORITY: Record<DisplayRule, number> = {
    normal: 0,
    blur: 1,
    omit: 2,
    hide: 3
}

const mostRestrictive = (a: DisplayRule, b: DisplayRule): DisplayRule => {
    return RULE_PRIORITY[a] >= RULE_PRIORITY[b] ? a : b
}

export function useDisplayRule(authorCCID: string, timelineFQIDs?: string[]): DisplayRule {
    const { userByCcid, timelineByFqid, tagRuleByTag } = useLibrary()

    return useMemo(() => {
        let rule: DisplayRule = 'normal'

        const authorItem = userByCcid.get(authorCCID)
        if (authorItem?.display) {
            rule = mostRestrictive(rule, authorItem.display)
        }

        if (timelineFQIDs) {
            for (const fqid of timelineFQIDs) {
                const tlItem = timelineByFqid.get(fqid)
                if (tlItem?.display) {
                    rule = mostRestrictive(rule, tlItem.display)
                }
            }
        }

        if (authorItem?.tags?.length) {
            for (const tag of authorItem.tags) {
                const tagRule = tagRuleByTag.get(tag)
                if (tagRule?.display) {
                    rule = mostRestrictive(rule, tagRule.display)
                }
            }
        }

        return rule
    }, [userByCcid, timelineByFqid, tagRuleByTag, authorCCID, timelineFQIDs])
}
