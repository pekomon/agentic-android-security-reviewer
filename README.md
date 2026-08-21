# Agentic Android Security Reviewer

An experimental AI-native security review agent for Android applications.

The project explores production-oriented agentic engineering in a security context: deterministic tool use, structured outputs, evidence-backed reasoning, behavioral evals, and explicit testing of agent behavior.

The current scope is deliberately small: analyze `AndroidManifest.xml` and produce structured security findings backed by manifest evidence.

## Architecture

The system separates deterministic fact extraction from probabilistic security reasoning.

```text
AndroidManifest.xml
        ↓
inspect_manifest tool
        ↓
deterministic XML parser
        ↓
ManifestFacts
        ↓
security reasoning agent
        ↓
structured SecurityReview
```

The parser is responsible for extracting facts such as:

- application security configuration
- requested permissions
- exported Android components
- component permissions
- intent filters
- deep-link data constraints

The agent reasons about those facts and produces structured findings with category, severity, classification, evidence, recommendation, and confidence.

This separation keeps deterministic work out of the language model and makes the system easier to test, evaluate, and debug.

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

### Unit tests

```bash
npm test
```

Tests deterministic manifest parsing using Node's built-in test runner.

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

Behavioral evals protect against regressions when prompts, tools, or fact schemas change.

### Tool-use eval

```bash
npm run eval:tools
```

Verifies that the agent actually uses the `inspect_manifest` tool rather than bypassing the intended architecture.

This tests the agent workflow itself, not only the final answer.

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

## Current status

Implemented:

- Android manifest fact model
- deterministic XML parser
- OpenAI Agents SDK function tool
- structured security review output
- exported component analysis
- permission-related behavior
- intent-filter and deep-link facts
- deterministic unit tests
- behavioral LLM evals
- tool-use eval
- GitHub Actions CI for deterministic tests

Planned exploration:

- tracing and failure analysis
- MCP-based tool integration
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

## Project scope

The project intentionally starts narrow.

The goal is not to build a complete Android vulnerability scanner immediately, but to use a constrained security problem to explore reliable agentic software engineering patterns incrementally.