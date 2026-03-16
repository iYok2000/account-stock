# MCP Setup Guide

## MCP Servers ที่ใช้

| Server | Tools | สถานะ |
|--------|-------|-------|
| **TestSprite** | bootstrap, generate tests, run tests, etc. | ทำงานได้ |
| **mcp** | full, approve, research, review | ต้องเปิด workspace นี้ |

## การเปิดใช้งาน mcp-research

1. **เปิด workspace ให้ถูก**
   - ต้องเปิดโฟลเดอร์ `account-stock-fe` เป็น root ของ workspace
   - เพื่อให้ Cursor โหลด `.cursor/mcp.json`

2. **ตรวจสอบ .env**
   - มีไฟล์ `/Users/yokky/Documents/mcp-server/mcp-server/.env`
   - ต้องมี `OPENAI_API_KEY=...` (ใช้สำหรับ research, review)

3. **รีสตาร์ท Cursor** หลังแก้ mcp.json หรือ server

## ทดสอบ mcp server ด้วยตัวเอง

```bash
cd /Users/yokky/Documents/mcp-server/mcp-server/control
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | uv run python server.py
# ควรได้ {"jsonrpc":"2.0","id":1,"result":{...}}
```

## เคล็ดลับ

- ถ้าเห็นแค่ TestSprite tools → เช็ค Output panel หา log ของ "mcp" หรือ "mcp-control-plane"
- ถ้า mcp โหลดไม่สำเร็จ → มักเกิดจาก path ผิด หรือ OPENAI_API_KEY ไม่พบ
