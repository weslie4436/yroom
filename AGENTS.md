# YRoom — 代理進場須知

YRoom 是 **私人觀看** 的 Fami Pages 門面：GitHub Pages 靜態殼 → `config.js` 的 `VAULT_ORIGIN` 隧道 → 家裡 YRoom 保險庫。內容與鑰匙不得上公開 Pages。

## 隔離是最高優先（Weslie）

**其他 Fami 門（Famiphoto、FamiBook、Kodohon、GamePal 等）因 bug 絕不可誤連、誤讀 YRoom 內容。**

以下必須 **硬隔離**，不得與其他 Fami app 共用或混用：

| 層 | YRoom 現況 | 禁止 |
|---|---|---|
| **Gate 模組** | `window.YRoomGate`（本 repo `gate.js`） | 引入共用 `FamiGate`、從其他門複製 gate 核心、把 `YRoomGate` 改名成通用 Fami 名稱 |
| **Vault 來源** | `config.js` → `window.VAULT_ORIGIN`（YRoom 專用隧道） | 沿用其他門的 `VAULT_ORIGIN`、共用 origin 解析邏輯到跨 app 模組 |
| **Auth / 鑰匙** | 個人觀看鑰匙 `yroom.viewKey`、邀請碼 gate、`/api/gate` 等 YRoom API | 讀寫其他門的 token／cookie 前綴、共用 auth 儲存 |
| **Storage 鍵** | 一律 `yroom.*` 前綴（見下表） | `fami.*`、`famiphoto.*`、`mybook.*` 等兄弟 app 前綴；共用 localStorage 抽象層 |
| **Vault 資料** | YRoom 保險庫 API 與媒體 | 假設與書櫃／相簿 vault 互通；跨產品 catalog 合併 |

允許的「共用」**僅限無狀態 UI 詞彙對齊**（返回、確認、找卡、操作卡、齒輪、首頁頭、等待語言等），對照 skill **`fami-shared-ui`** 詞彙表。對齊的是 **外觀與叫法**，不是 gate、auth、storage、vault 實作。

## 儲存鍵（勿改前綴、勿與他門合併）

| 鍵 | 用途 | 儲存 |
|---|---|---|
| `yroom.viewKey` | 個人觀看鑰匙 | localStorage + cookie |
| `yroom.installed` | 已加入主畫面 | localStorage |
| `yroom.layout` | 格／列表 | localStorage |
| `yroom.gateLock` | 邀請碼鎖定 | localStorage |
| `yroom.gateOk` | 本 session 已過 gate | sessionStorage |
| `yroom.reading` | 閱讀／播放中狀態 | sessionStorage |
| `yroom-thumbs-v1` | 縮圖 Cache API | caches |

新增鍵必須維持 `yroom.` 或 `yroom-` 命名空間，並在 PR 說明為何不能誤讀他門資料。

## 架構速覽

```
index.html / hey.html  →  gate.js (YRoomGate)  →  VAULT_ORIGIN (config.js)
                              ↓
                         app.js / watch.js / read.html（產品 UI；鑰匙仍走 yroom.*）
```

- **入口**：GitHub Pages（桌機／iPad／iPhone 同一網址）。禁止把 exe／bat 當交付入口。
- **隧道**：僅 `config.js` 的 `VAULT_ORIGIN`；換隧道只改此檔並提高 `?v=`。
- **產品標誌與色票**：YRoom 自有；「專案色」只改本 repo 的 `:root`，不動其他門。

## 與其他 Fami 門的差異

| | 可共用門（書／相簿等） | **YRoom（本 repo）** |
|---|---|---|
| Gate | 傾向單一 FamiGate 核心 | **獨立 YRoomGate，不併入共用核心** |
| Auth / storage | 可共用模式 | **硬隔離** |
| UI 殼 | fami-shared-ui 標準版 | 詞彙對齊即可；功能可少（例如無「家人」），但不可閹割標準門面件 |

參考 Famiphoto 的「能共用的物件 100% 共用」**不適用於** YRoom 的 auth／origin／storage／vault；僅適用 UI 詞彙層。

## 代理開工前

1. 讀本檔、**`.cursor/rules/always-push-github.mdc`**（硬規則、always-on）與 `.cursor/rules/yroom-isolation.mdc`。
2. 若動到畫面元件，讀 **`fami-shared-ui`**（只取詞彙與視覺慣例，不複製 gate／storage）。
3. 若動 Pages／隧道／三端表面，讀 **`ios-home-web`**。
4. 確認改動不會讓他門讀寫 `yroom.*` 或連到 YRoom vault。
5. 會上 GitHub Pages 的門面檔：驗證後 **commit + push `main`**，提高 `?v=`。**禁止只留本機**；不要問「要不要推」。Pages：https://weslie4436.github.io/yroom/

## Wave1 範圍提醒

僅新增／更新 **AGENTS.md 與 Cursor rules** 時，不得順手改 `gate.js`、`hey.html`、`app.js`、`app.css` 或任何執行期行為，除非使用者明確要求功能變更。
