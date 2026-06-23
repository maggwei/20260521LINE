import 'dotenv/config'
import linebot from 'linebot'
import axios from 'axios'
import csvtojson from 'csvtojson'
import { distance } from './distance.js'
import toiletTemplate from './templates/convenience.js'
import trashTemplate from './templates/trash.js'
import menuTemplate from './templates/menu.js'

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
})

// 全域使用者狀態暫存器，用以記錄使用者當前的查詢主題與篩選條件
const userStates = new Map()

bot.on('postback', async (event) => {
  try {
    const userId = event.source.userId
    const data = event.postback.data
    const params = new URLSearchParams(data)
    const action = params.get('action')

    if (action === 'menu_toilet') {
      await event.reply({
        type: 'text',
        text: '請選擇您要查詢的公廁類型：',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '🚹 男廁',
                data: 'action=select_toilet&filter=male',
                displayText: '🚹 選擇男廁'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '🚺 女廁',
                data: 'action=select_toilet&filter=female',
                displayText: '🚺 選擇女廁'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '👶 親子廁所 / 尿布台',
                data: 'action=select_toilet&filter=family',
                displayText: '👶 選擇親子/尿布台'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '🚻 性別友善廁所',
                data: 'action=select_toilet&filter=friendly',
                displayText: '🚻 選擇性別友善'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '🌀 不限',
                data: 'action=select_toilet&filter=all',
                displayText: '🌀 選擇不限'
              }
            }
          ]
        }
      })
    } else if (action === 'menu_trash') {
      userStates.set(userId, { action: 'search_trash' })
      await event.reply({
        type: 'text',
        text: '已選擇查詢垃圾桶。請點擊下方【傳送位置資訊】按鈕，或透過 LINE 對話框的【+】->【位置資訊】傳送您的位置，我將為您搜尋最近的三個垃圾桶！',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'location',
                label: '📍 傳送位置資訊'
              }
            }
          ]
        }
      })
    } else if (action === 'select_toilet') {
      const filter = params.get('filter')
      userStates.set(userId, { action: 'search_toilet', filter })

      const filterNames = {
        male: '🚹 男廁',
        female: '🚺 女廁',
        family: '👶 親子廁所 (含尿布台)',
        friendly: '🚻 性別友善廁所',
        all: '🌀 不限'
      }

      await event.reply({
        type: 'text',
        text: `您已選擇【${filterNames[filter] || '不限'}】。\n請點擊下方【傳送位置資訊】按鈕，或透過 LINE 對話框的【+】->【位置資訊】傳送您的位置，我將為您搜尋最近的三個公廁！`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'location',
                label: '📍 傳送位置資訊'
              }
            }
          ]
        }
      })
    }
  } catch (error) {
    console.error('Postback Error:', error)
  }
})

bot.on('follow', async (event) => {
  try {
    const menu = menuTemplate()
    await event.reply([
      {
        type: 'flex',
        altText: '主選單',
        contents: menu
      },
      {
        type: 'text',
        text: '歡迎使用 🤖！\n請點選上方選單開始使用服務：'
      }
    ])
  } catch (error) {
    console.error('Follow Error:', error)
  }
})

