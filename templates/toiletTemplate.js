export default (stockName, stockId, currentPrice) => {
    return {
        type: 'bubble',
        body: {
            type: 'box', layout: 'vertical',
            contents: [
                { type: 'text', text: `📌 ${stockName} (${stockId})`, weight: 'bold', size: 'xl' },
                { type: 'text', text: `今日股價：${currentPrice}`, size: 'md', margin: 'md' },
                { type: 'text', text: '⚠️ 尚未設定目標價', color: '#ff0000', size: 'sm', margin: 'sm' },
                { type: 'text', text: `請輸入：設定 ${stockId} 目標價`, color: '#aaaaaa', size: 'xs', margin: 'md' }
            ]
        }
    }
}