# Art Wall - 部署指南

線上位址：<https://aliencat0528.github.io/art-wall/>

---

## 目錄

1. [快速部署](#1-快速部署)
2. [本地開發](#2-本地開發)
3. [發佈內容變更](#3-發佈內容變更)
4. [環境變數說明](#4-環境變數說明)
5. [故障排除](#5-故障排除)

---

## 1. 快速部署

平台為 **GitHub Pages**，來源設為 GitHub Actions（非 `gh-pages` 分支）。
**日常不需要手動部署** —— PR merge 進 `main` 即自動發佈。

### 前置需求

- 對 `aliencat0528/art-wall` 有 admin 權限（僅首次設定與變更 Pages 來源時需要）
- repo 為 public（Pages 免費方案的條件）

### 一次性設定（已完成，重建 repo 時才需要）

Settings → Pages → Source 選 **GitHub Actions**。等效的 CLI：

```bash
gh api -X POST repos/aliencat0528/art-wall/pages -f build_type=workflow
# 預期回應含：{"build_type":"workflow","html_url":"https://aliencat0528.github.io/art-wall/"}
```

### 部署流程

`.github/workflows/deploy.yml` 在下列時機觸發：

| 觸發 | 時機 |
|------|------|
| `push` to `main` | PR merge 後自動跑 |
| `workflow_dispatch` | 手動重跑（Actions 分頁按 Run workflow） |

工作流程為 `npm ci` → `npm run lint` → `npm run build` → 上傳 `dist/` → 部署。
**lint 或型別檢查沒過就不會部署**，等同把 commit 前的品質門檻搬到 CI 再擋一次。

### 驗證部署

```bash
gh run list --workflow=deploy.yml --limit 1
# 預期：status completed、conclusion success

curl -sI https://aliencat0528.github.io/art-wall/ | head -1
# 預期：HTTP/2 200
```

開啟網站後確認：作品牆有算繪出卡片（不是白畫面），點一件作品後網址出現 `?w=`，
重新整理該網址仍直接開在該作品的詳情頁。

---

## 2. 本地開發

與 README 的「快速開始」相同，不重複：見 [`../README.md`](../README.md#快速開始)。

本地開發伺服器的網址會帶上 `base`，即 `http://localhost:5173/art-wall/`。

### 同時開舊版本

要對照舊版而不動到目前的工作目錄，用 worktree 開第二份：

```bash
git worktree add ../art-wall-old <commit>
cd ../art-wall-old && npm install
npm run dev -- --port 5174     # 換 port 才能與現行版本並存
```

看完收掉：`git worktree remove ../art-wall-old`。
`node_modules` 不共用，每份 worktree 要各自 `npm install`。

---

## 3. 發佈內容變更

瀏覽器內的編輯（上傳作品、改敘述、改站台設定）只存在**該台瀏覽器**的
localStorage 與 IndexedDB，**訪客看不到**。要讓改動成為線上正式版本：

1. 編輯面板 → **匯出 JSON**，取得作品資料
2. 把資料寫進 `src/data/works.ts`（分類則改 `src/data/categories.ts`）
3. 開分支 → PR → merge 進 `main` → Actions 自動重新部署

沒有後端，這是目前唯一能讓改動對外生效的路徑。

---

## 4. 環境變數說明

**本專案沒有任何環境變數。** 純靜態 SPA，無後端、無 API 金鑰、無 `.env`。

唯一等同組態的設定是 `vite.config.ts` 的 `base`，其值必須等於
`/<repo 名稱>/`。**改 repo 名稱時這裡要跟著改**，否則資產路徑全數 404。

---

## 5. 故障排除

### Q: 網站開起來是白畫面，Console 顯示 JS／CSS 404

```bash
grep -n "base:" vite.config.ts
gh repo view --json name -q .name
```

解法：`base` 必須是 `/<repo 名稱>/`（前後都要有斜線）。兩者不一致時
`index.html` 會去要一個不存在的路徑。改完重跑一次 workflow。

### Q: deploy job 失敗，build job 卻是綠的

```bash
gh api repos/aliencat0528/art-wall/pages -q .build_type
# 預期：workflow
```

解法：回應不是 `workflow`（或整個 404）代表 Pages 來源沒設成 GitHub Actions，
依第 1 節的一次性設定重設。

### Q: CI 的 `npm ci` 失敗，但本機 `npm install` 正常

```bash
npm ci     # 在本機重現
```

解法：`npm ci` 嚴格依照 `package-lock.json`，與 `package.json` 不同步就會失敗。
本機跑一次 `npm install` 讓 lock 檔更新，並把 lock 檔一起 commit。

### Q: 本機 lint 過了，CI 的 lint 沒過

CI 用 Node 20，本機是 Node 18。解法：先確認不是 Node 版本差異造成的規則行為不同，
再依 CI 的訊息修。**不要為了讓 CI 過而升 ESLint** —— ESLint 10 需要 Node ^20.19，
本機 Node 18 會直接拋 `util.styleText is not a function`（見 `CLAUDE.md`）。

---

## 相關文件

- 架構、模組職責與資料流 → [`ARCHITECTURE.md`](ARCHITECTURE.md)
- 決策記錄 → [`../prepare.md`](../prepare.md)
