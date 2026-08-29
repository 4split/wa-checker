const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// نقطة نهاية للتحقق من اسم المستخدم
app.get('/check/:username', async (req, res) => {
    const username = req.params.username;
    
    // التحقق من أن الاسم ليس فارغاً
    if (!username || username.length < 1) {
        return res.json({ 
            available: false, 
            message: '⚠️ الرجاء إدخال اسم مستخدم صحيح' 
        });
    }

    try {
        // نرسل طلب إلى واتساب للتحقق من الاسم
        const response = await axios.head(`https://wa.me/${username}`, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400,
            timeout: 10000 // 10 ثواني كحد أقصى
        });

        // إذا كان الاسم محجوزاً، يعيد واتساب توجيه (302)
        if (response.status === 302 || response.status === 301) {
            res.json({ 
                available: false, 
                message: `❌ الاسم "${username}" غير متاح (محجوز)` 
            });
        } else {
            res.json({ 
                available: true, 
                message: `✅ الاسم "${username}" متاح!` 
            });
        }
    } catch (error) {
        // في حالة الخطأ، نفترض أن الاسم غير محجوز
        res.json({ 
            available: true, 
            message: `✅ يبدو أن الاسم "${username}" متاح (أو حدث خطأ في الاتصال)` 
        });
    }
});

// صفحة رئيسية بسيطة
app.get('/', (req, res) => {
    res.send(`
        <h1>🚀 واجهة التحقق من أسماء واتساب</h1>
        <p>استخدم الرابط: /check/اسم_المستخدم</p>
        <p>مثال: <a href="/check/test">/check/test</a></p>
    `);
});

app.listen(port, () => {
    console.log(`✅ الخادم يعمل على المنفذ ${port}`);
});