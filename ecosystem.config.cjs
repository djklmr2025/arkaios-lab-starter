module.exports = {
  apps: [
    {
      name: "mcp-http",
      script: "apps/mcp/http.mjs",
      instances: 1,
      exec_mode: "fork",
      node_args: [],
      env: {
        MCP_HTTP_PORT: process.env.MCP_HTTP_PORT || 8090,
        LOCAL_BASE: process.env.LOCAL_BASE || "http://localhost:8080",
        AIDA_GATEWAY_URL: process.env.AIDA_GATEWAY_URL || "",
        AIDA_AUTH_TOKEN: process.env.AIDA_AUTH_TOKEN || "",
      },
    },
  ],
};