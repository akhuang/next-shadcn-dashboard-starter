#!/usr/bin/env node

// 测试 Plausible Analytics 事件追踪

const fetch = require('node-fetch');

async function sendTestEvent() {
  const eventData = {
    name: 'pageview',
    url: 'http://localhost:3000/',
    domain: 'localhost:3000',
    referrer: '',
    screen_width: 1920
  };

  try {
    // 直接发送到 Plausible
    const response = await fetch('http://localhost:8000/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'X-Forwarded-For': '127.0.0.1'
      },
      body: JSON.stringify(eventData)
    });

    console.log('Direct to Plausible - Status:', response.status);
    const text = await response.text();
    console.log('Response:', text || 'Empty response (expected for success)');

    // 通过 Next.js 代理发送
    const proxyResponse = await fetch('http://localhost:3000/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'X-Forwarded-For': '127.0.0.1'
      },
      body: JSON.stringify(eventData)
    });

    console.log('\nVia Next.js proxy - Status:', proxyResponse.status);
    const proxyText = await proxyResponse.text();
    console.log(
      'Response:',
      proxyText || 'Empty response (expected for success)'
    );
  } catch (error) {
    console.error('Error:', error);
  }
}

sendTestEvent();
