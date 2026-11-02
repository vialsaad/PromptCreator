# الرد التلقائي: تعليق بكلمة معينة ← رسالة على الخاص

الملف: `api/instagram-webhook.js` (يشتغل على Vercel مع باقي المشروع).

## انستقرام ✅

لما أحد يعلّق على بوست محدد وفيه الكلمة اللي تحددها، يرسل له رسالة خاصة تلقائياً (Private Reply)، وتقدر كمان ترد على تعليقه علناً مثل "أرسلنا لك على الخاص ✅".

### المتطلبات
- حساب انستقرام **احترافي** (Business أو Creator).
- تطبيق في [Meta for Developers](https://developers.facebook.com/) فيه الاستخدام **Manage messaging & content on Instagram**.
  التطبيقات الجديدة تستخدم **API setup with Unified login**، أما الطريقة القديمة **Instagram login** فما عادت متاحة لها.

### خطوات الإعداد
1. في التطبيق: Use cases ← Customize ← **API setup with Unified login**. أضف حساب انستقرام، واضغط **Generate token** وانسخ التوكن.
2. من **App settings ← Basic** انسخ **App secret**.
3. في Vercel ← Settings ← Environment Variables أضف:

   | المتغير | القيمة |
   |---|---|
   | `IG_VERIFY_TOKEN` | أي كلمة سر تختارها |
   | `IG_APP_SECRET` | الـ App secret من الخطوة 2 |
   | `IG_ACCESS_TOKEN` | التوكن من الخطوة 1 |
   | `AUTO_REPLY_RULES` | القواعد (شوف تحت) |
   | `IG_GRAPH_HOST` | اختياري، الافتراضي `graph.facebook.com`. التطبيقات القديمة اللي تستخدم Instagram login تحط `graph.instagram.com` |

4. سوّ Redeploy للمشروع.
5. في نفس صفحة Unified login، في قسم Configure webhooks:
   - Callback URL: `https://<موقعك>.vercel.app/api/instagram-webhook`
   - Verify token: نفس `IG_VERIFY_TOKEN`
   - اشترك في حقل **comments**، وشغّل **Webhook Subscription** جنب الحساب.
6. فعّل خيار "Allow access to messages" من تطبيق انستقرام (الإعدادات ← الرسائل ← أدوات متصلة).
7. وضع التطوير (Development) يرسل بس تعليقات الحسابات المضافة للتطبيق (Instagram Testers). عشان يشتغل مع الجميع لازم تنشر التطبيق (**Publish**).

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
  `https://graph.facebook.com/v23.0/<IG_ACCOUNT_ID>/media?fields=id,caption,permalink&access_token=TOKEN`
- `keyword`: الكلمة؛ تنطبق لو كانت موجودة في أي مكان بالتعليق (بدون فرق بين الحروف الكبيرة والصغيرة).
- `publicReply`: اختياري.

### قيود من انستقرام
- رسالة خاصة **وحدة** لكل تعليق، وخلال 7 أيام من التعليق.
- الشخص ما يقدر يستقبل رسائل ثانية منك إلا إذا رد عليك.

## تيك توك ❌ (ما فيه طريقة رسمية حالياً)
TikTok ما يوفر API عام للمطورين يسمح بإرسال رسائل خاصة أو استقبال التعليقات كـ Webhook، فما يقدر أي كود (ولا الكونكترز الموجودة مثل Metricool) يسوي هالشي بشكل رسمي.
البديل العملي: أدوات معتمدة كشريك رسمي لتيك توك مثل **ManyChat** (عندها ميزة Comment → DM لتيك توك)، أو الخدمة نفسها لانستقرام لو تبي كل شي بمكان واحد.
