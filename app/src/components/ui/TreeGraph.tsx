import { Children, cloneElement } from 'react'

interface NodeStyle {
    nodeGap: string
    nodeBorderWidth: string
    nodeBorderColor: string
}

export interface NodeProps {
    content: JSX.Element
    children?: JSX.Element | JSX.Element[]
    depth?: number
    nodeStyle?: NodeStyle
    nodeposition?: 'start' | 'middle' | 'end' | 'single'
}

export function Node(props: NodeProps): JSX.Element {
    if (!props.nodeStyle) {
        return <>?</>
    }

    const hasChildren = props.children && Children.count(props.children) > 0

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start'
            }}
        >
            {props.depth && props.nodeposition === 'middle' && (
                <div
                    style={{
                        width: props.nodeStyle.nodeBorderWidth,
                        // backgroundColor: 'yellow',
                        flexShrink: 0,
                        alignSelf: 'stretch',
                        display: 'flex'
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: props.nodeStyle.nodeBorderColor
                        }}
                    />
                </div>
            )}

            <div
                style={{
                    // backgroundColor: 'lightgray',
                    display: 'flex',
                    justifyContent: 'center',
                    flexShrink: 0
                }}
            >
                {props.depth && (
                    <div
                        style={{
                            width:
                                props.nodeposition === 'middle'
                                    ? props.nodeStyle.nodeGap
                                    : `calc(${props.nodeStyle.nodeGap} + ${props.nodeStyle.nodeBorderWidth})`,
                            // backgroundColor: 'lime',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}
                    >
                        {props.nodeposition !== 'middle' && (
                            <div
                                style={{
                                    width: props.nodeStyle.nodeBorderWidth,
                                    // backgroundColor: 'yellow',
                                    flexShrink: 0,
                                    height: '100%',
                                    display: 'flex',
                                    alignItems:
                                        props.nodeposition === 'start'
                                            ? 'flex-end'
                                            : props.nodeposition === 'end'
                                              ? 'flex-start'
                                              : 'center'
                                }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height:
                                            props.nodeposition === 'single'
                                                ? props.nodeStyle.nodeBorderWidth
                                                : `calc(50% + ${props.nodeStyle.nodeBorderWidth}/2)`,
                                        backgroundColor: props.nodeStyle.nodeBorderColor
                                    }}
                                />
                            </div>
                        )}

                        <div
                            style={{
                                width: '100%',
                                height: props.nodeStyle.nodeBorderWidth,
                                backgroundColor: props.nodeStyle.nodeBorderColor
                            }}
                        />
                    </div>
                )}
                <div
                    style={{
                        padding: `calc(${props.nodeStyle.nodeGap}/2) 0`
                    }}
                >
                    {props.content}
                </div>
                {hasChildren && (
                    <>
                        <div
                            style={{
                                width: props.nodeStyle.nodeGap,
                                // backgroundColor: 'cyan',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: props.nodeStyle.nodeBorderWidth,
                                    backgroundColor: props.nodeStyle.nodeBorderColor
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
            {hasChildren && (
                <>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {Children.map(props.children, (child, i) =>
                            cloneElement(child!, {
                                depth: (props.depth || 0) + 1,
                                nodeStyle: props.nodeStyle,
                                nodeposition:
                                    Children.count(props.children) === 1
                                        ? 'single'
                                        : i === 0
                                          ? 'start'
                                          : i === Children.count(props.children) - 1
                                            ? 'end'
                                            : 'middle'
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
