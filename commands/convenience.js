import axios from 'axios';
import template from '../templates/convenience.js';

export default async (event) => {
    try {
        if (event.message.type !== 'location') {
            await event.reply('請傳送您的「位置資訊」，我就會幫您找出最近的公廁喔！');
            return;
        }

        const userLat = event.message.latitude;
        const userLng = event.message.longitude;

        const { data } = await axios.get('https://data.moenv.gov.tw/api/v2/fac_p_07?api_key=846e44e1-8cc5-4893-ad87-c79d2d383706&limit=1000&sort=ImportDate%20desc&format=JSON');

        const toiletRawList = data.records || data || [];

        const toiletList = toiletRawList.map(item => {
            const lat = parseFloat(item.latitude || item.Latitude || item.緯度);
            const lng = parseFloat(item.longitude || item.Longitude || item.經度);
            const name = item.pname || item.paddress || item.Name || item.Address || '公廁';

            if (isNaN(lat) || isNaN(lng)) return null;

            const R = 6371;
            const dLat = (lat - userLat) * Math.PI / 180;
            const dLon = (lng - userLng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return { name, lat, lng, distance: R * c };
        }).filter(item => item !== null);

        const sortedList = toiletList.sort((a, b) => a.distance - b.distance).slice(0, 3);

        const bubbles = sortedList.map(loc => {
            const card = template(loc.lat, loc.lng);
            card.body.contents[1].text = String(loc.name);
            card.body.contents[2].text = `👣 距離：約 ${(loc.distance * 1000).toFixed(0)} 公尺`;
            return card;
        });

        await event.reply({ type: 'flex', altText: '周邊公廁查詢結果', contents: { type: 'carousel', contents: bubbles } });
    } catch (error) {
        console.error(error);
        await event.reply(`系統錯誤：${error.message}`);
    }
}