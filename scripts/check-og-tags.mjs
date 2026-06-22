async function check(url, ua) {
  const res = await fetch(url, { headers: ua ? { 'User-Agent': ua } : {} });
  const html = await res.text();
  const pick = (name) => {
    const re = new RegExp(
      `(?:property|name)="${name}" content="([^"]+)"|<meta content="([^"]+)" (?:property|name)="${name}"`,
      'i'
    );
    const m = html.match(re);
    return m ? m[1] || m[2] : null;
  };
  const title = html.match(/<title>([^<]+)/i)?.[1];
  console.log(`\nURL: ${url}`);
  console.log(`UA: ${ua || 'default'}`);
  console.log(`status: ${res.status}`);
  console.log(`title: ${title}`);
  console.log(`og:title: ${pick('og:title')}`);
  console.log(`og:description: ${pick('og:description')}`);
  console.log(`og:image: ${pick('og:image')}`);
  console.log(`og:url: ${pick('og:url')}`);
}

const slug = 'property-with-rajnish-gautam-buddha-nagar';
await check(`https://finderb.com/business/${slug}`, 'WhatsApp/2.0');
await check(`http://localhost:3000/business/${slug}`, 'WhatsApp/2.0');
