**Before we start: This thing can completely destroy your system, files , projects and even worse... so be careful. By default this thing has permission to do whatever it wants on your computer.**

# DevControlMCP

> **IMPORTANT NOTE**: This project is originally based on the [wonderwhy-er/DesktopCommanderMCP](https://github.com/wonderwhy-er/DesktopCommanderMCP) project. It started as a telemetry-free version and has been transformed into a full fork, the main difference is that it is telemetry free and the license will always be MIT. no new features or anything, actually we will probably be behind the main version and we may strip some features down to keep the bare minimum and avoid tool bloating.  but no telmetry. no license change.

## Overview

DevControlMCP is an MCP (Model Context Protocol) tool that enables Claude desktop app to execute terminal commands and interact with your file system. It turns Claude into a powerful assistant for coding, system management, and file operations.

This version intentionally provides a streamlined set of tools, removing some of the more specialized functionality to focus on the core features. The removed tools include `read_file`, `write_file`, `list_directory`, `search_files`, and `search_code`, but their underlying functionality can still be achieved through terminal commands using `execute_command`.

## Features

- **Terminal Operations**: Execute commands with output streaming, timeouts, and background execution
- **Process Management**: List and manage running processes
- **File Operations**: Read multiple files at once, create directories, move files, and get metadata
- **Code Editing**: Make surgical text replacements to modify files
- **Configuration Management**: View and modify server configuration
- **Customizable Tool Descriptions**: Personalize tool descriptions via environment variables

## Installation

### Prerequisites
- Node.js v18 or higher
- Claude Desktop app with Pro subscription

### Quick Install

### Local Installation
```bash
git clone https://github.com/regismesquita/DevControlMCP.git
cd DevControlMCP
npm run setup
```

## Available Tools

| Category | Tool | Description |
|----------|------|-------------|
| **Configuration** | `get_config` | Get the complete server configuration |
| | `set_config_value` | Set a specific configuration value |
| **Terminal** | `execute_command` | Run a terminal command |
| | `read_output` | Read output from a running session |
| | `force_terminate` | Stop a running terminal session |
| | `list_sessions` | List all active terminal sessions |
| | `list_processes` | List all running processes |
| | `kill_process` | Terminate a process by PID |
| **Filesystem** | `read_multiple_files` | Read multiple files at once |
| | `create_directory` | Create a new directory |
| | `move_file` | Move or rename files |
| | `get_file_info` | Get file metadata |
| **Text Editing** | `edit_block` | Make surgical text replacements |

## Text Editing Example

```
filepath.ext
<<<<<<< SEARCH
content to find
=======
new content
>>>>>>> REPLACE
```

## Customizing Tool Descriptions

You can personalize the descriptions of all available tools by setting environment variables in your `claude_desktop_config.json` file. This allows you to make tool descriptions more relevant to your workflow or clarify specific functionality.

### How to Set Custom Tool Descriptions

1. Open your `claude_desktop_config.json` file (on Mac, found at `~/Library/Application Support/Claude/claude_desktop_config.json`)
2. Add or update the `env` object within your DevControlMCP configuration
3. Add environment variables using the naming pattern `MCP_DESC_TOOLNAME`

### Example Configuration

```json
{
  "mcpServers": {
    "DevControlMCP": {
      "command": "npx",
      "args": [
        "-y",
        "@regismesquita/DevControlMCP"
      ],
      "env": {
        "MCP_DESC_get_config": "Get current server configuration and settings",
        "MCP_DESC_execute_command": "Run a shell command with an optional timeout",
        "MCP_DESC_read_output": "Get output from currently running command"
      }
    }
  }
}
```

### Naming Convention

The pattern is always `MCP_DESC_` followed by the exact tool name. For example:
- For the `get_config` tool, use `MCP_DESC_get_config`
- For the `execute_command` tool, use `MCP_DESC_execute_command`

### Available Tools for Customization

All available tools that can be customized:
- `get_config` - Get server configuration as JSON
- `set_config_value` - Set a specific configuration value
- `execute_command` - Run a terminal command
- `read_output` - Read output from a running terminal session
- `force_terminate` - Stop a running terminal session
- `list_sessions` - List all active terminal sessions
- `list_processes` - List all running processes
- `kill_process` - Terminate a process by PID
- `read_multiple_files` - Read multiple files at once
- `create_directory` - Create a new directory
- `move_file` - Move or rename files
- `get_file_info` - Get file metadata
- `edit_block` - Make surgical text replacements

### Fallback Behavior

If you leave a description empty or just whitespace (e.g., `"MCP_DESC_get_config": ""`), the tool will automatically use its default description.

## Security Notes

- Set `allowedDirectories` to control filesystem access
- Be cautious when running terminal commands as they have full access to your system
- Use a separate chat for configuration changes
- This thing can completely destroy your system, files , projects and even worse... so be careful. By default this thing has permission to do whatever it wants on your computer.

## Custom MCP Prompts

DevControlMCP supports defining custom MCP prompts via environment variables. This allows you to create reusable prompts that Claude can access through the MCP protocol.

### Defining Custom Prompts

Custom prompts are defined using environment variables with keys prefixed with `MCP_PROMPT_DEF_`. The value must be a valid JSON string representing an object with the following structure:

```json
{
  "inputs": { 
    "paramName1": "string", 
    "paramName2": "string" 
  },
  "message": [
    "First line of the prompt with {paramName1}",
    "Second line with {paramName2}"
  ],
  "description": "Optional description of what this prompt does"
}
```

You can define custom prompts in two formats:

#### Standard Format (with escaped double quotes)

```
MCP_PROMPT_DEF_code_review="{\"inputs\":{\"language\":\"string\",\"code\":\"string\"},\"message\":[\"Please review this {language} code:\",\"{code}\"]}"
```

#### Enhanced Format (with single quotes)

For better readability, you can also use single quotes to wrap the entire JSON string, avoiding the need to escape double quotes inside:

```
MCP_PROMPT_DEF_code_review='{"inputs":{"language":"string","code":"string"},"message":["Please review this {language} code:","{code}"]}'
```

The enhanced format with single quotes is much easier to read and maintain, especially for complex prompts with nested quotes.

### Custom Prompt Structure

- **inputs**: A map of input parameter names to types (currently only "string" type is supported). All input parameters are required.
- **message**: An array of strings that form the prompt template. Each string can contain placeholders in the format `{paramName}` that correspond to keys in the `inputs` object.
- **description**: (Optional) A brief description of the prompt's purpose.

### Example Custom Prompts

#### Code Review Prompt

```json
{
  "inputs": {
    "language": "string",
    "code": "string"
  },
  "message": [
    "Please review the following {language} code for bugs, improvements, and best practices:",
    "{code}",
    "Please provide feedback on:",
    "1. Correctness and potential bugs",
    "2. Performance optimizations",
    "3. Coding style and best practices",
    "4. Security considerations"
  ],
  "description": "Review code for bugs, improvements, and best practices"
}
```

#### Meeting Summary Prompt

```json
{
  "inputs": {
    "topic": "string",
    "transcript": "string"
  },
  "message": [
    "Please summarize the following meeting about {topic}:",
    "{transcript}",
    "Include the following in your summary:",
    "- Key discussion points",
    "- Decisions made",
    "- Action items and owners",
    "- Follow-up questions"
  ],
  "description": "Generate a concise meeting summary with action items"
}
```

### Adding to Configuration

Add your custom prompts to the `claude_desktop_config.json` file under the `env` section. You can use either of the following formats:

#### Standard Format (with escaped quotes)

```json
{
  "mcpServers": {
    "DevControlMCP": {
      "command": "npx",
      "args": [
        "-y",
        "@regismesquita/DevControlMCP"
      ],
      "env": {
        "MCP_PROMPT_DEF_code_review": "{\"inputs\":{\"language\":\"string\",\"code\":\"string\"},\"message\":[\"Please review the following {language} code for bugs, improvements, and best practices:\",\"{code}\",\"Please provide feedback on:\",\"1. Correctness and potential bugs\",\"2. Performance optimizations\",\"3. Coding style and best practices\",\"4. Security considerations\"],\"description\":\"Review code for bugs, improvements, and best practices\"}",
        "MCP_PROMPT_DEF_meeting_summary": "{\"inputs\":{\"topic\":\"string\",\"transcript\":\"string\"},\"message\":[\"Please summarize the following meeting about {topic}:\",\"{transcript}\",\"Include the following in your summary:\",\"- Key discussion points\",\"- Decisions made\",\"- Action items and owners\",\"- Follow-up questions\"],\"description\":\"Generate a concise meeting summary with action items\"}"
      }
    }
  }
}
```

#### Enhanced Format (with single quotes)

You can also use a cleaner format with single quotes around the JSON string, which avoids the need for escaping double quotes:

```json
{
  "mcpServers": {
    "DevControlMCP": {
      "command": "npx",
      "args": [
        "-y",
        "@regismesquita/DevControlMCP"
      ],
      "env": {
        "MCP_PROMPT_DEF_code_review": '{"inputs":{"language":"string","code":"string"},"message":["Please review the following {language} code for bugs, improvements, and best practices:","{code}","Please provide feedback on:","1. Correctness and potential bugs","2. Performance optimizations","3. Coding style and best practices","4. Security considerations"],"description":"Review code for bugs, improvements, and best practices"}',
        "MCP_PROMPT_DEF_meeting_summary": '{"inputs":{"topic":"string","transcript":"string"},"message":["Please summarize the following meeting about {topic}:","{transcript}","Include the following in your summary:","- Key discussion points","- Decisions made","- Action items and owners","- Follow-up questions"],"description":"Generate a concise meeting summary with action items"}'
      }
    }
  }
}
```

**Note:** When using the enhanced format with single quotes, make sure your JSON configuration file supports this syntax (most modern JSON parsers do). The single-quoted format makes it much easier to write and maintain your custom prompt definitions.

### How Claude Uses Custom Prompts

Claude will detect and list your custom prompts. When you select a custom prompt, Claude will request the necessary inputs and then generate a message using your template.

### Important Notes

- All placeholders in the `message` array must correspond to keys in the `inputs` object
- All defined inputs are required when using the prompt
- Messages are joined with double newlines when generating the final prompt
- Prompts with invalid JSON or incorrect structure will be skipped

## License

This project is licensed under the MIT License.

Original work by Eduard Ruzga.

Modifications (Mostly removal of stuff) starting from commit 3bdaa965b4a77f64a9f8b751680bd1d90e651851 by RDSM.
