# Agentic Android Security Reviewer

An experimental AI-native security review agent for Android applications.

The project explores production-oriented agentic engineering in a security context: deterministic tool use, MCP integration, structured outputs, evidence-backed reasoning, behavioral evals, and explicit testing of agent behavior.

The current scope is deliberately small: analyze `AndroidManifest.xml` and produce structured security findings backed by manifest evidence.

## Architecture

The system separates deterministic fact extraction from probabilistic security reasoning.

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

The MCP server exposes deterministic Android manifest inspection as a reusable capability.

The parser is responsible for extracting facts such as:

- application security configuration
- requested permissions
- exported Android components
- component permissions
- intent filters
- deep-link data constraints

The agent reasons about those facts and produces structured findings with category, severity, classification, evidence, recommendation, and confidence.

This separation keeps deterministic work out of the language model and makes the system easier to test, evaluate, reuse, and debug.

## Why MCP?

The manifest parser does not inherently need MCP.

If the capability were used only inside this application, a local function tool would be simpler.

MCP is used here to explore a different architectural property: exposing deterministic Android security inspection through a standard protocol so that it is not coupled to one agent implementation.

```text
Security Review Agent ──┐
                        │
Codex / MCP client ─────┼──> Android Security MCP Server
                        │           ↓
Other MCP clients ──────┘     inspect_manifest
                                    ↓
                              parseManifest()
```

The current security review agent consumes the same `inspect_manifest` capability through MCP.

The MCP server can also be discovered and invoked independently by other MCP-compatible clients.

## Why an agent?

The goal is not to use an LLM to parse XML.

Deterministic code handles facts that can be extracted reliably. The agent is used where interpretation is required, for example:

- distinguishing normal configuration from security-relevant risk
- deciding when manifest evidence is insufficient
- assessing exported component exposure
- interpreting broad permissions
- reasoning about browsable deep-link surfaces

The agent is instructed to base findings on facts returned by the inspection tool rather than independently interpreting the manifest.

## Example

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

can produce a structured finding indicating that the externally reachable deep-link surface requires review.

The deterministic parser first establishes facts such as exported state, actions, categories, permissions, and URI constraints. The agent then performs the security reasoning.

## Testing and evals

The project deliberately separates deterministic tests from model-dependent evals.

### Unit and integration tests

```bash
npm test
```

Tests deterministic manifest parsing and the MCP server integration using Node's built-in test runner.

The MCP integration test verifies that:

- the MCP server starts successfully
- `inspect_manifest` is discoverable
- the tool can be invoked over MCP
- structured `ManifestFacts` are returned correctly

These tests run automatically in GitHub Actions.

### Behavioral evals

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

Behavioral evals protect against regressions when prompts, tools, transport mechanisms, or fact schemas change.

### Tool-use eval

```bash
npm run eval:tools
```

Verifies that the agent actually uses the `inspect_manifest` tool rather than bypassing the intended architecture.

This tests the agent workflow itself, not only the final answer.

### GitHub Actions

Deterministic tests run automatically on pushes and pull requests.

Model-dependent agent evals are intentionally separated into a manually triggered GitHub Actions workflow because they require an API key, incur model usage, and are probabilistic.

```text
push / pull request
        ↓
deterministic tests

manual Agent Evals workflow
        ↓
behavioral evals
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

One example emerged while adding intent-filter support.

After exposing actions and categories to the agent, the model correctly recognized a browsable deep-link surface but initially reasoned about missing URI constraints that were not yet represented in the tool output.

Instead of accepting that implicit XML interpretation, the fact model and parser were expanded to include intent-filter `<data>` elements.

This keeps conclusions traceable to tool-provided evidence.

A similar principle applies to the MCP integration: protocol and transport concerns are kept outside the deterministic parser. The MCP server acts as an adapter around the existing domain capability rather than moving parsing or security logic into the protocol layer.

## Current status

Implemented:

- Android manifest fact model
- deterministic XML parser
- structured security review output
- exported component analysis
- permission-related behavior
- intent-filter and deep-link facts
- MCP server exposing `inspect_manifest`
- OpenAI Agents SDK MCP client integration
- structured MCP tool output
- deterministic unit tests
- MCP integration test
- behavioral LLM evals
- tool-use eval
- GitHub Actions CI for deterministic tests
- manually triggered GitHub Actions workflow for agent evals

Planned exploration:

- tracing and failure analysis
- broader Android security inspection
- model/provider abstraction
- agent orchestration where justified by the problem

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

Run behavioral evals:

```bash
npm run eval
```

Run tool-use eval:

```bash
npm run eval:tools
```

Agent evals require an OpenAI API key configured through the environment.

## Inspecting the MCP server

The MCP server can be explored independently using the MCP Inspector.

Start the Inspector:

```bash
npx @modelcontextprotocol/inspector node mcp/server.mjs
```

The server exposes:

```text
inspect_manifest
```

The tool accepts an Android manifest document and returns structured `ManifestFacts`.

The available tools can also be inspected from the command line:

```bash
npx @modelcontextprotocol/inspector --cli \
  node mcp/server.mjs \
  --method tools/list
```

This demonstrates that the manifest inspection capability can be discovered independently of the security review agent.

## Project scope

The project intentionally starts narrow.

The goal is not to build a complete Android vulnerability scanner immediately, but to use a constrained security problem to explore reliable agentic software engineering patterns incrementally.