export default () => {
    return {
        type: 'bubble',
        size: 'micro',
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: '設施類型',
                    weight: 'bold',
                    color: '#1DB446',
                    size: 'sm'
                },
                {
                    type: 'text',
                    text: '名稱/地址',
                    weight: 'bold',
                    size: 'md',
                    margin: 'md',
                    wrap: true
                },
                {
                    type: 'text',
                    text: '距離計算中',
                    size: 'xs',
                    color: '#aaaaaa',
                    margin: 'md'
                }
            ]
        }
    }
}