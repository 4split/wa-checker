const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ✅ التحقق الذكي من اسم المستخدم (يعتمد على وجود رقم هاتف)
app.get('/check/:username', async (req, res) => {
    const username = req.params.username;

    if (!username || username.length < 1) {
        return res.json({ available: false, message: '⚠️ اسم غير صالح' });
    }

    try {
        // جلب صفحة واتساب
        const response = await axios.get(`https://wa.me/${username}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            maxRedirects: 0, // منع التوجيه التلقائي
            timeout: 10000,
            validateStatus: (status) => status >= 200 && status < 400
        });

        const html = response.data;

        // 🔍 البحث عن رقم هاتف بصيغة +XXX XXX XXX
        const phonePattern = /\+\d{1,3}[\s\-]?\d{1,4}[\s\-]?\d{1,10}/;
        const hasPhone = phonePattern.test(html);

        // 🔍 البحث عن كلمات تدل على وجود حساب نشط
        const isBusiness = html.includes('Business') || html.includes('نشاط تجاري');
        const isVerified = html.includes('Verified') || html.includes('موثق');
        const hasMessage = html.includes('Message') || html.includes('رسالة');
        const hasAbout = html.includes('About') || html.includes('حول');

        // 🔍 علامات تدل على أن الحساب غير موجود
        const isAvailable = html.includes('Chat on WhatsApp with @') ||
                            html.includes('Continue to WhatsApp Web') ||
                            html.includes('Download it now') ||
                            html.includes('Open app');

        // ✅ إذا وجد رقم هاتف → محجوز 100%
        if (hasPhone) {
            return res.json({ available: false, message: `❌ الاسم "${username}" محجوز (يحتوي على رقم)` });
        }

        // ✅ إذا كانت الصفحة واضحة أنها متاحة
        if (isAvailable) {
            return res.json({ available: true, message: `✅ الاسم "${username}" متاح!` });
        }

        // ✅ إذا وجدت علامات حساب نشط بدون رقم (نادر)
        if (isBusiness || isVerified || hasMessage || hasAbout) {
            return res.json({ available: false, message: `❌ الاسم "${username}" محجوز (حساب نشط)` });
        }

        // ✅ في حالة عدم التأكد
        return res.json({ available: true, message: `✅ الاسم "${username}" يبدو متاحاً` });

    } catch (error) {
        // إذا حصل توجيه (redirect) → محجوز
        if (error.response && error.response.status === 302) {
            return res.json({ available: false, message: `❌ الاسم "${username}" محجوز (توجيه)` });
        }

        // إذا كان الخطأ 404 → متاح
        if (error.response && error.response.status === 404) {
            return res.json({ available: true, message: `✅ الاسم "${username}" متاح!` });
        }

        // أي خطأ آخر
        return res.json({ available: null, message: `⚠️ حدث خطأ في التحقق من "${username}"` });
    }
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`✅ الخادم يعمل على المنفذ ${port}`);
});