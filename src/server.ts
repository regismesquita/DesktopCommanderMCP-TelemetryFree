import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ListPromptsRequestSchema,
    type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Define schema for prompts/get request if not already in SDK
export const GetPromptRequestSchema = z.object({
    method: z.literal("prompts/get"),
    params: z.object({
        name: z.string(),
        arguments: z.record(z.string(), z.string()),
    }),
});
import {zodToJsonSchema} from "zod-to-json-schema";
import {
    ExecuteCommandArgsSchema,
    ReadOutputArgsSchema,
    ForceTerminateArgsSchema,
    ListSessionsArgsSchema,
    KillProcessArgsSchema,
    ReadMultipleFilesArgsSchema,
    CreateDirectoryArgsSchema,
    MoveFileArgsSchema,
    GetFileInfoArgsSchema,
    EditBlockArgsSchema,
    GetConfigArgsSchema,
    SetConfigValueArgsSchema,
    ListProcessesArgsSchema,
} from './tools/schemas.js';
import {getConfig, setConfigValue} from './tools/config.js';

import {VERSION} from './version.js';
import {capture} from "./utils.js";
import {promptManager} from './prompt-manager.js';

/**
 * Helper function to get tool description from environment variables or fall back to default.
 * This function supports customizing tool descriptions through environment variables without
 * modifying the codebase. Environment variables follow the naming convention:
 * 
 * MCP_DESC_<TOOLNAME> where <TOOLNAME> is the uppercase name of the tool
 * 
 * Example: For a tool named 'browser_preview', the env var would be 'MCP_DESC_BROWSER_PREVIEW'
 * 
 * @param toolName - The name of the tool (used to construct the environment variable name)
 * @param defaultDescription - The default description to use if no valid override is found
 * @returns The tool description to use (either custom from env var or the default)
 */
function getToolDescription(toolName: string, defaultDescription: string): string {
    const envVarName = `MCP_DESC_${toolName}`;
    const customDescription = process.env[envVarName];
    
    // Use custom description if it exists and isn't just whitespace
    if (customDescription !== undefined && customDescription.trim() !== '') {
        return customDescription;
    } else {
        // Fallback to the default description
        return defaultDescription;
    }
}

console.error("Loading server.ts");

export const server = new Server(
    {
        name: "DevControlMCP",
        version: VERSION,
    },
    {
        capabilities: {
            tools: {},
            resources: {},  // Add empty resources capability
            prompts: {},    // Add empty prompts capability
        },
    },
);

// Add handler for resources/list method
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    // Return an empty list of resources
    return {
        resources: [],
    };
});

// Add handler for prompts/list method
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    console.error("Handling prompts/list request...");
    try {
        // Get all registered prompts
        const registeredPrompts = promptManager.getRegisteredPrompts();
        
        // Transform registered prompts to MCP format
        const promptsList = Object.values(registeredPrompts).map(prompt => {
            // Convert input schema to arguments array format
            const args = Object.entries(prompt.inputSchema.properties || {}).map(([name, prop]: [string, any]) => ({
                name,
                description: prop.description || "",
                required: prompt.inputSchema.required?.includes(name) || false,
            }));
            
            return {
                name: prompt.name,
                description: prompt.description || "",
                arguments: args,
            };
        });
        
        console.error(`Returning ${promptsList.length} registered prompts`);
        return {
            prompts: promptsList,
        };
    } catch (error) {
        console.error(`Error in prompts/list handler: ${error instanceof Error ? error.message : String(error)}`);
        // Return empty list on error
        return {
            prompts: [],
        };
    }
});

console.error("Setting up request handlers...");

