import axios from 'axios'
import fs from 'node:fs'
import template from '../templates/convenience.js'

export default async (event) => {
    try {
        if (event.message.type !== 'location') {
            await event.reply('歡迎使用生活便利查！\n\n請傳送您的「位置資訊」，我就會幫您找出最近的公廁與垃圾桶喔！')
            return
        }

        const userLat = event.message.latitude
        const userLng = event.message.longitude

        const toiletUrl = 'https://raw.githubusercontent.com/tw-open-data/taipei-toilet/main/fac_p_07.json'
        const trashUrl = 'https://raw.githubusercontent.com/tw-open-data/taipei-trash/main/trash_data.json'

        const [toiletRes, trashRes] = await Promise.all([
            axios.get(toiletUrl),
            axios.get(trashUrl).catch(() => ({ data: [] }))
        ])

        const toiletRawList = toiletRes.data || []
        const trashRawList = trashRes.data || []

        const toiletList = toiletRawList.map(item => ({
            type: '公廁',
            name: item.name || '列管公廁',
            lat: parseFloat(item.latitude),
            lng: parseFloat(item.longitude)
        })).filter(item => !isNaN(item.lat) && !isNaN(item.lng))

        const trashList = trashRawList.map(item => ({
            type: '垃圾桶',
            name: item['地址'] || item['設置地點'] || '行人專用清潔箱',
            lat: parseFloat(item['緯度'] || item.latitude),
            lng: parseFloat(item['經度'] || item.longitude)
        })).filter(item => !isNaN(item.lat) && !isNaN(item.lng))

        const allLocations = [...toiletList, ...trashList]

        const nearby = allLocations.map(loc => {
            const R = 6371
            const dLat = (loc.lat - userLat) * Math.PI / 180
            const dLon = (loc.lng - userLng) * Math.PI / 180
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(userLat * Math.PI / 180) * Math.cos(loc.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const distance = R * c
            return { ...loc, distance }
        }).sort((a, b) => a.distance - b.distance)
            .slice(0, 3)

        const bubbles = nearby.map(loc => {
            const card = template()
            card.body.contents[0].text = `📌 ${loc.type}`
            card.body.contents[1].text = loc.name
            card.body.contents[2].text = `👣 距離：約 ${(loc.distance * 1000).toFixed(0)} 公尺`
            return card
        })

        const message = {
            type: 'flex',
            altText: '周邊設施查詢結果',
            contents: {
                type: 'carousel',
                contents: bubbles
            }
        }

        const result = await event.reply(message)

        if (process.env.DEBUG && result.message) {
            fs.writeFileSync('./dump/convenience.json', JSON.stringify(message, null, 2))
        }

    } catch (error) {
        console.error(error)
    }
}