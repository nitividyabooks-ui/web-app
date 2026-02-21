const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.competitorAsin.findFirst().then(c => {
  if (!c || !c.rawData) return console.log('No rawData found');
  const raw = c.rawData;

  console.log('\n=== TOP-LEVEL rawData KEYS ===');
  console.log(Object.keys(raw));

  console.log('\n=== SUMMARIES ===');
  console.log(JSON.stringify(raw.summaries || {}, null, 2).substring(0, 2000));

  console.log('\n=== ATTRIBUTE KEYS ===');
  console.log(Object.keys(raw.attributes || {}));

  console.log('\n=== SAMPLE ATTRIBUTES (first 5) ===');
  const attrs = raw.attributes || {};
  Object.keys(attrs).slice(0, 5).forEach(k => {
    console.log(k, ':', JSON.stringify(attrs[k]).substring(0, 150));
  });

  console.log('\n=== SALES RANKS ===');
  console.log(JSON.stringify(raw.salesRanks || {}, null, 2).substring(0, 500));

  console.log('\n=== IMAGES ===');
  (raw.images || []).forEach(img => {
    console.log(img.variant, '-', img.link ? img.link.substring(0, 80) : 'no link');
  });

  console.log('\n=== DIRECT FIELDS ===');
  console.log('asin:', c.asin);
  console.log('title:', c.title);
  console.log('brand:', c.brand);
  console.log('price:', c.price);
  console.log('rating:', c.rating);
  console.log('reviewCount:', c.reviewCount);
  console.log('keywords count:', c.keywords ? c.keywords.length : 0);
  console.log('keywords sample:', (c.keywords || []).slice(0, 5));
}).finally(() => prisma.$disconnect());