server.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
        console.error("Generating tools list...");
        return {
            tools: [
                // Configuration tools
                {
                    name: "get_config",
                    description: getToolDescription(
                        "get_config", 
                        "Get the complete server configuration as JSON. Config includes fields for: blockedCommands (array of blocked shell commands), defaultShell (shell to use for commands), allowedDirectories (paths the server can access)."
                    ),
                    inputSchema: zodToJsonSchema(GetConfigArgsSchema),
                },
                {
                    name: "set_config_value",
                    description: getToolDescription(
                        "set_config_value", 
                        "Set a specific configuration value by key. WARNING: Should be used in a separate chat from file operations and command execution to prevent security issues. Config keys include: blockedCommands (array), defaultShell (string), allowedDirectories (array of paths). IMPORTANT: Setting allowedDirectories to an empty array ([]) allows full access to the entire file system, regardless of the operating system."
                    ),
                    inputSchema: zodToJsonSchema(SetConfigValueArgsSchema),
                },

                // Terminal tools
                {
                    name: "execute_command",
                    description: getToolDescription(
                        "execute_command", 
                        "Execute a terminal command with timeout. Command will continue running in background if it doesn't complete within timeout."
                    ),
                    inputSchema: zodToJsonSchema(ExecuteCommandArgsSchema),
                },
                {
                    name: "read_output",
                    description: getToolDescription(
                        "read_output", 
                        "Read new output from a running terminal session."
                    ),
                    inputSchema: zodToJsonSchema(ReadOutputArgsSchema),
                },
                {
                    name: "force_terminate",
                    description: getToolDescription(
                        "force_terminate", 
                        "Force terminate a running terminal session."
                    ),
                    inputSchema: zodToJsonSchema(ForceTerminateArgsSchema),
                },
                {
                    name: "list_sessions",
                    description: getToolDescription(
                        "list_sessions", 
                        "List all active terminal sessions."
                    ),
                    inputSchema: zodToJsonSchema(ListSessionsArgsSchema),
                },
                {
                    name: "list_processes",
                    description: getToolDescription(
                        "list_processes", 
                        "List all running processes. Returns process information including PID, command name, CPU usage, and memory usage."
                    ),
                    inputSchema: zodToJsonSchema(ListProcessesArgsSchema),
                },
                {
                    name: "kill_process",
                    description: getToolDescription(
                        "kill_process", 
                        "Terminate a running process by PID. Use with caution as this will forcefully terminate the specified process."
                    ),
                    inputSchema: zodToJsonSchema(KillProcessArgsSchema),
                },

                // Filesystem tools
                {
                    name: "read_multiple_files",
                    description: getToolDescription(
                        "read_multiple_files", 
                        "Read the contents of multiple files simultaneously. Each file's content is returned with its path as a reference. Handles text files normally and renders images as viewable content. Recognized image types: PNG, JPEG, GIF, WebP. Failed reads for individual files won't stop the entire operation. Only works within allowed directories."
                    ),
                    inputSchema: zodToJsonSchema(ReadMultipleFilesArgsSchema),
                },
                {
                    name: "create_directory",
                    description: getToolDescription(
                        "create_directory", 
                        "Create a new directory or ensure a directory exists. Can create multiple nested directories in one operation. Only works within allowed directories."
                    ),
                    inputSchema: zodToJsonSchema(CreateDirectoryArgsSchema),
                },
                {
                    name: "move_file",
                    description: getToolDescription(
                        "move_file", 
                        "Move or rename files and directories. Can move files between directories and rename them in a single operation. Both source and destination must be within allowed directories."
                    ),
                    inputSchema: zodToJsonSchema(MoveFileArgsSchema),
                },
                {
                    name: "get_file_info",
                    description: getToolDescription(
                        "get_file_info", 
                        "Retrieve detailed metadata about a file or directory including size, creation time, last modified time, permissions, and type. Only works within allowed directories."
                    ),
                    inputSchema: zodToJsonSchema(GetFileInfoArgsSchema),
                },
                // Note: list_allowed_directories removed - use get_config to check allowedDirectories

                // Text editing tools
                {
                    name: "edit_block",
                    description: getToolDescription(
                        "edit_block", 
                        "Apply surgical text replacements to files. Best for small changes (<20% of file size). Call repeatedly to change multiple blocks. Will verify changes after application. Format:\nfilepath\n<<<<<<< SEARCH\ncontent to find\n=======\nnew content\n>>>>>>> REPLACE"
                    ),
                    inputSchema: zodToJsonSchema(EditBlockArgsSchema),
                },
            ],
        };
    } catch (error) {
        console.error("Error in list_tools request handler:", error);
        throw error;
    }
});

import * as handlers from './handlers/index.js';
import {ServerResult} from './types.js';

// Add handler for prompts/get method
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    console.error("Handling prompts/get request...");
    const { name, arguments: args } = request.params;
    
    try {
        // Get the prompt
        const prompt = promptManager.getPrompt(name);
        
        if (!prompt) {
            console.error(`Prompt not found: ${name}`);
            return {
                messages: [],
                isError: true,
                errorMessage: `Prompt not found: ${name}`,
            };
        }
        
        // Validate that all required arguments are provided
        if (prompt.inputSchema.required) {
            const missingArgs = prompt.inputSchema.required.filter((argName: string) => !(argName in args));
            
            if (missingArgs.length > 0) {
                console.error(`Missing required arguments for prompt ${name}: ${missingArgs.join(", ")}`);
                return {
                    messages: [],
                    isError: true,
                    errorMessage: `Missing required arguments: ${missingArgs.join(", ")}`,
                };
            }
        }
        
        // Generate the message
        const messages = prompt.messageGenerator(args);
        
        console.error(`Generated ${messages.length} messages for prompt: ${name}`);
        return {
            messages,
        };
    } catch (error) {
        console.error(`Error in prompts/get handler: ${error instanceof Error ? error.message : String(error)}`);
        return {
            messages: [],
            isError: true,
            errorMessage: `Error generating prompt: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
});

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<ServerResult> => {
    try {
        const {name, arguments: args} = request.params;
        // Telemetry removed

        // Using a more structured approach with dedicated handlers
        switch (name) {
            // Config tools
            case "get_config":
                try {
                    return await getConfig();
                } catch (error) {
                    capture('server_request_error', {message: `Error in get_config handler: ${error}`});
                    return {
                        content: [{type: "text", text: `Error: Failed to get configuration`}],
                        isError: true,
                    };
                }
            case "set_config_value":
                try {
                    return await setConfigValue(args);
                } catch (error) {
                    capture('server_request_error', {message: `Error in set_config_value handler: ${error}`});
                    return {
                        content: [{type: "text", text: `Error: Failed to set configuration value`}],
                        isError: true,
                    };
                }

            // Terminal tools
            case "execute_command":
                return await handlers.handleExecuteCommand(args);

            case "read_output":
                return await handlers.handleReadOutput(args);

            case "force_terminate":
                return await handlers.handleForceTerminate(args);

            case "list_sessions":
                return await handlers.handleListSessions();

            // Process tools
            case "list_processes":
                return await handlers.handleListProcesses();

            case "kill_process":
                return await handlers.handleKillProcess(args);

            // Filesystem tools
            case "read_multiple_files":
                return await handlers.handleReadMultipleFiles(args);

            case "create_directory":
                return await handlers.handleCreateDirectory(args);

            case "move_file":
                return await handlers.handleMoveFile(args);

            case "get_file_info":
                return await handlers.handleGetFileInfo(args);

            case "edit_block":
                return await handlers.handleEditBlock(args);

            default:
                // Telemetry removed
                return {
                    content: [{type: "text", text: `Error: Unknown tool: ${name}`}],
                    isError: true,
                };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Telemetry removed
        return {
            content: [{type: "text", text: `Error: ${errorMessage}`}],
            isError: true,
        };
    }
});