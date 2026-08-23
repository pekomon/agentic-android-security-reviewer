# Agentic Android Security Reviewer

An experimental AI-native security review agent for Android applications.

The project explores production-oriented agentic engineering in a security
context: deterministic tool use, MCP integration, structured outputs,
evidence-backed reasoning, agent behavior evals, and explicit testing of
agent behavior.

The current scope is deliberately small: analyze `AndroidManifest.xml` and
produce structured security findings backed by manifest evidence.

## What this demonstrates

- Agent design that separates deterministic tools from probabilistic reasoning
- MCP server integration with a reusable security inspection capability
- Structured model output with evidence-backed findings
- Agent behavior evals for model-dependent behavior
- Tool-use evals that verify the intended agent architecture
- Deterministic parser and MCP integration tests
- GitHub Actions coverage for deterministic tests and manually triggered agent
  evals
- Reuse of the same MCP capability from both the security review agent and
  external MCP clients

## Architecture

The system separates deterministic fact extraction from probabilistic security
reasoning.

```text
AndroidManifest.xml
        ↓
Security Review Agent
        ↓
MCP tool call: inspect_manifest
        ↓
Android Security MCP Server
        ↓
deterministic XML parser
        ↓
ManifestFacts
        ↓
Security Review Agent
        ↓
structured SecurityReview
```

The MCP server exposes deterministic Android manifest inspection as a reusable
capability. The parser extracts facts such as application security
configuration, requested permissions, exported Android components, component
permissions, intent filters, and deep-link data constraints.

The agent reasons about those facts and produces structured findings with
category, severity, classification, evidence, recommendation, and confidence.
This keeps deterministic work out of the language model and makes the system
easier to test, evaluate, reuse, and debug.

## Implemented features

- Android manifest fact model
- Deterministic XML parser
- Structured security review output
- Exported component analysis
- Permission-related behavior
- Intent-filter and deep-link facts
- MCP server exposing `inspect_manifest`
- OpenAI Agents SDK MCP client integration
- Structured MCP tool output
- Deterministic unit tests
- MCP integration test
- Agent behavior evals
- Tool-use eval
- Agent workflow tracing and failure analysis
- GitHub Actions CI for deterministic tests
- Manually triggered GitHub Actions workflow for agent evals
- Project-local Codex MCP configuration

## Example security review

A browsable exported activity such as:

```xml
<activity
    android:name=".DeepLinkActivity"
    android:exported="true">

    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
    </intent-filter>

</activity>
```

is first converted into deterministic manifest facts. The agent then reasons
about those facts and can produce a structured finding such as:

```json
{
  "findings": [
    {
      "category": "EXPORTED_COMPONENT",
      "severity": "MEDIUM",
      "classification": "POTENTIAL_RISK",
      "title": "Exported deep-link activity lacks URI restrictions",
      "description": "DeepLinkActivity is publicly accessible and handles browsable VIEW intents, but its intent filter declares no scheme, host, or path constraints. Security depends on robust input validation and authorization in the activity.",
      "evidence": "Activity .DeepLinkActivity has exported=true and a VIEW/DEFAULT/BROWSABLE intent filter with no data elements or permission.",
      "recommendation": "Restrict the intent filter to required URI schemes, hosts, and paths, and validate all incoming URI data and authorization state before processing.",
      "confidence": 0.99
    }
  ]
}
```

The key property is that the reasoning is based on structured facts returned by
the inspection tool rather than on hidden XML interpretation by the model.

## Why this architecture?

### Deterministic facts before probabilistic reasoning

The goal is not to use an LLM to parse XML.

Deterministic code handles facts that can be extracted reliably. The agent is
used where interpretation is required, for example:

- distinguishing normal configuration from security-relevant risk
- deciding when manifest evidence is insufficient
- assessing exported component exposure
- interpreting broad permissions
- reasoning about browsable deep-link surfaces

