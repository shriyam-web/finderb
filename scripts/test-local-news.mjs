const tests = [
  ['no location', 'http://localhost:3000/api/news?category=local&lang=hi&limit=6'],
  ['Noida', 'http://localhost:3000/api/news?category=local&lang=hi&limit=6&city=Noida&state=Uttar%20Pradesh'],
  ['Mumbai', 'http://localhost:3000/api/news?category=local&lang=hi&limit=6&city=Mumbai&state=Maharashtra'],
  ['Delhi', 'http://localhost:3000/api/news?category=local&lang=hi&limit=6&city=Delhi'],
  ['Lucknow', 'http://localhost:3000/api/news?category=local&lang=hi&limit=6&city=Lucknow'],
];

for (const [label, url] of tests) {
  const res = await fetch(url);
  const data = await res.json();
  console.log(`\n=== ${label} (location: ${JSON.stringify(data.location)}) ===`);
  if (!data.success) {
    console.log('FAILED', data.error);
    continue;
  }
  for (const a of data.articles || []) {
    console.log('-', a.title?.slice(0, 70));
    console.log('  source:', a.source, '| link:', a.link?.slice(0, 60));
  }
}
