from fastapi import FastAPI
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint
from google.adk.agents import LlmAgent
from google.adk.planners import BuiltInPlanner
from google.genai import types

# for AG-UI context extraction
from google.adk.agents.readonly_context import ReadonlyContext
from google.adk.agents.run_config import RunConfig, StreamingMode
from ag_ui.core.types import Context, RunAgentInput


def create_run_config(input: RunAgentInput) -> RunConfig:
    return RunConfig(
        streaming_mode=StreamingMode.SSE,
        save_input_blobs_as_artifacts=True,
        # embed input into the RunConfig so raw AG-UI input can be utilized
        # by the ADK where needed.
        custom_metadata={
            "ag-ui": input
        }
    )

with open("instructions.md", "r") as f:
    instructions_text = f.read()

def instructions(ctx: ReadonlyContext) -> str:
    if "{{CONTEXT}}" in instructions_text:
        context_content = ""

        # our AG-UI adapter will inject the input into
        # the custom metadata of the ADK's run config
        if ctx.run_config.custom_metadata:
            if "ag-ui" in ctx.run_config.custom_metadata:
                agui: RunAgentInput = ctx.run_config.custom_metadata["ag-ui"]
                if agui.context and len(agui.context) > 0:
                    for item in agui.context:
                        context_content += f" - {item.description}: {item.value}\n"

        return instructions_text.replace("{{CONTEXT}}", context_content)
    else:
        return instructions_text

agent = LlmAgent(
    name="aika",
    model="gemini-3-flash-preview",
    instruction=instructions,
    planner=BuiltInPlanner(
        thinking_config=types.ThinkingConfig(
            # includes summarized thoughts as outputs
            # doesn't work well w/ ag-ui and copilotkit (yet)
            include_thoughts=False, 
            thinking_level=types.ThinkingLevel.MINIMAL
        )
    )
)

adk_agent = ADKAgent(
    adk_agent=agent,
    app_name="aika",
    user_id="visitor",
    session_timeout_seconds=3600,
    use_in_memory_services=True,
    # custom factory to inject AG-UI input into the run config metadata
    run_config_factory=create_run_config, 
)

app = FastAPI()
add_adk_fastapi_endpoint(app, adk_agent, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)