const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.competitorAsin.findFirst().then(c => {
  const raw = c.rawData;
  const attrs = raw.attributes || {};

  console.log('\n=== FULL IMAGES ARRAY ===');
  console.log(JSON.stringify(raw.images || [], null, 2).substring(0, 800));

  console.log('\n=== KEY ATTRIBUTES ===');
  const keys = ['subject_keyword','target_audience','pages','binding','format',
    'list_price','item_dimensions','item_weight','publication_date','language',
    'genre','series_title','minimum_recommended_grade_level',
    'maximum_recommended_grade_level','externally_assigned_product_identifier',
    'recommended_browse_nodes'];
  keys.forEach(k => {
    if (attrs[k]) console.log(k + ':', JSON.stringify(attrs[k]).substring(0, 200));
  });
}).finally(() => prisma.$disconnect());
