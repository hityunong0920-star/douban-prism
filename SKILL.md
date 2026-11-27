---
name: douban-lens-exporter
description: Guide an AI coding agent with browser control (Antigravity / Claude Code / Codex) to safely export a user's Douban movies, books, games, and music records into DoubanLens standard CSV format.
---

# DoubanLens Exporter Skill

Use this skill when the user asks you to export their Douban (豆瓣) personal records (or a friend's public profile) for **DoubanLens（豆瓣棱镜）**.

## Why Browser-Assisted Export?

Douban blocks headless datacenter crawlers and unauthenticated scraping. Using the user's real, logged-in browser session at a gentle human-like pace avoids anti-bot triggers and respects user privacy (data stays 100% local).

## Step-by-Step Procedure

1. **Open Douban in the browser**:
   - Navigate to `https://www.douban.com/`.
   - If the user is not logged in, pause and ask the user to log in manually (QR code / password / CAPTCHA). **Never attempt to bypass CAPTCHAs.**
   - Obtain the user's profile ID (`<uid>`) from their "我的豆瓣" link (`/people/<uid>/`).

2. **Target Lists to Export**:
   - **电影**：`movie.douban.com/people/<uid>/collect` (看过), `do` (在看), `wish` (想看)
   - **读书**：`book.douban.com/people/<uid>/collect` (读过), `do` (在读), `wish` (想读)
   - **音乐**：`music.douban.com/people/<uid>/collect` (听过), `do` (在听), `wish` (想听)
   - **游戏**：`www.douban.com/people/<uid>/games?action=collect` (玩过), `do` (在玩), `wish` (想玩)

3. **Gentle Pacing & Extraction**:
   - Read each page's DOM inside the logged-in browser session (with 1–2 seconds delay between pages).
   - If Douban shows a login prompt or verification check, pause and ask the user to complete it in the browser.
   - Extract 8 fields per item: `分类`, `状态`, `标题`, `评分`, `标记日期`, `标签`, `短评`, `链接`.

4. **Output Standard CSV (UTF-8 with BOM)**:
   Save as `豆瓣记录_<用户名>.csv` with the exact header:

   ```csv
   分类,状态,标题,评分,标记日期,标签,短评,链接
   电影,看过,2001太空漫游 / 2001: A Space Odyssey,5星,2026-11-24,,服化道让人惊叹,https://movie.douban.com/subject/1292226/
   ```

   Field rules:
   - `分类`: `电影` | `读书` | `游戏` | `音乐`
   - `状态`: `看过`/`在看`/`想看` | `读过`/`在读`/`想读` | `玩过`/`在玩`/`想玩` | `听过`/`在听`/`想听`
   - `评分`: `5星` | `4星` | `3星` | `2星` | `1星` | `未评分`
   - `标记日期`: `YYYY-MM-DD`
   - `链接`: Full subject/game URL (used by DoubanLens for exact matching in **Taste Clash**)

5. **Done**:
   Tell the user where the CSV was saved and remind them to drag & drop it into **DoubanLens**.
