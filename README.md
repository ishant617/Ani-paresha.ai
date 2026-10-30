# Agnipariksha.AI --- Sentinel CI

> **An AI Agent Reliability & Evaluation Platform for inspecting agent
> execution, tracking regressions, and demonstrating guardrail
> interventions.**

Agnipariksha.AI (Sentinel CI) is a web-based prototype for exploring how
AI-agent workflows can be evaluated and monitored. It brings execution
traces, evaluation views, regression tracking, failure classification,
analytics, and execution-history logging into one interface.

**Repository:**
[github.com/ishant617/Ani-paresha.ai](https://github.com/ishant617/Ani-paresha.ai)

## Table of Contents

-   [Overview](#overview)
-   [Core Capabilities](#core-capabilities)
-   [Architecture](#architecture)
-   [Technology Stack](#technology-stack)
-   [Repository Structure](#repository-structure)
-   [Getting Started](#getting-started)
-   [Running the Application](#running-the-application)
-   [API Reference](#api-reference)
-   [Current Implementation Notes](#current-implementation-notes)
-   [Security Notes](#security-notes)
-   [Roadmap](#roadmap)
-   [Author](#author)

## Overview

As AI agents become capable of calling tools and performing multi-step
tasks, it becomes important to understand their behaviour, identify
failures, and compare performance between versions.

Agnipariksha.AI explores this problem through an evaluation dashboard
and a trace-streaming backend. The project is a prototype and learning
platform for AI reliability engineering, LLM evaluation concepts, and
full-stack system development.

## Core Capabilities

-   **Agent evaluation workflow:** Submit a prompt to the backend and
    start an execution run.
-   **Live execution traces:** Stream structured execution events to the
    frontend through WebSockets.
-   **Trace debugging:** Inspect event steps and related execution
    information.
-   **Regression tracking:** Compare evaluation runs or release
    candidates across task categories through the regression interface.
-   **Failure classification:** Organize and inspect failure categories
    through the failure-classifier interface.
-   **Evaluation scorecards and analytics:** Present evaluation
    summaries and visual analytics.
-   **Guardrail demonstration:** The current simulated runner checks
    selected destructive-action keywords and emits a
    guardrail-interception event when a match is found.
-   **Execution logging:** The backend schedules execution-summary
    logging through its Supabase integration.

> The exact behaviour and data available in each dashboard module depend
> on the current implementation and configured services. Demonstration
> data should not be interpreted as independently validated
> model-quality measurements.

## Architecture

The project has a React/TypeScript interface, a Node/TypeScript
application server, and a separate Python FastAPI trace API.

``` mermaid
flowchart TD
    U[User] --> UI[React + TypeScript Dashboard]
    UI --> APP[Node / TypeScript Server]
    UI -->|POST /api/v1/evaluate| API[Python FastAPI Trace API]
    API --> RUN[Simulated Agent Runner]
    RUN -->|Structured trace events| WS[WebSocket Connection Manager]
    WS -->|/ws/trace/{run_id}| UI
    API --> LOG[Execution Summary Logger]
    LOG --> DB[(Supabase)]
    UI --> MOD[Evaluation, Regression, Failure & Analytics Views]
```

### Execution flow

1.  A user starts an evaluation from the dashboard.
2.  The frontend sends a prompt to `POST /api/v1/evaluate`.
3.  The FastAPI backend creates or accepts a run ID and starts an
    asynchronous execution task.
4.  The runner emits structured events such as `thought`, `tool_call`,
    `guardrail_intercept`, and `final_response`.
5.  The WebSocket manager broadcasts those events to clients subscribed
    to that run ID.
6.  The backend creates an execution summary and schedules logging
    through the Supabase logger.

## Technology Stack

  -----------------------------------------------------------------------
  Area                                Technologies
  ----------------------------------- -----------------------------------
  Frontend                            React 19, TypeScript, Vite

  UI and visualization                Tailwind CSS, Recharts, Lucide
                                      React, Motion

  Application server                  Node.js, TypeScript, Express, `tsx`

  Trace API                           Python, FastAPI, Uvicorn, Pydantic

  Real-time communication             WebSockets

  Data and persistence integrations   Supabase, PostgreSQL-related
                                      packages, Firebase

  Database tooling                    Drizzle ORM / Drizzle Kit

  Build tooling                       Vite, esbuild, TypeScript
  -----------------------------------------------------------------------

## Repository Structure

The repository is currently organized primarily as a root-level
application:

``` text
Ani-paresha.ai/
├── App.tsx
├── main.tsx
├── index.ts
├── index.html
├── index.css
├── server.ts
├── main.py
├── agent_runner.py
├── connection_manager.py
├── db_logger.py
├── package.json
├── package-lock.json
├── requirements.txt
├── .env.example
├── firebase.ts
├── firebase-admin.ts
├── db.ts
├── schema.ts
├── types.ts
├── RegressionTracker.tsx
├── TraceDebugger.tsx
├── FailureClassifier.tsx
├── Scorecard.tsx
├── VisualAnalytics.tsx
├── RunEvaluationModal.tsx
├── CanarySimulationModal.tsx
├── ScenarioGenerationEngine.tsx
└── ...
```

## Getting Started

### Prerequisites

-   Node.js and npm
-   Python 3.10 or later
-   Git

### 1. Clone the repository

``` bash
git clone https://github.com/ishant617/Ani-paresha.ai.git
cd Ani-paresha.ai
```

### 2. Install frontend and Node server dependencies

``` bash
npm install
```

### 3. Install Python API dependencies

**Windows PowerShell:**

``` powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS / Linux:**

``` bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a local `.env` file from the example:

``` bash
cp .env.example .env
```

On Windows PowerShell:

``` powershell
Copy-Item .env.example .env
```

Review `.env.example` and configure the values required by the services
you enable. The checked-in example documents `GEMINI_API_KEY` and
`APP_URL`. Configure any Supabase or Firebase credentials according to
the relevant integration and deployment setup.

**Never commit real API keys, service-account files, database passwords,
or private credentials.**

## Running the Application

Run the Node/TypeScript application and Python API in separate
terminals.

### Terminal 1 --- Node/TypeScript application

``` bash
npm run dev
```

The repository's `dev` script starts `server.ts` using `tsx`. Check the
terminal output for the local application URL and port.

### Terminal 2 --- Python FastAPI trace API

Activate the Python virtual environment, then run:

``` bash
python main.py
```

The FastAPI application is configured to listen at:

``` text
http://localhost:8000
```

Interactive API documentation is normally available at:

``` text
http://localhost:8000/docs
```

### Production build

``` bash
npm run build
npm start
```

The build script creates the Vite frontend build and bundles the
TypeScript server. The Python FastAPI service is a separate process and
must be deployed or started separately.

## API Reference

### Start an evaluation

**Endpoint:** `POST /api/v1/evaluate`

**Request body:**

``` json
{
  "prompt": "Summarize the requested records",
  "run_id": "optional-run-identifier"
}
```

`run_id` is optional. If omitted, the API generates a UUID.

**Example response:**

``` json
{
  "status": "Execution started",
  "run_id": "generated-or-provided-run-id"
}
```

The endpoint returns immediately while the execution task runs
asynchronously.

### Subscribe to execution traces

**WebSocket endpoint:**

``` text
ws://localhost:8000/ws/trace/{run_id}
```

Replace `{run_id}` with the ID returned by the evaluation endpoint. The
backend broadcasts structured trace events to connected clients for that
run.

### Example event shape

``` json
{
  "step": "tool_call",
  "content": "Executing search_db with extracted parameters.",
  "tool": "search_db",
  "timestamp": 1730000000.0
}
```

Fields can vary by event type; for example, a guardrail event can
include a `reason` field.

## Current Implementation Notes

This section distinguishes implemented prototype behaviour from future
research or production goals.

-   The current Python `agent_runner.py` implements a **simulated
    asynchronous agent execution sequence**. It emits demonstration
    events rather than invoking a complete external autonomous LLM
    agent.
-   The guardrail demonstration checks a small list of
    destructive-action keywords, including `drop table`, `rm -rf`,
    `delete user`, and `truncate`. This is not a comprehensive security
    filter.
-   The execution summary currently assigns a demonstration token count.
    Treat it as mock/demo data, not measured model usage.
-   The repository contains Gemini-related dependencies and environment
    configuration; the presence of an API key or SDK does not by itself
    mean every evaluation path invokes a live Gemini model.
-   Regression, scorecard, and analytics screens should be evaluated
    against their actual configured data sources before using their
    outputs as research results.

These limitations are documented so users and reviewers can distinguish
the current prototype from planned capabilities.

## Security Notes

-   Keep `.env` files and credentials out of version control.
-   Restrict CORS origins before production deployment. The current
    FastAPI source uses a permissive development CORS configuration.
-   Add authentication and authorization before exposing evaluation or
    trace endpoints publicly.
-   Treat prompts, tool outputs, and trace contents as potentially
    sensitive data.
-   Validate and sanitize all inputs before connecting the platform to
    real tools or databases.
-   Do not use the demonstration keyword guardrail as the only
    protection for destructive operations.

## Roadmap

Potential areas for further development:

-   Connect the evaluation pipeline to real LLM agents and tool
    executions.
-   Add repeatable benchmark datasets and documented evaluation
    protocols.
-   Measure task success, latency, token usage, and failure rates from
    actual runs.
-   Expand regression testing with configurable thresholds and
    reproducible comparisons.
-   Improve guardrails using structured policy checks and explicit human
    approval for high-impact actions.
-   Add authentication, role-based access, and stricter API security.
-   Add automated tests and CI checks for the frontend and backend.
-   Document deployment configuration and operational monitoring.

## Author

**Ishant Thawari**

B.Tech --- Artificial Intelligence & Machine Learning

-   GitHub: [@ishant617](https://github.com/ishant617)
-   Project: [Agnipariksha.AI ---
    Ani-paresha.ai](https://github.com/ishant617/Ani-paresha.ai)

------------------------------------------------------------------------

If you find this project useful, consider giving the repository a ⭐.