The agent is instructed to base findings on facts returned by the inspection
tool rather than independently interpreting the manifest.

### Why MCP?

The manifest parser does not inherently need MCP. If the capability were used
only inside this application, a local function tool would be simpler.

MCP is used here to expose deterministic Android security inspection through a
standard protocol, so the capability is not coupled to one agent
implementation.

```text
Security Review Agent ──┐
                        │
Codex / MCP client ─────┼──> Android Security MCP Server
                        │           ↓
Other MCP clients ──────┘     inspect_manifest
                                    ↓
                              parseManifest()
```

The current security review agent consumes `inspect_manifest` through MCP,
while the same server can also be discovered and invoked independently by
other MCP-compatible clients.

## Testing and evals

The project deliberately separates deterministic tests from model-dependent
evals.

### Unit and integration tests

```bash
npm test
```

Tests deterministic manifest parsing and the MCP server integration using
Node's built-in test runner.

The MCP integration test verifies that:

- the MCP server starts successfully
- `inspect_manifest` is discoverable
- the tool can be invoked over MCP
- structured `ManifestFacts` are returned correctly

These tests run automatically in GitHub Actions.

### Agent behavior evals

```bash
npm run eval
```

Checks security behavior across known manifest cases, including:

- clean manifests
- debug configuration
- cleartext traffic
- exported components
- ordinary permissions that should not create noise
- broad package visibility
- browsable deep-link exposure

These evals protect against regressions when prompts, tools, transport
mechanisms, or fact schemas change.

### Tool-use eval

```bash
npm run eval:tools
```

Verifies that the agent actually uses the `inspect_manifest` tool rather than
bypassing the intended architecture.

This tests the workflow itself, not only the final answer.

### GitHub Actions

Deterministic tests run automatically on pushes and pull requests.

Model-dependent agent evals are intentionally separated into a manually
triggered GitHub Actions workflow because they require an API key, incur model
usage, and are probabilistic.

```text
push / pull request
        ↓
deterministic tests

manual Agent Evals workflow
        ↓
agent behavior evals
        +
tool-use eval
```

## Engineering approach

A recurring design principle in this project is:

```text
deterministic facts
        ↓
probabilistic reasoning
        ↓
structured, evidence-backed output
```

One example emerged while adding intent-filter support. After exposing actions
and categories to the agent, the model correctly recognized a browsable
deep-link surface but initially reasoned about missing URI constraints that
were not yet represented in the tool output.

Instead of accepting that implicit XML interpretation, the fact model and
parser were expanded to include intent-filter `<data>` elements. This keeps
conclusions traceable to tool-provided evidence.

The same principle applies to the MCP integration: protocol and transport
concerns are kept outside the deterministic parser. The MCP server acts as an
adapter around the existing domain capability rather than moving parsing or
security logic into the protocol layer.

## Tracing and failure analysis

Agent runs are traced through the OpenAI Agents SDK so that model calls, MCP
tool use, tool outputs, and final structured results can be inspected as one
workflow.

This makes it possible to distinguish different failure modes:

```text
incorrect facts
    ↓
parser / tool / schema problem

correct facts, incorrect finding
    ↓
agent policy / reasoning problem

inspection tool not called
    ↓
workflow / orchestration problem
```

One concrete example was the handling of `android:debuggable="true"`.

A trace showed that the deterministic `inspect_manifest` tool correctly
returned:

```json
{
  "application": {
    "debuggable": true,
    "usesCleartextTraffic": null
  },
  "components": [],
  "permissions": []
}
```

The agent initially classified this evidence as a confirmed `HIGH`
`VULNERABILITY`.

The trace made the problem clear: fact extraction was correct, but the agent
was overclassifying the evidence. A manifest with debugging enabled does not
by itself establish that the artifact is a production or release build.

The agent policy was therefore refined so that `android:debuggable="true"` is
treated as a `POTENTIAL_RISK` unless additional evidence establishes release
or production context.

