import crypto from 'crypto';

// Instagram comment → DM auto-reply (Instagram API with Instagram Login).
//
// Environment variables:
//   IG_VERIFY_TOKEN   any string; must match "Verify token" in the Meta app webhook settings
//   IG_APP_SECRET     Meta app secret, used to verify X-Hub-Signature-256
//   IG_ACCESS_TOKEN   long-lived Instagram user access token
//                     (scopes: instagram_business_basic, instagram_business_manage_comments,
//                      instagram_business_manage_messages)
//   AUTO_REPLY_RULES  JSON array, e.g.
//     [{"mediaId":"17900000000000000","keyword":"سعر","message":"هلا! السعر 99 ريال 🌟","publicReply":"أرسلنا لك على الخاص ✅"}]
//     mediaId: the post id, or "*" for every post
//     keyword: matched case-insensitively anywhere in the comment
//     publicReply: optional reply posted under the comment

const GRAPH = 'https://graph.instagram.com/v23.0';

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function validSignature(raw, header) {
  const secret = process.env.IG_APP_SECRET;
  if (!secret || !header) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function loadRules() {
  try {
    const rules = JSON.parse(process.env.AUTO_REPLY_RULES || '[]');
    return Array.isArray(rules) ? rules : [];
  } catch {
    console.error('AUTO_REPLY_RULES is not valid JSON');
    return [];
  }
}

const normalize = (s) => (s || '').toString().toLowerCase().trim();

function findRule(rules, mediaId, text) {
  const t = normalize(text);
  return rules.find((r) =>
    r.keyword && r.message &&
    (r.mediaId === '*' || String(r.mediaId) === String(mediaId)) &&
    t.includes(normalize(r.keyword))
  );
}

async function graphPost(path, body) {
  const r = await fetch(`${GRAPH}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.IG_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) console.error(`Graph ${path} failed:`, r.status, await r.text());
  return r.ok;
}

async function handleComment(igAccountId, value, rules) {
  const commentId = value?.id;
  const mediaId = value?.media?.id;
  // Ignore our own comments (e.g. the public reply) to avoid loops.
  if (!commentId || value?.from?.id === igAccountId) return;

  const rule = findRule(rules, mediaId, value.text);
  if (!rule) return;

  // Private reply: a DM to the commenter, tied to their comment.
  await graphPost(`${igAccountId}/messages`, {
    recipient: { comment_id: commentId },
    message: { text: rule.message },
  });

  if (rule.publicReply) {
    await graphPost(`${commentId}/replies`, { message: rule.publicReply });
  }
}

export default async function handler(req, res) {
  // Webhook verification handshake from Meta.
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    if (mode === 'subscribe' && token && token === process.env.IG_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = await readRawBody(req);
  if (!validSignature(raw, req.headers['x-hub-signature-256'])) {
    return res.status(401).send('Invalid signature');
  }

  let payload;
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).send('Bad JSON');
  }

  const rules = loadRules();
  const jobs = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field === 'comments') {
        jobs.push(handleComment(String(entry.id), change.value, rules));
      }
    }
  }
  await Promise.allSettled(jobs);

  return res.status(200).send('EVENT_RECEIVED');
}
