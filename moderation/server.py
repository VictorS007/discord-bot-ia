"""
Serviço HTTP do Detoxify.

Além da mensagem isolada, avalia o transcript recente da conversa
(contexto) para pegar intenção tóxica espalhada em várias falas.
"""

from __future__ import annotations

import os

from flask import Flask, jsonify, request
from detoxify import Detoxify

MODEL_TYPE = os.environ.get("DETOXIFY_MODEL", "multilingual")
HOST = os.environ.get("DETOXIFY_HOST", "127.0.0.1")
PORT = int(os.environ.get("DETOXIFY_PORT", "8091"))
MAX_TRANSCRIPT_CHARS = int(os.environ.get("DETOXIFY_CONTEXT_MAX_CHARS", "2000"))

app = Flask(__name__)
model = Detoxify(MODEL_TYPE)


def as_score_map(raw: dict, index: int = 0) -> dict[str, float]:
    out: dict[str, float] = {}
    for label, value in raw.items():
        try:
            out[str(label)] = float(value[index])
        except (TypeError, IndexError, KeyError):
            out[str(label)] = float(value)
    return out


def speaker(role: str) -> str:
    return "Assistente" if role == "assistant" else "Usuario"


def build_transcript(context: list, current: str, current_role: str) -> str:
    lines: list[str] = []
    for item in context:
        if not isinstance(item, dict):
            continue
        content = str(item.get("content") or "").strip()
        if not content:
            continue
        lines.append(f"{speaker(str(item.get('role') or 'user'))}: {content}")
    if current:
        lines.append(f"{speaker(current_role)}: {current}")
    transcript = "\n".join(lines)
    if len(transcript) > MAX_TRANSCRIPT_CHARS:
        return transcript[-MAX_TRANSCRIPT_CHARS:]
    return transcript


@app.get("/health")
def health():
    return jsonify({"ok": True, "model": MODEL_TYPE})


@app.post("/moderate")
def moderate():
    body = request.get_json(silent=True) or {}
    text = str(body.get("text") or "").strip()
    current_role = str(body.get("role") or "user")
    context = body.get("context") if isinstance(body.get("context"), list) else []

    pieces = [text or " "]
    transcript = build_transcript(context, text, current_role) if context else None
    if transcript:
        pieces.append(transcript)

    raw = model.predict(pieces)
    payload = {"scores": as_score_map(raw, 0)}
    if transcript:
        payload["contextScores"] = as_score_map(raw, 1)

    return jsonify(payload)


if __name__ == "__main__":
    print(f"Detoxify ({MODEL_TYPE}) em http://{HOST}:{PORT}")
    app.run(host=HOST, port=PORT, threaded=True)
