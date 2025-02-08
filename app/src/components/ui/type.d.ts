import 'react-markdown'

declare module 'react-markdown' {
    export interface Components {
        userlink?: React.FC<{ ccid: string }>
        streamlink?: React.FC<{ streamId: string }>
        emoji?: React.FC<{ shortcode: string }>
        social?: React.FC<{ type: string; icon: string; service: string; children: string }>
        emojipack?: React.FC<{ src: string }>
        colorcode?: React.FC<{ color: string }>
    }
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            userlink: { ccid: string } & React.DetailedHTMLProps<
                React.AnchorHTMLAttributes<HTMLAnchorElement>,
                HTMLAnchorElement
            >
            streamlink: { streamId: string } & React.DetailedHTMLProps<
                React.AnchorHTMLAttributes<HTMLAnchorElement>,
                HTMLAnchorElement
            >
            emoji: { shortcode: string } & React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLSpanElement>,
                HTMLSpanElement
            >
            social: { type: string; icon: string; service: string; children: string } & React.DetailedHTMLProps<
                React.AnchorHTMLAttributes<HTMLAnchorElement>,
                HTMLAnchorElement
            >
            emojipack: { src: string } & React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
            colorcode: { color: string } & React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLSpanElement>,
                HTMLSpanElement
            >
        }
    }
}
