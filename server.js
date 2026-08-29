const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ✅ نقطة نهاية للتحقق المباشر من المتصفح
app.get('/check/:username', async (req, res) => {
    const username = req.params.username;

    if (!username || username.length < 1) {
        return res.json({ available: false, message: '⚠️ اسم غير صالح' });
    }

    try {
        // طلب الصفحة من واتساب
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`https://wa.me/${username}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            redirect: 'manual'
        });

        // إذا كان توجيه → محجوز
        if (response.status === 301 || response.status === 302) {
            return res.json({ available: false, message: `❌ "${username}" محجوز` });
        }

        // إذا كانت الصفحة موجودة، نقرأ النص
        const html = await response.text();

        // 🔍 البحث عن رقم هاتف
        const phonePattern = /\+\d{1,3}[\s\-]?\d{1,4}[\s\-]?\d{1,10}/;
        const hasPhone = phonePattern.test(html);

        if (hasPhone) {
            return res.json({ available: false, message: `❌ "${username}" محجوز` });
        }

        // ✅ متاح
        return res.json({ available: true, message: `✅ "${username}" متاح!` });

    } catch (error) {
        // أي خطأ → متاح (افتراضي)
        return res.json({ available: true, message: `✅ "${username}" متاح` });
    }
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`✅ الخادم يعمل على المنفذ ${port}`);
});