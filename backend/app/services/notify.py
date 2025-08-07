# backend/app/services/notify.py
import os, httpx

SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK_URL")


async def post_slack(issue: dict) -> None:
    """이슈 dict를 Slack Webhook 으로 전송 (에러 나더라도 예외 전파 X)"""
    if not SLACK_WEBHOOK:
        return

    # 메시지 포맷
    lines = [f"*{issue['title']}*  (Severity: {issue['severity']})"]
    for role, tasks in issue["tasks"].items():
        if tasks:
            lines.append(f"*{role}*")
            lines.extend([f"• {t}" for t in tasks])

    # 완전 비동기 전송
    async with httpx.AsyncClient(timeout=5) as client:
        try:
            await client.post(SLACK_WEBHOOK, json={"text": "\n".join(lines)})
        except Exception:
            # Slack 실패해도 API 자체는 200을 주게 하려면 예외를 삼키거나 로그만 남김
            pass
