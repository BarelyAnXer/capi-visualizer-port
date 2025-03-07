import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { HierarchyPointLink, HierarchyPointNode, ValueFn } from "d3";
import { Config, Direction, LinkDatum, NodeDatum, TreeLinkStyle } from "./types";
import { rotatePoint } from "./utils";

const ANIMATION_DURATION = 800;

interface RawTreeNode {
    name?: string;
    children?: RawTreeNode[] | null; // Should store raw children before converting to d3 hierarchy
    collapsed?: boolean;
    collapsible?: boolean;
    [key: string]: any; // Allows extra properties
}

interface TreeProps {
    config?: Config;
    linkStyle?: TreeLinkStyle;
    direction?: Direction;
    collapseEnabled?: boolean;
    dataset: d3.HierarchyNode<RawTreeNode>[];
}

const DEFAULT_CONFIG: Config = {
    nodeWidth: 350,
    nodeHeight: 140,
    levelHeight: 275,
};



// `HierarchyNode<RawTreeNode>` is the D3-wrapped version of the data
type D3TreeNode = d3.HierarchyNode<RawTreeNode>


const DEFAULT_HEIGHT_DECREMENT = 100;


const ReactTree: React.FC<TreeProps> = ({
    config = DEFAULT_CONFIG,
    linkStyle = TreeLinkStyle.CURVE,
    direction = Direction.VERTICAL,
    collapseEnabled = true,
    // dataset,
}) => {
    const [colors] = useState<string>("568FE1");
    const [nodeDataList, setNodeDataList] = useState<D3TreeNode[]>([]);
    const [linkDataList, setLinkDataList] = useState<d3.HierarchyLink<any>[]>([]);
    // const svgRef = useRef<SVGSVGElement | null>(null);
    const [initTransformX, setInitTransformX] = useState<number>(0);
    const [initTransformY, setInitTransformY] = useState<number>(0);
    const [currentScale, setCurrentScale] = useState<number>(1);

    // D3.js instance (assuming you need it)
    const [d3Instance] = useState<typeof d3>(d3);
    const [DIRECTION] = useState<typeof Direction>(Direction);


    const initialTransformStyle = useMemo(() => {
        return {
            transform: `scale(${currentScale}) translate(${initTransformX}px, ${initTransformY}px)`,
            transformOrigin: "center",
        };
    }, [initTransformX, initTransformY, currentScale]);



    const _linkStyle = useMemo(() => linkStyle, [linkStyle]);

    // ------- 

    // const svgRef = useRef(null);
    // get back here

    const containerRef = useRef<HTMLDivElement | null>(null);
    const initTransform = () => {
        if (!containerRef.current) return;

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

    useEffect(() => {
        initTransform()
    }, [])


    // const updatedInternalData = (externalData: RawTreeNode | RawTreeNode[] | null): RawTreeNode => {
    //     const rootNode: RawTreeNode = { name: "__invisible_root", children: [] };

    //     if (!externalData) return rootNode;

    //     if (Array.isArray(externalData)) {
    //         rootNode.children = externalData.map(deepCopy);
    //     } else {
    //         rootNode.children = [deepCopy(externalData)];
    //     }

    //     return rootNode;
    // };

    // const convertToD3Hierarchy = (data: RawTreeNode): D3TreeNode => {
    //     return d3.hierarchy(data);
    // };

    // const _dataset = useMemo(() => {
    //     const processedData = updatedInternalData(dataset);
    //     return convertToD3Hierarchy(processedData); // Returns a D3 HierarchyNode
    // }, [dataset]);



    // -------


    const draw = useCallback(() => {
        // guard if not yet loaded get back to here
        // if (!dataset || !svgRef.current) return;

        let dataset2: RawTreeNode = {
            name: "Root",
            children: [
                {
                    name: "Child 1",
                    children: [{ name: "Grandchild 1" }, { name: "Grandchild 2" }],
                },
                {
                    name: "Child 2",
                },
            ],
        };
        let dataset3: D3TreeNode = d3.hierarchy(dataset2);
        let [nodeDataList, linkDataList] = buildTree(dataset3, config);
        // setNodeDataList(nodeDataList)
        // setLinkDataList(linkDataList)
        console.log(linkDataList, 'whats')
        console.log(nodeDataList, "up")
        nodeDataList = nodeDataList.splice(0, 1)
        linkDataList = linkDataList.filter(
            (x) => x.source.data.name !== "__invisible_root"
        );

        const svg = d3.select(svgRef.current);

        const links = svg.selectAll(".link").data(linkDataList as any, (d: any) => {
            return `${d.source.data.name}-${d.target.data.name}`
        })

        console.log(links, "is ther ea data ")

        const identifier = dataset2["identifier"];
        const specialLinks = dataset2["links"];

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

                console.log(linkDataList, "asdh")
            }
        }


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
            .attr("d", function (this: SVGPathElement, d: unknown, i: number): string {
                return generateLinkPath(d as any);
            })

        // links
        //     .transition()
        //     .duration(ANIMATION_DURATION)
        //     .ease(d3.easeCubicInOut)
        //     .attr("d", function (this: SVGPathElement, d: unknown, i: number): string {
        //         return generateLinkPath(d as any);
        //     })
        links
            .exit()
            .transition()
            .duration(ANIMATION_DURATION / 2)
            .ease(d3.easeCubicInOut)
            .style("opacity", 1)
            .style("stroke", (d, i) => "")
            .style("stroke-width", (d, i) => "")
            .style("stroke-dashoffset", (d, i) => "")
            .style("stroke-dasharray", (d, i) => "")
            .style("stroke-linecap", (d, i) => "")
            .style("opacity", 0)
            .remove();



    }, []);

    // Function to build the D3 tree layout
    const buildTree = (rootNode: d3.HierarchyNode<RawTreeNode>, config: Config): [d3.HierarchyPointNode<RawTreeNode>[], d3.HierarchyPointLink<RawTreeNode>[]] => {
        const treeBuilder = d3
            .tree<RawTreeNode>()
            .nodeSize([config.nodeWidth, config.levelHeight])
            .separation((a, b) => (a.parent === b.parent ? 1 : 1 + 1 / (a.depth + 1)));

        const tree = treeBuilder(d3.hierarchy<RawTreeNode>(rootNode));

        return [tree.descendants(), tree.links()];
    };



    // get back here 
    useEffect(() => {
        draw();
    }, [draw]);



    function isVertical(): boolean {
        return direction === DIRECTION.VERTICAL;
    }

    const generateLinkPath = (d: LinkDatum): any => {
        // const self = this;
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

                    // return sourcePoint // temp

                    return direction === DIRECTION.VERTICAL
                        ? sourcePoint
                        : rotatePoint(sourcePoint);
                })
                .target(function (d) {
                    const targetPoint = {
                        x: d.target.x,
                        y: d.target.y,
                    };

                    // return targetPoint // temp
                    return direction === DIRECTION.VERTICAL
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



    // interface TreeNode {
    //     name: string;
    //     children?: TreeNode[];
    // }


    // useEffect(() => {
    //     if (!svgRef.current) return;

    //     const data: TreeNode = {
    //         name: "Root",
    //         children: [
    //             { name: "Child 1" },
    //             {
    //                 name: "Child 2",
    //                 // children: [{ name: "Grandchild 1" }, { name: "Grandchild 2" }]
    //             },
    //         ],
    //     };



    //     const width = 700;
    //     const height = 400;

    //     console.log(svgRef)

    //     const svg = d3.select(svgRef.current)
    //         .attr("width", width)
    //         .attr("height", height)
    //         .append("g")
    //         .style("stroke", (d) => {
    //             // console.log(d, "asd")
    //             // return "black"
    //             return 1
    //         })
    //         .attr("transform", "translate(100,100)");


    //     const root: d3.HierarchyNode<TreeNode> = d3.hierarchy(data);

    //     const treeLayout = d3.tree<TreeNode>().size([width - 100, height - 100]).nodeSize([150, 100])
    //         .separation((a, b) => (a.parent === b.parent ? 1 : 1 + 1 / (a.depth + 1)));

    //     // console.log(treeLayout, "??")

    //     const tree = treeLayout(d3.hierarchy<TreeNode>(root))
    //     // const tree = treeLayout(root)

    //     console.log(tree, "huh")

    //     console.log(tree.descendants(), "as")
    //     console.log(tree.links(), "hey")

    //     const nodeList = tree.descendants()
    //     let linkList = tree.links()

    //     nodeList.splice(0, 1);
    //     linkList = linkList.filter(
    //         (x) => x.source.data.name !== "__invisible_root"
    //     );

    //     // const linkGenerator = d3.linkVertical<any, any>()
    //     //     .x((d) => d.x)
    //     //     .y((d) => d.y);


    //     svg.selectAll(".link")
    //         .data(root.links())
    //         .enter()
    //         .append("path")
    //         // .attr("d", (d) => linkGenerator(d)!)
    //         .attr("fill", "none")
    //         .attr("stroke", "black");

    //     svg.selectAll(".node")
    //         .data(root.descendants())
    //         .enter()
    //         .append("circle")
    //         .attr("cx", (d: any) => d.x)
    //         .attr("cy", (d: any) => d.y)
    //         .attr("r", 5)
    //         .attr("fill", "blue");
    // }, []);


    return (
        <div>
            <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
                {/* My Component */}
                <svg ref={svgRef}></svg>;
                <div></div>
            </div>
           
        </div>
    );
}
export default ReactTree;
