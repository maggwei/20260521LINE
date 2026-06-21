import express from 'express';
import * as line from '@line/bot-sdk';
import axios from 'axios';

const config = {
  channelAccessToken: "weO4vTIipUfJTNIZxoHJmfE+CqC4iEQt/SYvbBUqFWbOGUGuxEu9av1KNRgP/MzpS2Bk9C2aR3w1jA0mfP2v92Xfvc0oljagvUrJwFReDLpLjSrIHXYi0MzPihJVkX/2AtF6IaXior2CkrcaqUmmfgdB04t89/1O/w1cDnyilFU=",
  channelSecret: "d3f965417706a51e43ca5c0e4161393d"
};

const app = express();
const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: config.channelAccessToken });

app.post('/callback', line.middleware(config), async (req, res) => {
  const event = req.body.events[0];
  if (event.message.type === 'text') {
    try {
      const response = await axios.get('https://data.moenv.gov.tw/api/v2/toilet?api_key=e8dd42e6-9b8b-43f8-925e-b89010260485&limit=100&format=JSON');
      const toilet = response.data.records.find(t => t.area === event.message.text);
      const text = toilet ? `公廁：${toilet.name}\n地址：${toilet.address}` : "找不到該區公廁";

      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text }]
      });
    } catch (err) {
      console.error(err);
    }
  }
  res.status(200).send('OK');
});

app.listen(3000, () => console.log('OK'));