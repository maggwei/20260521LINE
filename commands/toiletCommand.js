import axios from 'axios';
import templateNoTarget from '../templates/stock_no_target.js';
import templateNoShares from '../templates/stock_no_shares.js';
import templateFull from '../templates/stock_full.js';

const userStockData = {};

export default async (event) => {
    const userId = event.source.userId;
    const textMsg = event.message.text.trim().split(/\s+/);
    const cmd = textMsg[0];

    if (cmd === '查詢' && textMsg.length > 1) {
        const stockId = textMsg[1];
        let currentPrice = null;
        let stockName = stockId;

        try {
            let url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${stockId}.tw`;
            let res = await axios.get(url, { timeout: 3000 });
            if (res.data && res.data.msgArray && res.data.msgArray.length > 0) {
                currentPrice = parseFloat(res.data.msgArray[0].z || res.data.msgArray[0].y || 0);
                stockName = res.data.msgArray[0].n || stockId;
            } else {
                url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=otc_${stockId}.tw`;
                res = await axios.get(url, { timeout: 3000 });
                if (res.data && res.data.msgArray && res.data.msgArray.length > 0) {
                    currentPrice = parseFloat(res.data.msgArray[0].z || res.data.msgArray[0].y || 0);
                    stockName = res.data.msgArray[0].n || stockId;
                }
            }
        } catch (e) {
            return event.reply('📊 股票 API 連線逾時，請稍後再試！');
        }

        if (!currentPrice) {
            return event.reply('❌ 找不到這档股票，請檢查代碼是否正確。');
        }

        if (!userStockData[userId]) userStockData[userId] = {};
        if (!userStockData[userId][stockId]) {
            userStockData[userId][stockId] = { target_price: null, total_cost: 0, total_shares: 0 };
        }

        const stock = userStockData[userId][stockId];

        if (stock.target_price === null) {
            const flexJson = templateNoTarget(stockName, stockId, currentPrice);
            return event.reply({ type: 'flex', altText: '請設定目標價', contents: flexJson });
        }

        if (stock.total_shares === 0) {
            const gapPercent = (((stock.target_price - currentPrice) / currentPrice) * 100).toFixed(2);
            const flexJson = templateNoShares(stockName, stockId, currentPrice, stock.target_price, gapPercent);
            return event.reply({ type: 'flex', altText: '請輸入庫存', contents: flexJson });
        }

        const averageCost = (stock.total_cost / stock.total_shares).toFixed(2);
        const gapPercent = (((stock.target_price - currentPrice) / currentPrice) * 100).toFixed(2);
        const costGapPercent = (((stock.target_price - averageCost) / averageCost) * 100).toFixed(2);

        const flexJson = templateFull(stockName, stockId, currentPrice, stock.target_price, gapPercent, averageCost, costGapPercent, stock.total_shares);
        return event.reply({ type: 'flex', altText: '理財進度查詢', contents: flexJson });
    }

    if (cmd === '設定' && textMsg.length > 2) {
        const stockId = textMsg[1];
        const target = parseFloat(textMsg[2]);

        if (!userStockData[userId]) userStockData[userId] = {};
        if (!userStockData[userId][stockId]) {
            userStockData[userId][stockId] = { target_price: null, total_cost: 0, total_shares: 0 };
        }
        userStockData[userId][stockId].target_price = target;

        return event.reply(`✅ 已將 ${stockId} 目標價設定為 ${target}`);
    }

    if (cmd === '買入' && textMsg.length > 3) {
        const stockId = textMsg[1];
        const price = parseFloat(textMsg[2]);
        const shares = parseInt(textMsg[3]);

        if (!userStockData[userId]) userStockData[userId] = {};
        if (!userStockData[userId][stockId]) {
            userStockData[userId][stockId] = { target_price: null, total_cost: 0, total_shares: 0 };
        }

        userStockData[userId][stockId].total_cost += (price * shares);
        userStockData[userId][stockId].total_shares += shares;

        return event.reply(`✅ 已記錄買入 ${stockId}：${price} 元，${shares} 股`);
    }

    if (cmd === '賣出' && textMsg.length > 2) {
        const stockId = textMsg[1];
        const shares = parseInt(textMsg[2]);

        if (!userStockData[userId] || !userStockData[userId][stockId] || userStockData[userId][stockId].total_shares < shares) {
            return event.reply('❌ 賣出失敗，庫存股數不足！');
        }

        const stock = userStockData[userId][stockId];
        const avgCost = stock.total_cost / stock.total_shares;

        stock.total_shares -= shares;
        if (stock.total_shares === 0) {
            stock.total_cost = 0;
        } else {
            stock.total_cost -= (avgCost * shares);
        }

        return event.reply(`✅ 已記錄賣出 ${stockId}：${shares} 股`);
    }
};