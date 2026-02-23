---
name: add-external-skills
description: Adds curated external skills from GitHub into Cursor via AI DevKit. Use when the user wants to install frontend-design, tailwindcss-advanced-layouts, next-best-practices, marketing-psychology, or seo-content-brief in Cursor.
---

# Add External Skills (Cursor)

Install curated skills into **Cursor** using **AI DevKit**. Skills are symlinked into `.cursor/skills/`. Requires Node.js and network.

## One-time setup

Run once in the project root (may be interactive):

```bash
npx ai-devkit init -e cursor
```

Answer the prompts (or select phases). This creates `.ai-devkit.json` and prepares `.cursor/skills/`.

## Install skills

AI DevKit only installs repos that are in its **registry**. These work:

**Frontend design** (Anthropic):
```bash
npx ai-devkit skill add anthropics/skills frontend-design
```

**Next.js best practices** (Vercel):
```bash
npx ai-devkit skill add vercel-labs/next-skills next-best-practices
```

**Marketing psychology**:
```bash
npx ai-devkit skill add coreyhaines31/marketingskills marketing-psychology
```

**Not in AI DevKit registry** (Registry not found — use manual install if needed):

- **tailwindcss-advanced-layouts** — `josiahsiegel/claude-plugin-marketplace`
- **seo-content-brief** — `inference-sh-4/skills`

For those two: clone the repo and copy the skill folder (e.g. the folder containing `SKILL.md`) into `.cursor/skills/<skill-name>/`.

## When to suggest which skill

| User need | Skill to add |
|-----------|--------------|
| UI/UX, design systems, frontend patterns | frontend-design |
| Tailwind layouts, responsive, components | tailwindcss-advanced-layouts |
| Next.js app/router, performance, patterns | next-best-practices |
| Copy, persuasion, marketing angles | marketing-psychology |
| SEO briefs, content outlines, search intent | seo-content-brief |

## Workflow

1. If `.ai-devkit.json` is missing, run `npx ai-devkit init -e cursor` (user may need to complete prompts in terminal).
2. Run the matching `npx ai-devkit skill add <repo> <skill-name>` for each requested skill.
3. If a command fails, suggest the user run it in their terminal with Node.js and network available.

## How to use installed skills in Cursor

- **ไม่ต้องพิมพ์ @ หรือชื่อสกิล** — เปิด Agent (Cmd+I / Ctrl+I) แล้วพิมพ์คำขอเป็นประโยคปกติ
- **Agent เลือกสกิลเอง** — ถ้าคำขอตรงกับ `description` ใน SKILL.md ของสกิลใด Cursor จะโหลดสกิลนั้นให้อัตโนมัติ (Dynamic Context Discovery)
- **ดูสกิลที่มี**: Settings (Cmd+Shift+J) → Rules → ส่วน Agent Decides

**ตัวอย่างคำขอให้ตรงสกิล:**
- frontend-design: "ออกแบบ landing page ให้สวย ไม่ generic" / "สร้าง React component หน้า dashboard โทน minimal"
- next-best-practices: "ทำ loading state ใน Next.js ยังไง" / "ใช้ Server Components กับ client ยังไง"
- marketing-psychology: "อธิบาย mental model เรื่อง persuasion" / "ทำไมคนถึงซื้อ จิตวิทยาการตลาด"

## How to verify a skill was used

- **ดูจากคำตอบ**: สกิลมีแนวทางชัดเจนใน SKILL.md ถ้า Agent ใช้ สกิล คำตอบจะสอดคล้องกับแนวทางนั้น (เช่น frontend-design จะหลีกเลี่ยง Inter/purple gradient, มี aesthetic direction; marketing-psychology จะอ้างอิง First Principles, Jobs to Be Done ฯลฯ)
- **ลองถามซ้ำแบบเจาะจง**: เช่น "ใช้แนวทางจาก frontend-design skill ทำหน้านี้" แล้วเปรียบเทียบผลลัพธ์กับเนื้อใน `.cursor/skills/frontend-design/SKILL.md`

## Notes

- **Cursor**: use `npx ai-devkit skill add <owner/repo> <skill-name>`. Only repos in AI DevKit's registry work; others show "Registry not found".
- **Codex**: `npx skills add <github-url> --skill <name>` installs to `$CODEX_HOME/skills`.
