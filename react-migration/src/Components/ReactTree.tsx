import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { HierarchyPointLink, HierarchyPointNode, ValueFn } from "d3";
import { Config, Direction, LinkDatum, NodeDatum, TreeLinkStyle, RawTreeNode, } from "./types";
import { rotatePoint, formatDimension, deepCopy } from "./utils";
import "../styles.css"

const ANIMATION_DURATION = 800;


interface TreeProps {
    config?: Config;
    linkStyle?: TreeLinkStyle;
    direction?: Direction;
    collapseEnabled?: boolean;
    // dataset: d3.HierarchyNode<RawTreeNode>[];
    dataset: RawTreeNode
}

const DEFAULT_CONFIG: Config = {
    nodeWidth: 350,
    nodeHeight: 140,
    levelHeight: 275,
};


// `HierarchyNode<RawTreeNode>` is the D3-wrapped version of the data
type D3TreeNode = d3.HierarchyNode<RawTreeNode>

// Heirarchy node takes generics for (RawTreeNode) -> this becaomes the Datam??
// so when there are things that returns this we use datam Type which is the generic we passed?


const DEFAULT_HEIGHT_DECREMENT = 100;


const ReactTree: React.FC<TreeProps> = ({
    config = DEFAULT_CONFIG,
    linkStyle = TreeLinkStyle.CURVE,
    direction = Direction.VERTICAL,
    collapseEnabled = true,
    dataset,
}) => {
    const [colors] = useState<string>("568FE1");
    const [nodeDataList, setNodeDataList] = useState<D3TreeNode[]>([]);
    const [linkDataList, setLinkDataList] = useState<d3.HierarchyLink<any>[]>([]);
    // const svgRef = useRef<SVGSVGElement | null>(null);
    const [initTransformX, setInitTransformX] = useState<number>(0);
    const [initTransformY, setInitTransformY] = useState<number>(0);
    // const [currentScale, setCurrentScale] = useState<number>(1);
    const [stateDataset, setStateDataset] = useState(dataset)

    // D3.js instance (assuming you need it)
    const [d3Instance] = useState<typeof d3>(d3);
    // const [DIRECTION] = useState<typeof Direction>(Direction);


    const initialTransformStyle = useMemo(() => {
        return {
            transform: `scale(1) translate(${initTransformX}px, ${initTransformY}px)`,
            transformOrigin: "center",
        };
    }, [initTransformX, initTransformY]);



    const _linkStyle = useMemo(() => linkStyle, [linkStyle]);

    // ------- 

    // const svgRef = useRef(null);
    // get back here

    const containerRef = useRef<HTMLDivElement>(null);
    const initTransform = () => {
        // if (!containerRef.current) return;
        console.log("porky", containerRef.current)
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        if (isVertical()) {
            setInitTransformX(Math.floor(containerWidth / 2));
            setInitTransformY(Math.floor(config.nodeHeight - DEFAULT_HEIGHT_DECREMENT));
        } else {
            setInitTransformX(Math.floor(config.nodeWidth - DEFAULT_HEIGHT_DECREMENT));
            setInitTransformY(Math.floor(containerHeight / 2));
        }
    }

   
    const updatedInternalData = (externalData: any): RawTreeNode => {
        
        let data: RawTreeNode = { name: "__invisible_root", children: [] };
        if (!externalData) return data;

        if (Array.isArray(externalData)) {
            for (let i = externalData.length - 1; i >= 0; i--) {
                data.children.push(deepCopy(externalData[i]));
            }
        } else {
            data.children.push(deepCopy(externalData));
        }
        return data;
    };

    const _dataset = useMemo(() => updatedInternalData(dataset), [dataset]);


    // -------


    const draw = useCallback(() => {
        if (!dataset || !svgRef.current) return;
      
        console.log(dataset, "as")
        let [localNodeDataList, localLinkDataList] = buildTree(_dataset, config);


        localNodeDataList.splice(0, 1)
        localLinkDataList = localLinkDataList.filter(
            (x) => x.source.data.name !== "__invisible_root"
        );

        setNodeDataList(localNodeDataList)
        setLinkDataList(localLinkDataList)

        const identifier = dataset["identifier"];
        const specialLinks = dataset["links"];

        if (specialLinks && identifier) {
            console.log(specialLinks, identifier, "test1")
            for (const link of specialLinks) {
                console.log(link, "test2")
                let parent,
                    children = undefined;
                if (identifier === "value") {
                    parent = nodeDataList.find((d: RawTreeNode) => {
                        return d[identifier] == link.parent;
                    });
                    children = nodeDataList.filter((d: RawTreeNode) => {
                        return d[identifier] == link.child;
                    });
                } else {
                    parent = nodeDataList.find((d: RawTreeNode) => {
                        return d["data"][identifier] == link.parent;
                    });
                    children = nodeDataList.filter((d: RawTreeNode) => {
                        return d["data"][identifier] == link.child;
                    });
                }
                console.log(parent, children, "test3")

                if (parent && children) {
                    for (const child of children) {
                        const new_link = Object.assign(
                            {
                                source: parent,
                                target: child,
                            },
                            link.styles
                        );
                        linkDataList.push(new_link);
                    }
                }

                console.log(linkDataList, "asdQOah")

            }
        }

        const svg = d3.select(svgRef.current);
        const dom = d3.select(domRef.current);

        const links = svg.selectAll(".link").data(linkDataList as any, (d: any) => {
            return `${d.source.data.name}-${d.target.data.name}`
        })

        console.log(links, "is ther ea data ")

        // give this a proper type
        links
            .enter()
            .append("path")
            .style("opacity", 0)
            .transition()
            .duration(ANIMATION_DURATION)
            .ease(d3.easeCubicInOut)
            .style("opacity", 1)
            .style("stroke", (d: any, i) => d.stroke)
            .style("stroke-width", (d: any, i) => d["stroke-width"])
            .style("stroke-dashoffset", (d: any, i) => d["stroke-dashoffset"])
            .style("stroke-dasharray", (d: any, i) => d["stroke-dasharray"])
            .style("stroke-linecap", (d: any, i) => d["stroke-linecap"])
            .attr("class", "link")
            .attr("d", (d, i: number): string => {
                return generateLinkPath(d as LinkDatum);
            })

        // links
        //     .transition()
        //     .duration(ANIMATION_DURATION)
        //     .ease(d3.easeCubicInOut)
        //     .attr("d", (d, i: number): string => {
        //         return generateLinkPath(d as LinkDatum);
            // })
        // links
        //     .exit()
        //     .transition()
        //     .duration(ANIMATION_DURATION / 2)
        //     .ease(d3.easeCubicInOut)
        //     .style("opacity", 1)
        //     .style("stroke", (d, i) => "")
        //     .style("stroke-width", (d, i) => "")
        //     .style("stroke-dashoffset", (d, i) => "")
        //     .style("stroke-dasharray", (d, i) => "")
        //     .style("stroke-linecap", (d, i) => "")
        //     .style("opacity", 0)
            .remove();
    }, []);

    // Function to build the D3 tree layout
    const buildTree = (rootNode: RawTreeNode, config: Config): [d3.HierarchyPointNode<RawTreeNode>[], d3.HierarchyPointLink<RawTreeNode>[]] => {
        const treeBuilder = d3
            .tree<RawTreeNode>()
            .nodeSize([config.nodeWidth, config.levelHeight])
            .separation((a, b) => (a.parent === b.parent ? 1 : 1 + 1 / (a.depth + 1)));

        const tree = treeBuilder(d3.hierarchy<RawTreeNode>(rootNode));


        return [tree.descendants(), tree.links()];
    };



    useEffect(() => {
        draw();
        initTransform();
    }, [draw]);



    function isVertical(): boolean {
        return direction === Direction.VERTICAL;
    }

    const generateLinkPath = (d: LinkDatum): any => {
        if (linkStyle === TreeLinkStyle.CURVE) {
            const linkPath = isVertical() ? d3.linkVertical<LinkDatum, NodeDatum>() : d3.linkHorizontal<LinkDatum, NodeDatum>();

            linkPath
                .x(function (d: NodeDatum) {
                    return d.x;
                })
                .y(function (d: NodeDatum) {
                    return d.y;
                })
                .source(function (d: LinkDatum) {
                    const sourcePoint: NodeDatum = {
                        x: d.source.x,
                        y: d.source.y,
                    };
                    return direction === Direction.VERTICAL
                        ? sourcePoint
                        : rotatePoint(sourcePoint);
                })
                .target(function (d) {
                    const targetPoint = {
                        x: d.target.x,
                        y: d.target.y,
                    };
                    return direction === Direction.VERTICAL
                        ? targetPoint
                        : rotatePoint(targetPoint);
                });

            return linkPath(d)

        }
        if (linkStyle === TreeLinkStyle.STRAIGHT) {
            const linkPath = d3.path();
            let sourcePoint = { x: d.source.x, y: d.source.y };
            let targetPoint = { x: d.target.x, y: d.target.y };
            if (!isVertical()) {
                sourcePoint = rotatePoint(sourcePoint);
                targetPoint = rotatePoint(targetPoint);
            }
            const xOffset = targetPoint.x - sourcePoint.x;
            const yOffset = targetPoint.y - sourcePoint.y;
            const secondPoint = isVertical()
                ? { x: sourcePoint.x, y: sourcePoint.y + yOffset / 2 }
                : { x: sourcePoint.x + xOffset / 2, y: sourcePoint.y };
            const thirdPoint = isVertical()
                ? { x: targetPoint.x, y: sourcePoint.y + yOffset / 2 }
                : { x: sourcePoint.x + xOffset / 2, y: targetPoint.y };
            linkPath.moveTo(sourcePoint.x, sourcePoint.y);
            linkPath.lineTo(secondPoint.x, secondPoint.y);
            linkPath.lineTo(thirdPoint.x, thirdPoint.y);
            linkPath.lineTo(targetPoint.x, targetPoint.y);
            return linkPath.toString();
        }
    }

    const svgRef = useRef<SVGSVGElement>(null)
    const domRef = useRef<HTMLDivElement>(null)




    type SlotProps = {
        node: any;
        collapsed: boolean;
        index: number;
        children?: React.ReactNode;
    };

    const Slot: React.FC<SlotProps> = ({ node, collapsed, index, children }) => {
        return (
            <div>
                {children || (
                    <>
                        <span>{node.value}</span>
                    </>
                )}
            </div>
        );
    };



    type Props = {
        nodeDataList: D3TreeNode[]
        direction: Direction
    };

    const NodeSlots: React.FC<Props> = ({ nodeDataList, direction }) => {
        return (
            <>
                {nodeDataList.map((node: D3TreeNode, index: number) => (
                    <div
                        className="node-slot"
                        key={node.data._key}
                        style={{
                            left: formatDimension(
                                direction === Direction.VERTICAL ? node.y as number | string : node.x as number | string
                            ),
                            top: formatDimension(
                                direction === Direction.VERTICAL ? node.y as number | string : node.x as number | string
                            ),
                            width: formatDimension(config.nodeWidth),
                            height: formatDimension(config.nodeHeight)
                        }}
                    >
                        <div className="tempContainer">

                        </div>
                    </div>
                ))}
            </>
        );
    };



    return (
        <>
            <div className="tree-container" ref={containerRef}>
                <svg className="svg vue-tree" ref={svgRef} style={initialTransformStyle}></svg>
                <div className="dom-container" ref={domRef} style={initialTransformStyle}>
                    <NodeSlots
                        nodeDataList={nodeDataList}
                        direction={Direction.VERTICAL}
                    >

                    </NodeSlots>
                </div>
            </div>

        </>
    );
}
export default ReactTree;
