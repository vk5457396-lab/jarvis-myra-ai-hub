import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const raw = readFileSync('C:/Users/Vikas/OneDrive/Desktop/.env', 'utf8');
const m = raw.match(/^MONGODB_URI="([\s\S]*?)"\s*$/m);
const uri = m[1];

await mongoose.connect(uri);
const day = 86400000;
const todayStart = Math.floor(Date.now() / day) * day;
const yesterdayStart = todayStart - day;
const col = mongoose.connection.db.collection('rate_limit_buckets');

for (const windowStart of [yesterdayStart, todayStart]) {
  const label = windowStart === todayStart ? 'TODAY' : 'YESTERDAY';
  for (const key of ['site-daily', 'app-daily']) {
    const id = `${key}:${windowStart}`;
    const doc = await col.findOne({ _id: id });
    console.log(label, key, '=>', doc ? doc.count : 0);
  }
}

await mongoose.disconnect();
