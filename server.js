const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ✅ التحقق الذكي باستخدام Puppeteer
app.get('/check/:username', async (req, res) => {
    const username = req.params.username;
    
    if (!username || username.length < 1) {
        return res.json({ available: false, message: '⚠️ اسم غير صالح' });
    }

    try {
        // تشغيل متصفح وهمي
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // محاكاة مستخدم حقيقي
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // الذهاب إلى الرابط
        const response = await page.goto(`https://wa.me/${username}`, {
            waitUntil: 'networkidle2',
            timeout: 10000
        });

        // الحصول على محتوى الصفحة
        const html = await page.content();
        
        // البحث عن علامات الحجز
        const hasPhone = /\+\d{1,3}[\s\-]?\d{1,4}[\s\-]?\d{1,10}/.test(html);
        const hasMessage = html.includes('Message') || html.includes('رسالة');
        const isBusiness = html.includes('Business') || html.includes('نشاط تجاري');
        const isVerified = html.includes('Verified') || html.includes('موثق');
        
        // البحث عن علامات المتاح
        const isAvailable = html.includes('Chat on WhatsApp with @') ||
                           html.includes('Continue to WhatsApp Web') ||
                           html.includes('Download it now');
        
        await browser.close();

        // النتيجة
        if (hasPhone || hasMessage || isBusiness || isVerified) {
            return res.json({ available: false, message: `❌ "${username}" محجوز` });
        }
        
        if (isAvailable) {
            return res.json({ available: true, message: `✅ "${username}" متاح!` });
        }
        
        // إذا ما تأكدنا
        return res.json({ available: null, message: `❓ "${username}" غير معروف` });

    } catch (error) {
        console.error('خطأ في الفحص:', error.message);
        // في حالة الخطأ، نعتبره محجوز احتياطاً
        return res.json({ available: false, message: `⚠️ خطأ في فحص "${username}"` });
    }
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`✅ الخادم يعمل على المنفذ ${port}`);
});