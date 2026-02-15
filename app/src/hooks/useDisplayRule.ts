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
    const { items, tagRules } = useLibrary()

    return useMemo(() => {
        let rule: DisplayRule = 'normal'

        // Check author's user item display rule
        const authorItem = items.find(
            (item) => item.kind === 'user' && (item.ref as { ccid: string }).ccid === authorCCID
        )
        if (authorItem?.display) {
            rule = mostRestrictive(rule, authorItem.display)
        }

        // Check timeline items display rules
        if (timelineFQIDs) {
            for (const fqid of timelineFQIDs) {
                const tlItem = items.find(
                    (item) => item.kind === 'timeline' && (item.ref as { fqid: string }).fqid === fqid
                )
                if (tlItem?.display) {
                    rule = mostRestrictive(rule, tlItem.display)
                }
            }
        }

        // Check tag rules: if author item has tags, match them against tagRules
        if (authorItem?.tags?.length) {
            for (const tag of authorItem.tags) {
                const tagRule = tagRules.find((r) => r.tag === tag)
                if (tagRule?.display) {
                    rule = mostRestrictive(rule, tagRule.display)
                }
            }
        }

        return rule
    }, [items, tagRules, authorCCID, timelineFQIDs])
}
