# Maze Portfolio — 領域知識索引

> **載入方式**：先讀此索引，再依需求載入對應檔案。不需要的不載入。

---

## 領域知識檔案

| 主題 | 檔案 | 何時載入 |
|------|------|---------|
| 迷宮生成、迷霧、BFS 尋路 | `@maze-algorithm.md` | 修改迷宮層 / 尋路時（Phase 1 建立） |
| 成就解鎖條件與進度儲存 | `@achievements.md` | 修改成就 / localStorage 時（Phase 2 建立） |

> 上述檔案隨對應 Phase 產出，尚未建立前不需載入。

---

## 快速判斷

- 修改 **迷宮 / 尋路 / 迷霧** → 載入 `@maze-algorithm.md`
- 修改 **成就 / 進度儲存** → 載入 `@achievements.md`
- 需要決策脈絡（為什麼這樣改） → 讀取 `@../../prepare.md`
- 需要架構全貌 → `@../../docs/ARCHITECTURE.md`（⚠️ 現與實作不符，以程式碼為準，見 MR-002 / MR-003）
