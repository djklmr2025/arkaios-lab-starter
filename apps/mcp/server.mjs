/**
 * ARKAIOS MCP Remote Desktop Server v1.0
 * Expone herramientas MCP para que el agente Comet pueda ver y controlar tu escritorio
 * remoto desde arkaios-service-proxy
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Configuración del proxy remoto
const PROXY_URL = process.env.PROXY_URL || "http://localhost:4000";
const PROXY_API_KEY = process.env.PROXY_API_KEY || "";

/**
 * Define las herramientas MCP disponibles para el agente
 */
const tools = [
  {
    name: "get_desktop_view",
    description:
      "Obtiene una captura de pantalla del escritorio remoto del usuario. Retorna una imagen base64 JPEG y metadata de la captura.",
    input_schema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description:
            "ID de la sesión remota (ej: session_1234567890_abc123). Si no se proporciona, se usa una por defecto.",
        },
      },
      required: [],
    },
  },
  {
    name: "send_desktop_action",
    description:
      "Envía una acción (click, tecla, movimiento) al escritorio remoto del usuario.",
    input_schema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "ID de la sesión remota.",
        },
        action: {
          type: "string",
          enum: ["click", "dblclick", "keypress", "scroll", "movemouse"],
          description: "Tipo de acción a ejecutar.",
        },
        x: {
          type: "number",
          description:
            "Coordenada X para acciones de click o movimiento del mouse (0-3840).",
        },
        y: {
          type: "number",
          description:
            "Coordenada Y para acciones de click o movimiento del mouse (0-2160).",
        },
        button: {
          type: "string",
          enum: ["left", "right", "middle"],
          description: "Botón del mouse para click. Default: left.",
        },
        key: {
          type: "string",
          description:
            "Tecla a presionar (ej: Enter, Escape, F5, etc.). Para keypress.",
        },
        text: {
          type: "string",
          description: "Texto a escribir directamente.",
        },
      },
      required: ["sessionId", "action"],
    },
  },
  {
    name: "get_desktop_status",
    description:
      "Obtiene el estado actual de la captura remota del escritorio (uptime, frames capturados, etc).",
    input_schema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "ID de la sesión remota.",
        },
      },
      required: [],
    },
  },
];

/**
 * Implementación de herramientas
 */
async function handleGetDesktopView(sessionId = "default_session") {
  try {
    const url = `${PROXY_URL}/v1/remote/last-frame?sessionId=${encodeURIComponent(
      sessionId
    )}`;
    const headers = PROXY_API_KEY
      ? { Authorization: `Bearer ${PROXY_API_KEY}` }
      : {};

    const response = await fetch(url, { headers });
    if (!response.ok) {
      return {
        error: `Proxy returned ${response.status}: ${response.statusText}`,
        sessionId,
      };
    }

    const data = await response.json();
    if (!data.ok) {
      return {
        error: data.error || "Unknown error from proxy",
        sessionId,
      };
    }

    return {
      ok: true,
      sessionId,
      frame: {
        data: data.frame?.data?.slice(0, 100) + "..." || "No image data", // Preview only
        width: data.frame?.width,
        height: data.frame?.height,
        capturedAt: data.frame?.capturedAt,
      },
      session: {
        status: data.session?.status,
        uptimeSeconds: data.session?.uptimeSeconds,
        frameCount: data.session?.frameCount,
      },
    };
  } catch (error) {
    return {
      error: `Failed to get desktop view: ${error.message}`,
      sessionId,
    };
  }
}

async function handleSendDesktopAction(
  sessionId,
  action,
  x,
  y,
  button = "left",
  key,
  text
) {
  try {
    const url = `${PROXY_URL}/v1/remote/action`;
    const headers = PROXY_API_KEY
      ? { Authorization: `Bearer ${PROXY_API_KEY}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };

    const payload = {
      sessionId,
      action,
      ...(x !== undefined && { x }),
      ...(y !== undefined && { y }),
      ...(button && { button }),
      ...(key && { key }),
      ...(text && { text }),
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        error: `Proxy returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      ok: data.ok ?? true,
      action,
      executedAt: data.executedAt,
      message: `Acción ${action} ejecutada en sesión ${sessionId}`,
    };
  } catch (error) {
    return {
      error: `Failed to send action: ${error.message}`,
    };
  }
}

