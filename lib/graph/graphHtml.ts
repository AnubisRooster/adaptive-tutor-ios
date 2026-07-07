import { CYTOSCAPE_MIN_JS } from "./cytoscapeMinJs";

/**
 * Self-contained HTML document for the knowledge-map WebView: styles, the
 * vendored Cytoscape.js build inlined as a <script> body (no CDN, works
 * fully offline), and a renderGraph(jsonStr) entry point the RN side calls
 * via injectJavaScript once the WebView has loaded.
 *
 * Adapted from OnDeviceKit's GraphViewKit graph.html, re-themed for topic
 * mastery bands instead of therapy-session entity types, and posting taps
 * back via window.ReactNativeWebView.postMessage instead of WKWebView's
 * webkit.messageHandlers.
 */
export function buildGraphHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Knowledge Map</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: transparent; }
    #cy { width: 100%; height: 100%; display: block; }
    #info {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      background: rgba(0,0,0,0.65);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
      font-size: 13px;
      padding: 8px 12px;
      border-radius: 10px;
      display: none;
      max-width: 320px;
      word-break: break-word;
    }
    #empty {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
      font-size: 15px;
      color: #888;
      text-align: center;
      display: none;
    }
    #legend {
      position: absolute;
      bottom: 10px;
      left: 10px;
      right: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      background: rgba(0,0,0,0.5);
      border-radius: 10px;
      padding: 7px 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
      font-size: 12px;
      color: #eee;
    }
    .legend-item { display: flex; align-items: center; gap: 4px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  </style>
</head>
<body>
  <div id="cy"></div>
  <div id="info"></div>
  <div id="empty">No topics yet.<br>Start learning and your knowledge map will appear here.</div>
  <div id="legend">
    <span class="legend-item"><span class="legend-dot" style="background:#9ca3af"></span>Not started</span>
    <span class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>Learning</span>
    <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Practicing</span>
    <span class="legend-item"><span class="legend-dot" style="background:#22c55e"></span>Mastered</span>
  </div>
  <script>${CYTOSCAPE_MIN_JS}</script>
  <script>
    var cy = null;

    var bandColors = {
      "unstarted": "#9ca3af",
      "learning":  "#ef4444",
      "practicing":"#f59e0b",
      "mastered":  "#22c55e",
      "default":   "#9ca3af"
    };

    function colorFor(band) {
      return bandColors[band] || bandColors["default"];
    }

    window.renderGraph = function(jsonStr) {
      var data;
      try { data = JSON.parse(jsonStr); } catch(e) { return; }

      var nodes = (data.elements && data.elements.nodes) ? data.elements.nodes : [];
      var edges = (data.elements && data.elements.edges) ? data.elements.edges : [];

      var emptyEl = document.getElementById("empty");
      if (nodes.length === 0) {
        emptyEl.style.display = "block";
        return;
      }
      emptyEl.style.display = "none";

      var cyNodes = nodes.map(function(n) {
        var d = n.data;
        return {
          data: {
            id: d.id,
            label: d.label,
            subjectId: d.subjectId,
            band: d.band,
            mastery: d.mastery || 0,
            bloomLevel: d.bloomLevel || 1
          }
        };
      });

      var cyEdges = edges.map(function(e) {
        var d = e.data;
        return { data: { id: d.id, source: d.source, target: d.target, type: d.type } };
      });

      if (cy) { cy.destroy(); }

      cy = cytoscape({
        container: document.getElementById("cy"),
        elements: { nodes: cyNodes, edges: cyEdges },
        style: [
          {
            selector: "node",
            style: {
              "label": "data(label)",
              "background-color": function(ele) { return colorFor(ele.data("band")); },
              "width": function(ele) { return 26 + ele.data("mastery") * 24; },
              "height": function(ele) { return 26 + ele.data("mastery") * 24; },
              "font-size": "11px",
              "text-valign": "bottom",
              "text-halign": "center",
              "text-margin-y": 4,
              "color": "#ffffff",
              "text-background-color": "#000000",
              "text-background-opacity": 0.5,
              "text-background-padding": "2px",
              "text-background-shape": "roundrectangle",
              "border-width": 0
            }
          },
          {
            selector: "node:selected",
            style: { "border-width": 3, "border-color": "#ffffff", "overlay-opacity": 0.15 }
          },
          {
            selector: "edge",
            style: {
              "line-color": "#555",
              "target-arrow-color": "#555",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              "width": 2,
              "opacity": 0.6
            }
          },
          {
            selector: "edge:selected",
            style: { "opacity": 1, "line-color": "#ffffff", "target-arrow-color": "#ffffff" }
          }
        ],
        layout: {
          name: "breadthfirst",
          directed: true,
          animate: false,
          spacingFactor: 1.3
        },
        userZoomingEnabled: true,
        userPanningEnabled: true,
        minZoom: 0.2,
        maxZoom: 5
      });

      var infoEl = document.getElementById("info");

      cy.on("tap", "node", function(evt) {
        var d = evt.target.data();
        infoEl.style.display = "none";
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "nodeTap", id: d.id }));
        }
      });

      cy.on("tap", "edge", function(evt) {
        var d = evt.target.data();
        var srcLabel = cy.getElementById(d.source).data("label") || d.source;
        var tgtLabel = cy.getElementById(d.target).data("label") || d.target;
        infoEl.textContent = srcLabel + " is a prerequisite for " + tgtLabel;
        infoEl.style.display = "block";
      });

      cy.on("tap", function(evt) {
        if (evt.target === cy) { infoEl.style.display = "none"; }
      });

      cy.fit(undefined, 24);
    };
  </script>
</body>
</html>`;
}
