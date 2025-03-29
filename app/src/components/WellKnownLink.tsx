import { LinkChip } from './ui/LinkChip'

export const WellKnownLink = ({ href, children }: { href: string; children: JSX.Element }): JSX.Element => {
    const matchTwitter = href?.match(/https:\/\/twitter\.com\/(\w+)\/?$/)
    if (matchTwitter) {
        return (
            <LinkChip service="twitter" href={href}>
                {matchTwitter[1]}
            </LinkChip>
        )
    }
    const matchX = href?.match(/https:\/\/x\.com\/(\w+)\/?$/)
    if (matchX) {
        return (
            <LinkChip service="x" href={href}>
                {matchX[1]}
            </LinkChip>
        )
    }
    const matchYoutube = href?.match(/https:\/\/www\.youtube\.com\/@(\w+)\/?$/)
    if (matchYoutube) {
        return (
            <LinkChip service="youtube" href={href}>
                {matchYoutube[1]}
            </LinkChip>
        )
    }
    const matchGithub = href?.match(/https:\/\/github\.com\/(\w+)\/?$/)
    if (matchGithub) {
        return (
            <LinkChip service="github" href={href}>
                {matchGithub[1]}
            </LinkChip>
        )
    }
    const matchSoundcloud = href?.match(/https:\/\/soundcloud\.com\/(\w+)\/?$/)
    if (matchSoundcloud) {
        return (
            <LinkChip service="soundcloud" href={href}>
                {matchSoundcloud[1]}
            </LinkChip>
        )
    }
    const matchInstagram = href?.match(/https:\/\/www\.instagram\.com\/(\w+)\/?$/)
    if (matchInstagram) {
        return (
            <LinkChip service="instagram" href={href}>
                {matchInstagram[1]}
            </LinkChip>
        )
    }
    const matchTwitch = href?.match(/https:\/\/www\.twitch\.tv\/(\w+)\/?$/)
    if (matchTwitch) {
        return (
            <LinkChip service="twitch" href={href}>
                {matchTwitch[1]}
            </LinkChip>
        )
    }
    const matchBandcamp = href?.match(/https:\/\/(\w+)\.bandcamp\.com\/?$/)
    if (matchBandcamp) {
        return (
            <LinkChip service="bandcamp" href={href}>
                {matchBandcamp[1]}
            </LinkChip>
        )
    }

    return children
}
