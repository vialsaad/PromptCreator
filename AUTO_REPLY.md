# الرد التلقائي: تعليق بكلمة معينة ← رسالة على الخاص

الملف: `api/instagram-webhook.js` (يشتغل على Vercel مع باقي المشروع).

## انستقرام ✅

لما أحد يعلّق على بوست محدد وفيه الكلمة اللي تحددها، يرسل له رسالة خاصة تلقائياً (Private Reply)، وتقدر كمان ترد على تعليقه علناً مثل "أرسلنا لك على الخاص ✅".

### المتطلبات
- حساب انستقرام **احترافي** (Business أو Creator).
- تطبيق في [Meta for Developers](https://developers.facebook.com/) بمنتج **Instagram** (API setup with Instagram login).

### خطوات الإعداد
1. في التطبيق، أضف حسابك وولّد **Access Token** بالصلاحيات:
   `instagram_business_basic`, `instagram_business_manage_comments`, `instagram_business_manage_messages`.
2. في Vercel ← Settings ← Environment Variables أضف:

   | المتغير | القيمة |
   |---|---|
   | `IG_VERIFY_TOKEN` | أي كلمة سر تختارها |
   | `IG_APP_SECRET` | App Secret من إعدادات التطبيق |
   | `IG_ACCESS_TOKEN` | التوكن من الخطوة 1 |
   | `AUTO_REPLY_RULES` | القواعد (شوف تحت) |

3. سوّ Redeploy للمشروع.
4. في إعدادات Webhooks بالتطبيق:
   - Callback URL: `https://<موقعك>.vercel.app/api/instagram-webhook`
   - Verify token: نفس `IG_VERIFY_TOKEN`
   - اشترك في حقل **comments**.
5. فعّل خيار "Allow access to messages" من تطبيق انستقرام (الإعدادات ← الرسائل ← أدوات متصلة).
6. عشان يشتغل مع الجميع (مو بس حسابات المطورين) لازم التطبيق يكون **Live** ويمر بمراجعة Meta (App Review) للصلاحيات أعلاه.

### صيغة القواعد `AUTO_REPLY_RULES`
```json
[
  {
    "mediaId": "17900000000000000",
    "keyword": "سعر",
    "message": "هلا فيك! السعر 99 ريال، وهذا رابط الطلب: https://example.com",
    "publicReply": "أرسلنا لك التفاصيل على الخاص ✅"
  },
  {
    "mediaId": "*",
    "keyword": "رابط",
    "message": "تفضل الرابط: https://example.com"
  }
]
```
- `mediaId`: رقم البوست، أو `*` لكل البوستات. تقدر تجيب رقم البوست من:
  `https://graph.instagram.com/v23.0/me/media?fields=id,caption,permalink&access_token=TOKEN`
- `keyword`: الكلمة؛ تنطبق لو كانت موجودة في أي مكان بالتعليق (بدون فرق بين الحروف الكبيرة والصغيرة).
- `publicReply`: اختياري.

### قيود من انستقرام
- رسالة خاصة **وحدة** لكل تعليق، وخلال 7 أيام من التعليق.
- الشخص ما يقدر يستقبل رسائل ثانية منك إلا إذا رد عليك.

## تيك توك ❌ (ما فيه طريقة رسمية حالياً)
TikTok ما يوفر API عام للمطورين يسمح بإرسال رسائل خاصة أو استقبال التعليقات كـ Webhook، فما يقدر أي كود (ولا الكونكترز الموجودة مثل Metricool) يسوي هالشي بشكل رسمي.
البديل العملي: أدوات معتمدة كشريك رسمي لتيك توك مثل **ManyChat** (عندها ميزة Comment → DM لتيك توك)، أو الخدمة نفسها لانستقرام لو تبي كل شي بمكان واحد.
