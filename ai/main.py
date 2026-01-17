from fastapi import FastAPI
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint
from google.adk.agents import LlmAgent
from google.adk.planners import BuiltInPlanner
from google.genai import types

agent = LlmAgent(
    name="assistant",
    # model="gemini-2.5-flash",
    model="gemini-3-flash-preview",
    instruction="Be helpful and fun!",
    planner=BuiltInPlanner(
        thinking_config=types.ThinkingConfig(
            # includes summarized thoughts as outputs
            # doesn't work well w/ ag-ui and copilotkit
            include_thoughts=False, 
            thinking_level=types.ThinkingLevel.MINIMAL
            # thinking_budget=1024,   
        )
    )
)

adk_agent = ADKAgent(
    adk_agent=agent,
    app_name="demo_app",
    user_id="demo_user",
    session_timeout_seconds=3600,
    use_in_memory_services=True
)

app = FastAPI()
add_adk_fastapi_endpoint(app, adk_agent, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)