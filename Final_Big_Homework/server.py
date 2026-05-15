import json
import os
import re
from typing import Any

import requests
from flask import Flask, jsonify, request

try:
    from flask_cors import CORS
except ImportError:
    CORS = None


ALLOWED_RISK_AWARENESS = {"警惕型", "犹豫型", "轻信型"}
DEFAULT_TIMEOUT_SECONDS = 20

app = Flask(__name__)
if CORS is not None:
    CORS(app)


@app.after_request
def add_cors_headers(response):
    response.headers.setdefault("Access-Control-Allow-Origin", "*")
    response.headers.setdefault("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.setdefault("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    return response


def build_system_prompt() -> str:
    return (
        "你是一个面向大学生的反诈辅助系统。你有两个任务：\n"
        "任务一：针对当前骗局场景回答用户问题，语言清晰、直接、适合课程展示，"
        "回复不宜过长，优先指出风险点与正确处理方式。\n"
        "任务二：结合当前场景、用户输入内容、用户此前剧情选择，对用户风险意识分类。"
        "分类标签只能是：警惕型、犹豫型、轻信型。\n\n"
        "场景 scholarship_sms 背景：用户收到“奖学金补录通知”，短信声称需要24小时内"
        "点击陌生链接完成资格确认，否则视为放弃。后续网页可能要求填写姓名、学号、"
        "身份证号、银行卡号、验证码等敏感信息。回答时关注陌生链接、可疑域名、"
        "限时处理话术、不要填写敏感信息、通过学校官网/辅导员/教务平台核实。\n\n"
        "场景 campus_payment_help 背景：用户在校园路边被陌生人拦下，对方称支付异常、"
        "手机出问题，希望用户扫码付款或代付小额费用，之后再转回。回答时关注："
        "陌生求助不一定全是诈骗，但涉及金钱交易应警惕；小额代付会利用同情心；"
        "对方身份难核实；更安全方式是带去保卫处、服务台、值班点或找老师；"
        "如果对方拒绝官方帮助、只坚持要钱，应提高警惕。\n\n"
        "场景 bike_qr_sticker 背景：用户在校园共享单车区域发现车把附近贴着可疑二维码"
        "或小广告，声称扫码福利、资源入口等。回答时关注：来源不明、没有官方标识；"
        "可能引流到不安全页面、诱导下载不明 App、进入赌博/充值/虚假交友/信息收集链条；"
        "最稳妥做法是不扫、不点、不下载，可拍照留存并向校园管理人员或平台反馈；"
        "如果已经扫码进入异常页面，应立即退出，不提交信息、不下载文件。\n\n"
        "你最终必须只输出 JSON，不要输出 Markdown，不要输出额外解释。"
        "JSON 字段固定为：reply、riskAwareness、riskReason。"
        "reply 用简洁中文，建议80到180字；riskReason 用一句中文，建议25到60字。"
    )


def build_user_prompt(data: dict[str, Any]) -> str:
    return json.dumps(
        {
            "scenario": data.get("scenario") or "scholarship_sms",
            "userText": data.get("userText") or "",
            "firstChoice": data.get("firstChoice"),
            "secondChoice": data.get("secondChoice"),
            "gate2Choice": data.get("gate2Choice"),
            "gate3Choice": data.get("gate3Choice"),
            "currentRiskAwareness": data.get("currentRiskAwareness"),
            "outputFormat": {
                "reply": "中文反诈回复",
                "riskAwareness": "警惕型 / 犹豫型 / 轻信型",
                "riskReason": "一句分类理由",
            },
        },
        ensure_ascii=False,
    )


def extract_json_object(text: str) -> dict[str, Any] | None:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    candidates = [cleaned]
    match = re.search(r"\{.*\}", cleaned, re.S)
    if match:
        candidates.append(match.group(0))

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed

    return None


def normalize_model_result(result: dict[str, Any]) -> dict[str, str] | None:
    reply = result.get("reply")
    risk_awareness = result.get("riskAwareness")
    risk_reason = result.get("riskReason")

    if not isinstance(reply, str) or not reply.strip():
        return None

    if risk_awareness not in ALLOWED_RISK_AWARENESS:
        risk_awareness = "犹豫型"

    if not isinstance(risk_reason, str) or not risk_reason.strip():
        risk_reason = "模型未给出明确依据，默认按需要继续核实的状态处理。"

    return {
        "reply": reply.strip(),
        "riskAwareness": risk_awareness,
        "riskReason": risk_reason.strip(),
    }


def call_openai_compatible_api(data: dict[str, Any]) -> dict[str, str]:
    base_url = (os.getenv("LLM_BASE_URL") or "").rstrip("/")
    api_key = os.getenv("LLM_API_KEY") or ""
    model = os.getenv("LLM_MODEL") or ""

    if not base_url or not model:
        raise RuntimeError("LLM_BASE_URL and LLM_MODEL are required for real AI mode.")

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    response = requests.post(
        f"{base_url}/chat/completions",
        headers=headers,
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": build_system_prompt()},
                {"role": "user", "content": build_user_prompt(data)},
            ],
            "temperature": 0.2,
        },
        timeout=DEFAULT_TIMEOUT_SECONDS,
    )
    response.raise_for_status()

    payload = response.json()
    content = payload["choices"][0]["message"]["content"]
    parsed = extract_json_object(content)
    if parsed is None:
        raise ValueError("LLM response is not valid JSON.")

    normalized = normalize_model_result(parsed)
    if normalized is None:
        raise ValueError("LLM response JSON is missing required fields.")

    return normalized


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


@app.post("/api/anti-fraud-chat")
def anti_fraud_chat():
    data = request.get_json(silent=True) or {}
    user_text = data.get("userText")
    scenario = data.get("scenario")

    if not isinstance(user_text, str) or not user_text.strip():
        return jsonify({"error": "userText is required"}), 400

    if scenario not in {"scholarship_sms", "campus_payment_help", "bike_qr_sticker"}:
        return jsonify({"error": "scenario is invalid"}), 400

    try:
        return jsonify(call_openai_compatible_api(data))
    except requests.RequestException as exc:
        return jsonify({"error": "LLM request failed", "detail": str(exc)}), 502
    except (KeyError, ValueError, RuntimeError) as exc:
        return jsonify({"error": "LLM response failed", "detail": str(exc)}), 502
    except Exception as exc:
        return jsonify({"error": "Unexpected server error", "detail": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
