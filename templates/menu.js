export default () => {
  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#D4A373',
      contents: [
        {
          type: 'text',
          text: '主選單 🤖',
          weight: 'bold',
          color: '#ffffff',
          size: 'lg',
          align: 'center'
        }
      ]
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '請選擇您要使用的服務，我將為您搜尋距離最近的三個點位！',
          wrap: true,
          size: 'sm',
          color: '#555555',
          margin: 'md'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: '#D4A373',
          action: {
            type: 'postback',
            label: '🔍 尋找附近公廁',
            data: 'action=menu_toilet',
            displayText: '🔍 尋找附近公廁'
          }
        },
        {
          type: 'button',
          style: 'secondary',
          action: {
            type: 'postback',
            label: '🗑️ 尋找台北市垃圾桶',
            data: 'action=menu_trash',
            displayText: '🗑️ 尋找台北市垃圾桶'
          }
        }
      ]
    }
  }
}
