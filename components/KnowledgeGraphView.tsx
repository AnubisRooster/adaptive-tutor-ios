import React, { useRef } from "react";
import { StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { buildGraphHtml } from "@/lib/graph/graphHtml";

interface Props {
  cytoscapeJSON: string;
  onNodeTap?: (topicId: string) => void;
}

const GRAPH_HTML = buildGraphHtml();

/**
 * Offline Cytoscape.js knowledge-map renderer. Loads a self-contained local
 * HTML document (vendored Cytoscape.js, no network) and injects the topic
 * graph JSON once the page signals it has loaded.
 */
export default function KnowledgeGraphView({ cytoscapeJSON, onNodeTap }: Props) {
  const webViewRef = useRef<WebView>(null);

  const injectGraph = () => {
    const script = `window.renderGraph(${JSON.stringify(cytoscapeJSON)}); true;`;
    webViewRef.current?.injectJavaScript(script);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type === "nodeTap" && typeof payload.id === "string") {
        onNodeTap?.(payload.id);
      }
    } catch {
      // Ignore malformed messages from the page.
    }
  };

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html: GRAPH_HTML }}
      onLoadEnd={injectGraph}
      onMessage={handleMessage}
      style={styles.webview}
      testID="knowledge-graph-webview"
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: "transparent" },
});
