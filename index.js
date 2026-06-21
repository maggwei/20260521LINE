import 'dotenv/config'
import linebot from 'linebot'
import commandExrate from './commands/exrate.js'
import commandWda from './commands/wda.js'
import commandCourse from './commands/course.js'
import commandConvenience from './commands/convenience.js'

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
})

bot.on('message', (event) => {
  if (event.message.type === 'text') {
    if (event.message.text === '匯率') {
      commandExrate(event)
    } else if (event.message.text === '職訓') {
      commandWda(event)
    }
  } else if (event.message.type === 'location') {
    commandConvenience(event)
  }
})

bot.on('postback', (event) => {
  if (event.postback.data === 'course') {
    commandCourse(event)
  }
})

bot.listen('/', process.env.PORT || 3000, () => {
  console.log('機器人啟動')
})