The corresponding agent behavior eval was also tightened to require the
`POTENTIAL_RISK` classification.

```text
observe trace
    ↓
identify overclassification
    ↓
refine agent policy
    ↓
strengthen eval
    ↓
prevent regression
```

This feedback loop is the intended approach for evolving model-dependent
behavior: use traces to understand failures, improve the smallest responsible
layer, and convert the discovered behavior into a regression guard.

## Running locally

Requires Node.js 22+.

Install dependencies:

```bash
npm ci
```

Run deterministic tests:

```bash
npm test
```

Run agent behavior evals:

```bash
npm run eval
```

Run tool-use eval:

```bash
npm run eval:tools
```

Agent evals require an OpenAI API key configured through the environment.

## Using the MCP server from clients

The `android-security` MCP server uses standard MCP over stdio and exposes the
`inspect_manifest` tool.

The server itself is client-agnostic. Different clients only need to configure
how the server process is launched.

### MCP Inspector

The MCP server can be explored independently using the MCP Inspector.

Start the Inspector:

```bash
npx @modelcontextprotocol/inspector node mcp/server.mjs
```

The available tools can also be inspected from the command line:

```bash
npx @modelcontextprotocol/inspector --cli \
  node mcp/server.mjs \
  --method tools/list
```

A successful result includes:

```text
inspect_manifest
```

### Codex

The repository includes a project-local Codex MCP configuration:

```text
.codex/config.toml
```

It registers the Android security MCP server:

```toml
[mcp_servers.android-security]
command = "node"
args = ["mcp/server.mjs"]
```

After cloning the repository and installing dependencies:

```bash
npm ci
```

start Codex from the repository root:

```bash
codex
```

Codex may require the repository to be trusted before project-local
configuration is loaded.

The configured MCP server exposes `inspect_manifest` directly to Codex. For
example:

```text
Use the android-security MCP server to inspect this AndroidManifest.xml.
Do not analyze the XML yourself. Show only the deterministic facts returned
by inspect_manifest.

<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />

    <application android:debuggable="true">
        <activity
            android:name=".MainActivity"
            android:exported="true" />
    </application>
</manifest>
```

A successful invocation is visible in Codex as an MCP tool call similar to:

```text
Called
└ android-security.inspect_manifest(...)
```

and returns structured manifest facts such as:

```json
{
  "application": {
    "debuggable": true,
    "usesCleartextTraffic": null
  },
  "components": [
    {
      "type": "ACTIVITY",
      "name": ".MainActivity",
      "exported": true,
      "permission": null,
      "intentFilters": []
    }
  ],
  "permissions": [
    "android.permission.INTERNET"
  ]
}
```

This demonstrates that `inspect_manifest` is not coupled to the security
review agent.

### Other MCP clients

The same server can be consumed by other MCP-compatible clients, such as
Claude Code, by configuring the client to launch:

```text
node mcp/server.mjs
```

The exposed tool is:

```text
inspect_manifest
```

No server-side changes are required when switching MCP clients. Only the
client-side MCP configuration is different.

This portability is one of the reasons MCP is used in the project: the
deterministic Android inspection capability can be shared across different
agent and developer-tool environments without coupling the parser to a
specific client.

## Limitations and scope

The project intentionally starts narrow.

It currently focuses on `AndroidManifest.xml` and does not attempt to provide
complete Android application security analysis. It does not yet inspect source
code, dependency graphs, APK contents, runtime behavior, network traffic, or
external vulnerability databases.

The agent is also probabilistic by design. Deterministic fact extraction,
structured schemas, evals, and tool-use verification reduce risk, but they do
not make model reasoning deterministic.

The goal is not to build a complete Android vulnerability scanner immediately,
but to use a constrained security problem to explore reliable agentic software
engineering patterns incrementally.

## Planned exploration

- broader Android security inspection
- richer evidence collection
