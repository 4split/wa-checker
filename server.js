const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// تمكين CORS
app.use(cors());
app.use(express.json());

// خدمة الملفات الثابتة (HTML, CSS, JS)
app.use(express.static('.'));

// نقطة نهاية للتحقق من اسم المستخدم
app.get('/check/:username', async (req, res) => {
    const username = req.params.username;

    if (!username || username.length < 1) {
        return res.json({
            available: false,
            message: '⚠️ الرجاء إدخال اسم مستخدم صحيح'
        });
    }

    try {
        const response = await axios.head(`https://wa.me/${username}`, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400,
            timeout: 10000
        });

        if (response.status === 302 || response.status === 301) {
            res.json({
                available: false,
                message: `❌ الاسم "${username}" غير متاح (محجوز)`
            });
        } else {
            res.json({
                available: true,
                message: `✅ الاسم "${username}" متاح! 🎉`
            });
        }
    } catch (error) {
        res.json({
            available: true,
            message: `✅ يبدو أن الاسم "${username}" متاح (أو حدث خطأ)`
        });
    }
});

// الصفحة الرئيسية ترحب بزيارة index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`✅ الخادم يعمل على المنفذ ${port}`);
});
