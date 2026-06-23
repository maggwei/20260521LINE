export default (lat, lng) => {
    return {
        type: 'bubble',
        size: 'micro',
        action: {
            type: 'uri',
            label: '查看地圖',
            uri: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        },
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                { type: 'text', text: '📌 公廁', weight: 'bold', color: '#D4A373', size: 'sm' },
                { type: 'text', text: '名稱/地址', weight: 'bold', size: 'md', margin: 'md', wrap: true },
                { type: 'text', text: '距離計算中', size: 'xs', color: '#aaaaaa', margin: 'md' }
            ]
        }
    }
}