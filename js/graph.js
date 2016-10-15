/**
 * Graph Module
 * -----------
 *
 */
var graph = {
  /**
   *
   *
   */
  highlightActive: false,
  redrawAll: function(nodes, edges) {
    var container = document.getElementById('mynetwork');
    var nodesDataset = new vis.DataSet(nodes);
    var edgesDataset = new vis.DataSet(edges);
    var options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 10,
          max: 30,
          label: {
            min: 8,
            max: 30,
            drawThreshold: 12,
            maxVisible: 20
          }
        },
        font: {
          size: 12,
          face: 'Tahoma'
        }
      },
      edges: {
        color:{inherit:true},
        width: 0.15,
        smooth: {
          type: 'continuous'
        }
      },
      interaction: {
        hideEdgesOnDrag: true,
        tooltipDelay: 200
      },
      configure: {
        filter: function (option, path) {
          if (option === 'inherit') {return true;}
          if (option === 'type' && path.indexOf("smooth") !== -1) {return true;}
          if (option === 'roundness') {return true;}
          if (option === 'hideEdgesOnDrag') {return true;}
          if (option === 'hideNodesOnDrag') {return true;}
          return false;
        },
        container: document.getElementById('optionsContainer'),
        showButton: false
      },
      physics: {
        enabled: false,
        forceAtlas2Based: {
          gravitationalConstant: -26,
          centralGravity: 0.005,
          springLength: 230,
          springConstant: 0.18
        },
        maxVelocity: 146,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: {iterations: 150}
      },
      layout: {
        improvedLayout: true,
        hierarchical: {
          levelSeparation: 400,
          nodeSpacing: 150,
          enabled: true,
          direction: 'UD',
          sortMethod: 'directed'
        }
      }
    };

    var highlightActive = false;
    var data = {nodes:nodesDataset, edges:edgesDataset};
    network = new vis.Network(container, data, options);
    // get a JSON object
    allNodes = nodesDataset.get({returnType:"Object"});
    allEdges = edgesDataset.get({returnType: "Object"});
    network.on("click", function(params) {
      // Reset edges
      for (var edgeId in allEdges) {
        if (allEdges[edgeId].label !== undefined) {
          allEdges[edgeId].hiddenLabel = allEdges[edgeId].label;
          allEdges[edgeId].label = undefined;
        }
      }
      // if something is selected
      if (params.nodes.length > 0) {
        highlightActive = true;
        var i,j;
        var selectedNode = params.nodes[0];
        var degrees = 2;

        // mark all nodes as hard to read.
        for (var nodeId in allNodes) {
          allNodes[nodeId].color = 'rgba(200,200,200,0.5)';
          if (allNodes[nodeId].hiddenLabel === undefined) {
            allNodes[nodeId].hiddenLabel = allNodes[nodeId].label;
            allNodes[nodeId].label = undefined;
          }
        }
        var connectedNodes = network.getConnectedNodes(selectedNode);
        var allConnectedNodes = [];

        // get the second degree nodes
        for (i = 1; i < degrees; i++) {
          for (j = 0; j < connectedNodes.length; j++) {
            allConnectedNodes = allConnectedNodes.concat(network.getConnectedNodes(connectedNodes[j]));
          }
        }

        // all second degree nodes get a different color and their label back
        for (i = 0; i < allConnectedNodes.length; i++) {
          allNodes[allConnectedNodes[i]].color = 'rgba(150,150,150,0.75)';
          if (allNodes[allConnectedNodes[i]].hiddenLabel !== undefined) {
            allNodes[allConnectedNodes[i]].label = allNodes[allConnectedNodes[i]].hiddenLabel;
            allNodes[allConnectedNodes[i]].hiddenLabel = undefined;
            // all 2nd degree nodes' edges get their label back
          }
          network.getConnectedEdges(allNodes[allConnectedNodes[i]]['id']).forEach(function(v) {
            if (allEdges[v].hiddenLabel !== undefined) {
              allEdges[v].label = allEdges[v].hiddenLabel;
              allEdges[v].hiddenLabel = undefined;
            }
          });
        }

        // all first degree nodes get their own color and their label back
        for (i = 0; i < connectedNodes.length; i++) {
          allNodes[connectedNodes[i]].color = undefined;
          if (allNodes[connectedNodes[i]].hiddenLabel !== undefined) {
            allNodes[connectedNodes[i]].label = allNodes[connectedNodes[i]].hiddenLabel;
            allNodes[connectedNodes[i]].hiddenLabel = undefined;

          }
        }

        // the main node gets its own color and its label back.
        allNodes[selectedNode].color = undefined;
        if (allNodes[selectedNode].hiddenLabel !== undefined) {
          allNodes[selectedNode].label = allNodes[selectedNode].hiddenLabel;
          allNodes[selectedNode].hiddenLabel = undefined;
        }
      }
      else if (highlightActive === true) {
        // reset all nodes
        for (var nodeId in allNodes) {
          allNodes[nodeId].color = undefined;
          if (allNodes[nodeId].hiddenLabel !== undefined) {
            allNodes[nodeId].label = allNodes[nodeId].hiddenLabel;
            allNodes[nodeId].hiddenLabel = undefined;
          }
        }
        highlightActive = false
      }

      // transform the object into an array
      var updateArray = [];
      var edgeUpdateArray = [];
      for (nodeId in allNodes) {
        if (allNodes.hasOwnProperty(nodeId)) {
          updateArray.push(allNodes[nodeId]);
        }
      }
      for (edgeId in allEdges) {
        if (allEdges.hasOwnProperty(edgeId)) {
          edgeUpdateArray.push(allEdges[edgeId]);
        }
      }
      nodesDataset.update(updateArray);
      edgesDataset.update(edgeUpdateArray);
    });
    logger.debug(network);
    return network;
  },
  /**
   *
   *
   */
  refresh: function(network) {
    var allNodes = network.body.data.nodes.get({returnType: "Object" });
    var allEdges = network.body.data.edges.get({returnType: "Object"});
    var that = this;
    network.off("click");
    network.on("click", function(params) {
      // Reset edges
      for (var edgeId in allEdges) {
        if (allEdges[edgeId].label !== undefined) {
          allEdges[edgeId].hiddenLabel = allEdges[edgeId].label;
          allEdges[edgeId].label = undefined;
        }
      }
      // if something is selected
      if (params.nodes.length > 0) {
        that.highlightActive = true;
        var i,j;
        var selectedNode = params.nodes[0];
        var degrees = 2;

        // mark all nodes as hard to read.
        for (var nodeId in allNodes) {
          allNodes[nodeId].color = 'rgba(200,200,200,0.5)';
          if (allNodes[nodeId].hiddenLabel === undefined) {
            allNodes[nodeId].hiddenLabel = allNodes[nodeId].label;
            allNodes[nodeId].label = undefined;
          }
        }
        var connectedNodes = network.getConnectedNodes(selectedNode);
        var allConnectedNodes = [];

        // get the second degree nodes
        for (i = 1; i < degrees; i++) {
          for (j = 0; j < connectedNodes.length; j++) {
            allConnectedNodes = allConnectedNodes.concat(network.getConnectedNodes(connectedNodes[j]));
          }
        }

        // all second degree nodes get a different color and their label back
        for (i = 0; i < allConnectedNodes.length; i++) {
          allNodes[allConnectedNodes[i]].color = 'rgba(150,150,150,0.75)';
          if (allNodes[allConnectedNodes[i]].hiddenLabel !== undefined) {
            allNodes[allConnectedNodes[i]].label = allNodes[allConnectedNodes[i]].hiddenLabel;
            allNodes[allConnectedNodes[i]].hiddenLabel = undefined;
            // all 2nd degree nodes' edges get their label back
          }
          network.getConnectedEdges(allNodes[allConnectedNodes[i]]['id']).forEach(function(v) {
            if (allEdges[v].hiddenLabel !== undefined) {
              allEdges[v].label = allEdges[v].hiddenLabel;
              allEdges[v].hiddenLabel = undefined;
            }
          });
        }

        // all first degree nodes get their own color and their label back
        for (i = 0; i < connectedNodes.length; i++) {
          allNodes[connectedNodes[i]].color = undefined;
          if (allNodes[connectedNodes[i]].hiddenLabel !== undefined) {
            allNodes[connectedNodes[i]].label = allNodes[connectedNodes[i]].hiddenLabel;
            allNodes[connectedNodes[i]].hiddenLabel = undefined;

          }
        }

        // the main node gets its own color and its label back.
        allNodes[selectedNode].color = undefined;
        if (allNodes[selectedNode].hiddenLabel !== undefined) {
          allNodes[selectedNode].label = allNodes[selectedNode].hiddenLabel;
          allNodes[selectedNode].hiddenLabel = undefined;
        }
      }
      else if (that.highlightActive === true) {
        // reset all nodes
        for (var nodeId in allNodes) {
          allNodes[nodeId].color = undefined;
          if (allNodes[nodeId].hiddenLabel !== undefined) {
            allNodes[nodeId].label = allNodes[nodeId].hiddenLabel;
            allNodes[nodeId].hiddenLabel = undefined;
          }
        }
        that.highlightActive = false
      }

      // transform the object into an array
      var updateArray = [];
      var edgeUpdateArray = [];
      for (nodeId in allNodes) {
        if (allNodes.hasOwnProperty(nodeId)) {
          updateArray.push(allNodes[nodeId]);
        }
      }
      for (edgeId in allEdges) {
        if (allEdges.hasOwnProperty(edgeId)) {
          edgeUpdateArray.push(allEdges[edgeId]);
        }
      }
      network.body.data.nodes.update(updateArray);
      network.body.data.edges.update(edgeUpdateArray);
    });
  }
};
