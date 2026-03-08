import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel
from groq import Groq
import anthropic
from openai import OpenAI
from huggingface_hub import InferenceClient

from database import SessionLocal, User

app = FastAPI()

# ==============================
# 📦 Request Model
# ==============================
class Query(BaseModel):
    text: str
    provider: str = "auto"
    user_id: str = "default_user"

# ==============================
# 🔑 Setup AI Clients
# ==============================
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
claude_client = anthropic.Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
huggingface_client = InferenceClient(api_key=os.getenv("HUGGINGFACE_API_KEY"))

# ==============================
# 📊 Plan Configuration
# ==============================
PLAN_LIMITS = {
    "free": 5,
    "pro": 10000
}

PLAN_PROVIDERS = {
    "free": ["groq"],, "huggingface"
    "pro": ["groq", "openai", "claude"]
}

# ==============================
# 👤 Get User Info
# ==============================
@app.get("/user/{telegram_id}")
def get_user(telegram_id: str):
    db = SessionLocal()
    user = db.query(User).filter(User.telegram_id == telegram_id).first()

    if not user:
        return {"message": "User not found."}

    limit = PLAN_LIMITS.get(user.plan, 5)

    return {
        "plan": user.plan,
        "usage": user.usage,
        "limit": limit
    }

# ==============================
# 🔄 Update Plan (Stripe Webhook)
# ==============================
@app.post("/update-plan")
def update_plan(data: dict):
    db = SessionLocal()
    user = db.query(User).filter(User.telegram_id == data["telegram_id"]).first()

    if user:
        user.plan = data["plan"]
        db.commit()

    return {"status": "updated"}

# ==============================
# 🤖 Main AI Endpoint
# ==============================
@app.post("/ask")
def ask_ai(query: Query):

    db = SessionLocal()

    # 🔹 Get or Create User
    user = db.query(User).filter(User.telegram_id == query.user_id).first()

    if not user:
        user = User(
            telegram_id=query.user_id,
            plan="free",
            usage=0
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    plan = user.plan

    # 🔹 Check Usage Limit
    if user.usage >= PLAN_LIMITS.get(plan, 5):
        return {"reply": "Usage limit reached. Please upgrade your plan."}

    # 🔹 Increase Usage
    user.usage += 1
    db.commit()

    # 🔹 Decide Providers
    if query.provider == "auto":
        providers = PLAN_PROVIDERS.get(plan, ["groq"])
    else:
        providers = [query.provider]

    # 🔹 Fallback Loop
    for provider in providers:
        try:

            if provider == "groq":
                response = groq_client.chat.completions.create(
                    model="moonshotai/kimi-k2-instruct-0905",
                    messages=[
                        {"role": "system", "content": "You are QueClaw AI assistant."},
                        {"role": "user", "content": query.text}
                    ],
                )
                return {"reply": response.choices[0].message.content}

            if provider == "openai":
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are QueClaw AI assistant."},
                        {"role": "user", "content": query.text}
                    ]
                )
                return {"reply": response.choices[0].message.content}

            if provider == "claude":
                response = claude_client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=1000,
                    messages=[{"role": "user", "content": query.text}]
                )
                return {"reply": response.content[0].text}

            if provider == "huggingface":
                response = huggingface_client.text_generation(
                    query.text,
                    model="meta-llama/Llama-2-7b-chat-hf",
                    max_new_tokens=500,
                    temperature=0.7
                )
                return {"reply": response}

        except Exception:
            continue

    return {"reply": "All AI providers failed."}