
import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)

def analyze_incident(logs):
    prompt = f"""
    You are an AI Production Incident Investigator.

    Analyze these production logs:

    {logs}

    Provide:
    1. Incident Summary
    2. Possible Root Cause
    3. Evidence from Logs
    4. Suggested Fixes

    Do not claim a root cause is confirmed without sufficient evidence.
    """

    response = llm.invoke(prompt)
    return response.content