async function handleGetDesktopStatus(sessionId = "default_session") {
  try {
    const url = `${PROXY_URL}/v1/remote/status/${encodeURIComponent(
      sessionId
    )}`;
    const headers = PROXY_API_KEY
      ? { Authorization: `Bearer ${PROXY_API_KEY}` }
      : {};

    const response = await fetch(url, { headers });
    if (!response.ok) {
      return {
        error: `Proxy returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    if (!data.ok) {
      return {
        error: data.error || "Session not found",
      };
    }

    return {
      ok: true,
      sessionId: data.sessionId,
      status: data.status,
      clientType: data.clientType,
      uptimeSeconds: data.uptimeSeconds,
      frameCount: data.frameCount,
      lastFrameAt: data.lastFrameAt,
      hasFrame: data.hasFrame,
      frameDimensions: data.frameDimensions,
    };
  } catch (error) {
    return {
      error: `Failed to get status: ${error.message}`,
    };
  }
}

/**
 * Procesa llamadas a herramientas del agente
 */
async function processToolCall(toolName, toolInput) {
  console.log(`\n[MCP] Tool called: ${toolName}`);
  console.log(`[MCP] Input:`, JSON.stringify(toolInput, null, 2));

  switch (toolName) {
    case "get_desktop_view":
      return await handleGetDesktopView(toolInput.sessionId);

    case "send_desktop_action":
      return await handleSendDesktopAction(
        toolInput.sessionId,
        toolInput.action,
        toolInput.x,
        toolInput.y,
        toolInput.button,
        toolInput.key,
        toolInput.text
      );

    case "get_desktop_status":
      return await handleGetDesktopStatus(toolInput.sessionId);

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Loop principal del agente MCP
 */
async function runAgent(userMessage) {
  console.log(`\n\n========== ARKAIOS MCP REMOTE DESKTOP AGENT =========`);
  console.log(`User input: ${userMessage}`);
  console.log(`Proxy URL: ${PROXY_URL}`);
  console.log(`===============================================\n`);

  const messages = [
    {
      role: "user",
      content: userMessage,
    },
  ];

  // Agentic loop
  while (true) {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      tools: tools,
      messages: messages,
    });

    console.log(`\n[Agent] Stop reason: ${response.stop_reason}`);
    console.log(`[Agent] Content:`, JSON.stringify(response.content, null, 2));

    // Procesar respuesta
    if (response.stop_reason === "end_turn") {
      // El agente terminó, extraer respuesta final
      const finalText = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      console.log(`\n[Agent Final Response]\n${finalText}`);
      return finalText;
    }

    if (response.stop_reason === "tool_use") {
      // Procesar tool calls
      const toolResults = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          const toolName = block.name;
          const toolInput = block.input;
          const toolUseId = block.id;

          console.log(`\n[Tool Use Block]`);
          console.log(`  Name: ${toolName}`);
          console.log(`  ID: ${toolUseId}`);

          const result = await processToolCall(toolName, toolInput);
          console.log(`  Result:`, JSON.stringify(result, null, 2));

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUseId,
            content: JSON.stringify(result),
          });
        }
      }

      // Añadir la respuesta del agente al historial
      messages.push({
        role: "assistant",
        content: response.content,
      });

      // Añadir resultados de herramientas
      messages.push({
        role: "user",
        content: toolResults,
      });
    } else {
      console.log(`\nUnexpected stop reason: ${response.stop_reason}`);
      break;
    }
  }
}

/**
 * Punto de entrada
 */
const userInput =
  process.argv[2] ||
  "Puedes ayudarme? Observa mi escritorio y déjame saber qué ves. Después, intenta hacer un clic en el centro de la pantalla.";

runAgent(userInput)
  .then(() => {
    console.log(`\n\n[Success] Agent completed`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n\n[Error] ${error.message}`);
    process.exit(1);
  });