bot.on('message', async (event) => {
  try {
    const userId = event.source.userId

    if (event.message.type === 'location') {
      const state = userStates.get(userId) || { action: 'search_toilet', filter: 'all' }

      if (state.action === 'search_toilet') {
        const { data } = await axios.get(
          'https://data.moenv.gov.tw/api/v2/fac_p_07?api_key=e75b1660-e564-4107-aad5-a8be1f905dd9&limit=1000&sort=ImportDate%20desc&format=JSON'
        )

        const records = Array.isArray(data) ? data : (data.records || [])
        console.log('!!! 公廁資料筆數為:', records.length)

        if (records.length === 0) {
          await event.reply('沒有抓到公廁資料，API 結構可能變更了。')
          return
        }

        // 依據使用者的選擇進行過濾
        let filteredRecords = records
        if (state.filter === 'male') {
          filteredRecords = records.filter(
            r => r.type === '男廁所' || r.type === '混合廁所' || r.type === '性別友善廁所'
          )
        } else if (state.filter === 'female') {
          filteredRecords = records.filter(
            r => r.type === '女廁所' || r.type === '混合廁所' || r.type === '性別友善廁所'
          )
        } else if (state.filter === 'family') {
          filteredRecords = records.filter(
            r => r.type === '親子廁所' || r.diaper === '1'
          )
        } else if (state.filter === 'friendly') {
          filteredRecords = records.filter(
            r => r.type === '性別友善廁所' || r.type === '混合廁所'
          )
        }

        const sorted = filteredRecords
          .map((value) => {
            const lat = parseFloat(value.latitude || value.Latitude || value.緯度 || 0)
            const lng = parseFloat(value.longitude || value.Longitude || value.經度 || 0)
            value.distance = distance(lat, lng, event.message.latitude, event.message.longitude, 'K')
            value.name = value.pname || value.name || '公廁'
            value.lat = lat
            value.lng = lng
            return value
          })
          .filter(v => v.lat !== 0 && v.lng !== 0 && !isNaN(v.lat) && !isNaN(v.lng))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3)

        if (sorted.length === 0) {
          await event.reply('在您定位的周邊，找不到符合您設定條件的公廁。')
          return
        }

        const bubbles = sorted.map(loc => {
          const card = toiletTemplate(loc.lat, loc.lng)
          card.body.contents[1].text = String(loc.name)
          card.body.contents[2].text = `👣 距離：約 ${(loc.distance * 1000).toFixed(0)} 公尺`
          return card
        })

        await event.reply({
          type: 'flex',
          altText: '公廁查詢結果',
          contents: { type: 'carousel', contents: bubbles }
        })
      } else if (state.action === 'search_trash') {
        const url = 'https://data.taipei/api/dataset/a835f3ba-7f50-4b0d-91a6-9df128632d1c/resource/267d550f-c6ec-46e0-b8af-fd5a464eb098/download'
        
        const res = await axios.get(url, { responseType: 'arraybuffer' })
        const decoder = new TextDecoder('big5')
        const csvText = decoder.decode(res.data)
        const records = await csvtojson().fromString(csvText)

        console.log('!!! 垃圾桶資料筆數為:', records.length)

        if (records.length === 0) {
          await event.reply('沒有抓到垃圾桶資料。')
          return
        }

        const sorted = records
          .map((value) => {
            const lat = parseFloat(value.緯度 || value.latitude || 0)
            const lng = parseFloat(value.經度 || value.longitude || 0)
            value.distance = distance(lat, lng, event.message.latitude, event.message.longitude, 'K')
            value.name = value.地址 || '行人清潔箱'
            value.lat = lat
            value.lng = lng
            return value
          })
          .filter(v => v.lat !== 0 && v.lng !== 0 && !isNaN(v.lat) && !isNaN(v.lng))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3)

        if (sorted.length === 0) {
          await event.reply('在您的定位周邊，沒有找到附近的垃圾桶。')
          return
        }

        const bubbles = sorted.map(loc => {
          const card = trashTemplate(loc.lat, loc.lng)
          card.body.contents[1].text = String(loc.name)
          card.body.contents[2].text = `👣 距離：約 ${(loc.distance * 1000).toFixed(0)} 公尺`
          return card
        })

        await event.reply({
          type: 'flex',
          altText: '垃圾桶查詢結果',
          contents: { type: 'carousel', contents: bubbles }
        })
      }

      // 查詢完畢後清除使用者狀態
      userStates.delete(userId)

    } else if (event.message.type === 'text') {
      const text = event.message.text.trim()

      if (text.includes('公廁') && !text.includes('選擇') && !text.includes('已選擇')) {
        await event.reply({
          type: 'text',
          text: '請選擇您要查詢的公廁類型：',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '🚹 男廁',
                  data: 'action=select_toilet&filter=male',
                  displayText: '🚹 選擇男廁'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '🚺 女廁',
                  data: 'action=select_toilet&filter=female',
                  displayText: '🚺 選擇女廁'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '👶 親子廁所 / 尿布台',
                  data: 'action=select_toilet&filter=family',
                  displayText: '👶 選擇親子/尿布台'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '🚻 性別友善廁所',
                  data: 'action=select_toilet&filter=friendly',
                  displayText: '🚻 選擇性別友善'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '🌀 不限',
                  data: 'action=select_toilet&filter=all',
                  displayText: '🌀 選擇不限'
                }
              }
            ]
          }
        })
      } else if (text.includes('垃圾桶')) {
        userStates.set(userId, { action: 'search_trash' })
        await event.reply({
          type: 'text',
          text: '已選擇查詢垃圾桶。請點擊下方【傳送位置資訊】按鈕，或透過 LINE 對話框的【+】->【位置資訊】傳送您的位置，我將為您搜尋最近的三個垃圾桶！',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'location',
                  label: '📍 傳送位置資訊'
                }
              }
            ]
          }
        })
      } else if (text.includes('男廁')) {
        userStates.set(userId, { action: 'search_toilet', filter: 'male' })
        await event.reply({
          type: 'text',
          text: '您已選擇【🚹 男廁】。\n請點擊下方【傳送位置資訊】按鈕，或透過 LINE 對話框的【+】->【位置資訊】傳送您的位置，我將為您搜尋最近的三個公廁！',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'location',
                  label: '📍 傳送位置資訊'
                }
              }
            ]
          }
        })
      } else if (text.includes('女廁')) {
        userStates.set(userId, { action: 'search_toilet', filter: 'female' })
        await event.reply({
          type: 'text',
          text: '您已選擇【🚺 女廁】。\n請點擊下方【傳送位置資訊】按鈕，或透過 LINE 對話框的【+】->【位置資訊】傳送您的位置，我將為您搜尋最近的三個公廁！',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'location',
                  label: '📍 傳送位置資訊'
                }
              }
            ]
          }
        })
      } else if (text.includes('親子')) {
        userStates.set(userId, { action: 'search_toilet', filter: 'family' })
        await event.reply({
          type: 'text',
          text: '您已選擇【👶 親子廁所 (含尿布台)】。\n請點擊下方【傳送位置資訊】按鈕，或透過 LINE 對話框的【+】->【位置資訊】傳送您的位置，我將為您搜尋最近的三個公廁！',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'location',
                  label: '📍 傳送位置資訊'
                }
              }
            ]
          }
        })
      } else if (text.includes('性別友善')) {
        userStates.set(userId, { action: 'search_toilet', filter: 'friendly' })
        await event.reply({
          type: 'text',
          text: '您已選擇【🚻 性別友善廁所】。\n請點擊下方【傳送位置資訊】按鈕，或透過 LINE 對話框的【+】->【位置資訊】傳送您的位置，我將為您搜尋最近的三個公廁！',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'location',
                  label: '📍 傳送位置資訊'
                }
              }
            ]
          }
        })
      } else if (text.includes('不限')) {
        userStates.set(userId, { action: 'search_toilet', filter: 'all' })
        await event.reply({
          type: 'text',
          text: '您已選擇【🌀 不限】。\n請點擊下方【傳送位置資訊】按鈕，或透過 LINE 對話框的【+】->【位置資訊】傳送您的位置，我將為您搜尋最近的三個公廁！',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'location',
                  label: '📍 傳送位置資訊'
                }
              }
            ]
          }
        })
      } else {
        const menu = menuTemplate()
        await event.reply({
          type: 'flex',
          altText: '主選單',
          contents: menu
        })
      }
    } else {
      const menu = menuTemplate()
      await event.reply({
        type: 'flex',
        altText: '主選單',
        contents: menu
      })
    }
  } catch (error) {
    console.error(error)
    await event.reply('系統發生錯誤，請稍後再試')
  }
})

bot.listen('/', process.env.PORT || 3000, () => {
  console.log('機器人啟動')
})