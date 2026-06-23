# 泰山職訓前端班期中作業 - LINE 查詢助手機器人 🤖

本專案為一個整合「全國公廁定位與篩選」以及「台北市行人專用清潔箱（垃圾桶）」的即時定位查詢 LINE 機器人。本專案完全符合課程作業規範，所有數據皆透過即時 API 請求獲取。

---

## 📝 作業繳交資訊

| 項目 | 內容連結 / 資訊 |
| :--- | :--- |
| **GitHub 專案儲存庫** | [點此前往您的 GitHub 儲存庫](https://github.com/您的GitHub帳號/您的專案名稱) *(請修改此連結)* |
| **LINE 機器人好友 ID** | `@請填寫您的機器人ID` *(請至 LINE Developers 複製)* |
| **LINE 機器人 Webhook** | `https://您的專案名稱.onrender.com/` *(部署於 Render)* |

---

## 📊 串接開放資料來源

本專案完全遵循作業規範，**僅使用 `axios` 發送即時 HTTP 請求**取得資料，**絕無**使用 `fs.readFileSync` 或 `import` 讀取任何本機靜態檔案。

1. **環境部 - 全國公廁建檔資料 (即時公廁查詢)**
   - API 來源：`https://data.moenv.gov.tw/api/v2/fac_p_07`
   - 功能：篩選男廁、女廁、親子/尿布台、性別友善廁所等。
2. **台北市政府環境保護局 - 台北市行人專用清潔箱點位資訊 (即時垃圾桶查詢)**
   - API 來源：`https://data.taipei/api/dataset/a835f3ba-7f50-4b0d-91a6-9df128632d1c/resource/267d550f-c6ec-46e0-b8af-fd5a464eb098/download`
   - 功能：透過即時解碼（Big5）將 CSV 轉為 JSON，查詢台北市各路段的行人垃圾桶。

---

## 🛠️ 功能與使用說明

1. **主選單引導**：
   - 當使用者加入好友，或是發送**任意非公廁或垃圾桶關鍵字**的文字時，機器人會直接跳出 **主功能選單**（Flex Message 卡片）。
2. **查詢最近公廁**：
   - 點選主選單中的「🔍 尋找附近公廁」，或在對話中輸入「公廁」。
   - 機器人會提供 Quick Reply 快速選單：`🚹 男廁`、`🚺 女廁`、`👶 親子廁所 / 尿布台`、`🚻 性別友善廁所`、`🌀 不限`。
   - 選定類型後，點選「📍 傳送位置資訊」發送定位，機器人將透過數學公式計算出最近的 **3 個公廁卡片**，並提供「查看地圖」導航連結。
3. **查詢最近垃圾桶**：
   - 點選主選單中的「🗑️ 尋找台北市垃圾桶」，或在對話中輸入「垃圾桶」。
   - 點選「📍 傳送位置資訊」發送定位，機器人即時搜尋最近的 **3 個台北市垃圾桶**並回覆。

---

## 🚀 本地開發與測試步驟

1. **安裝相依套件**：
   ```bash
   npm install
   ```
2. **設定環境變數**：
   在專案根目錄建立 `.env` 檔案，並填入您的 LINE 密鑰：
   ```env
   CHANNEL_ID=您的CHANNEL_ID
   CHANNEL_SECRET=您的CHANNEL_SECRET
   CHANNEL_ACCESS_TOKEN=您的CHANNEL_ACCESS_TOKEN
   PORT=3000
   ```
3. **啟動開發伺服器**：
   ```bash
   npm run dev
   ```
4. **使用 ngrok 進行外部穿透測試**：
   ```bash
   ngrok http 3000
   ```
   複製產生的 `https://...` 網址，填入 LINE Developers 的 Webhook URL，並在結尾加上 `/`，點擊 Verify 通過測試。

---

## ☁️ 部署到 Render.com 步驟

1. 將本專案推送上傳至您的 **GitHub 儲存庫**。
2. 登入 [Render.com](https://render.com) 並建立一個新的 **Web Service**。
3. 連結您的 GitHub 專案儲存庫，並進行以下設定：
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. 在 **Environment** 中新增以下環境變數 (Environment Variables)：
   - `CHANNEL_ID`
   - `CHANNEL_SECRET`
   - `CHANNEL_ACCESS_TOKEN`
5. 部署完成後，複製 Render 提供您的網址（如 `https://your-app-name.onrender.com/`）填入 LINE Developers Webhook URL 並啟用。
