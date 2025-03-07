import React, { useCallback, useEffect, useState } from "react";
import './App.css'
import ReactTree from './Components/ReactTree'
import * as d3 from "d3";
import "./styles.css"
import { TreeLinkStyle, Direction, Config, RawTreeNode, D3TreeNode } from "./Components/types"
import axios from "axios";
// import axios from "axios";

function App() {
  let dataset: RawTreeNode = {
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

  let dataset3: D3TreeNode = d3.hierarchy(dataset);

  const [data, setData] = useState<RawTreeNode>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("http://localhost:8081/api/v1/management-cluster/")
      .then((response) => {
        console.log(response.data)
        setData(response.data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;


  return (
    <>
      <div className="tree-container">
        <h2>Tree Chart Example</h2>
        <h2>Tree Chart Example</h2>
        <h2>Tree Chart Example</h2>
        <h2>Tree Chart Example</h2>
        <h2>Tree Chart Example</h2>
        <h2>Tree Chart Example</h2>
        <ReactTree
          // dataset={dataset3}
          dataset={[]}
          config={{ nodeWidth: 100, nodeHeight: 150, levelHeight: 200 }}
          linkStyle={TreeLinkStyle.STRAIGHT}
          direction={Direction.HORIZONTAL}
          collapseEnabled={false}
        />

      </div>
    </>
  )
}

export default App