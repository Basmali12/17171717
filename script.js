// استيراد دوال Firebase (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// === 1. إعدادات الفايربيس (يجب استبدالها ببياناتك) ===
const firebaseConfig = {
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-app",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// تهيئة التطبيق
let app, auth, provider;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
} catch (e) {
    console.error("Firebase Error: تأكد من وضع إعداداتك الصحيحة");
}

// === 2. المتغيرات العامة ===
let currentUser = null;
let isPreviewMode = false;
let userLocalData = {
    balance: 0,
    activePlans: [], // { id, name, dailyProfit, nextClaimTime }
    id: '---'
};

// === 3. تشغيل عند التحميل ===
document.addEventListener('DOMContentLoaded', () => {
    runIntroAnimation();
    
    // مراقب حالة تسجيل الدخول
    if(auth) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                loginSuccess(user);
            } else {
                if(!isPreviewMode) showLoginModal();
            }
        });
    }

    // تهيئة الزر
    document.getElementById('googleLoginBtn').addEventListener('click', googleLogin);
    
    // بدء تحديث العدادات كل ثانية
    setInterval(updateTimersUI, 1000);
});

// === 4. انميشن المقدمة ===
function runIntroAnimation() {
    // تقليب الأحرف
    var textWrapper = document.querySelector('.ml11 .letters');
    textWrapper.innerHTML = textWrapper.textContent.replace(/([^\x00-\x80]|\w)/g, "<span class='letter'>$&</span>");

    anime.timeline({loop: false})
    .add({
        targets: '.ml11 .line',
        scaleY: [0,1],
        opacity: [0.5,1],
        easing: "easeOutExpo",
        duration: 700
    })
    .add({
        targets: '.ml11 .line',
        translateX: [0, document.querySelector('.ml11 .letters').getBoundingClientRect().width + 10],
        easing: "easeOutExpo",
        duration: 700,
        delay: 100
    }).add({
        targets: '.ml11 .letter',
        opacity: [0,1],
        easing: "easeOutExpo",
        duration: 600,
        offset: '-=775',
        delay: (el, i) => 34 * (i+1)
    }).add({
        targets: '#intro-overlay',
        opacity: 0,
        duration: 1000,
        delay: 1000,
        complete: function(anim) {
            document.getElementById('intro-overlay').style.display = 'none';
        }
    });
}

// === 5. وظائف الدخول ===
window.googleLogin = () => {
    signInWithPopup(auth, provider)
    .then((result) => {
        // تم الدخول
    }).catch((error) => {
        alert("خطأ في التسجيل: " + error.message);
    });
};

window.startGuestMode = () => {
    isPreviewMode = true;
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('userName').innerText = 'زائر (معاينة)';
    document.getElementById('userId').innerText = 'GUEST-' + Math.floor(Math.random()*1000);
    loadFakeHistory(); // تحميل بيانات وهمية للعرض فقط
};

function showLoginModal() {
    document.getElementById('authModal').style.display = 'flex';
}

function loginSuccess(user) {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('userName').innerText = user.displayName;
    // إنشاء ID ثابت تقريباً من UID
    let shortId = user.uid.substring(0, 8).toUpperCase();
    document.getElementById('userId').innerText = shortId;
    userLocalData.id = shortId;
    
    // استرجاع البيانات المحلية (محاكاة قاعدة بيانات)
    const saved = localStorage.getItem(`keyInvest_${user.uid}`);
    if(saved) userLocalData = JSON.parse(saved);
    
    updateWalletUI();
    renderActiveTimers();
    loadFakeHistory();
}

window.logout = () => {
    if(isPreviewMode) {
        location.reload();
    } else {
        signOut(auth).then(() => location.reload());
    }
};

// === 6. إدارة التبويبات ===
window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    // تحديد الزر النشط
    const navIndex = ['profile', 'team', 'my-timers', 'invest', 'wallet', 'news'].indexOf(tabId);
    if(navIndex !== -1) {
        document.querySelectorAll('.nav-item')[navIndex].classList.add('active');
    }
};

// === 7. نظام الإجراءات (المنع للمعاينة) ===
window.handleAction = (action) => {
    if(isPreviewMode) {
        alert('⚠️ هذه الميزة متاحة للأعضاء المسجلين فقط.\nأنت حالياً في وضع المعاينة.');
        return;
    }

    if(action === 'deposit') {
        window.location.href = 'https://t.me/am_an12';
    } else if (action === 'withdraw') {
        const amount = prompt("أدخل المبلغ المراد سحبه (IQD):");
        if(amount) alert("تم إرسال طلب السحب للمراجعة.");
    } else if (action === 'telegram') {
        window.location.href = 'https://t.me/keey10';
    } else if (action === 'copy') {
        navigator.clipboard.writeText(`https://key-invest.app/?ref=${userLocalData.id}`);
        alert("تم نسخ رابط الدعوة");
    } else {
        alert("قريباً...");
    }
};

// === 8. نظام الاستثمار والعدادات ===
window.buyPlan = (type, price, dailyProfit) => {
    if(isPreviewMode) return window.handleAction('buy');

    if(confirm(`تأكيد شراء باقة بقيمة ${price}؟\n(سيتم خصم المبلغ من رصيدك في النسخة الكاملة)`)) {
        const newPlan = {
            id: Date.now(),
            name: type === 'starter' ? 'الباقة الأساسية' : 'الباقة الذهبية',
            dailyProfit: dailyProfit,
            startTime: Date.now(),
            nextClaimTime: Date.now() + (24 * 60 * 60 * 1000) // بعد 24 ساعة
        };
        
        userLocalData.activePlans.push(newPlan);
        saveUserData();
        alert('✅ تم تفعيل الباقة وبدأ العداد!');
        switchTab('my-timers');
        renderActiveTimers();
    }
};

function renderActiveTimers() {
    const container = document.getElementById('activeTimersList');
    container.innerHTML = '';

    if(userLocalData.activePlans.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#eee; margin-top:20px;">لا توجد استثمارات نشطة</p>';
        return;
    }

    userLocalData.activePlans.forEach((plan, index) => {
        container.innerHTML += `
            <div class="timer-item" id="plan-${plan.id}">
                <div>
                    <strong>${plan.name}</strong>
                    <div style="font-size:0.8rem; opacity:0.7">ربح: ${plan.dailyProfit} IQD</div>
                </div>
                <div style="text-align:left">
                    <div class="timer-count" id="timer-${plan.id}">--:--:--</div>
                    <button class="btn-claim" id="btn-${plan.id}" onclick="claimProfit(${index})">استلام الأرباح 💰</button>
                </div>
            </div>
        `;
    });
}

function updateTimersUI() {
    const now = Date.now();
    userLocalData.activePlans.forEach(plan => {
        const diff = plan.nextClaimTime - now;
        const timerElement = document.getElementById(`timer-${plan.id}`);
        const btnElement = document.getElementById(`btn-${plan.id}`);
        
        if(timerElement && btnElement) {
            if(diff <= 0) {
                timerElement.style.display = 'none';
                btnElement.style.display = 'block';
            } else {
                timerElement.style.display = 'block';
                btnElement.style.display = 'none';
                
                // تحويل الوقت
                let h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                let m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                let s = Math.floor((diff % (1000 * 60)) / 1000);
                timerElement.innerText = `${h}h ${m}m ${s}s`;
            }
        }
    });
}

window.claimProfit = (index) => {
    const plan = userLocalData.activePlans[index];
    userLocalData.balance += plan.dailyProfit;
    
    // إعادة تعيين العداد 24 ساعة
    plan.nextClaimTime = Date.now() + (24 * 60 * 60 * 1000);
    
    saveUserData();
    updateWalletUI();
    renderActiveTimers(); // لإخفاء الزر وإظهار العداد
    alert(`💵 تم إضافة ${plan.dailyProfit} IQD إلى محفظتك!`);
};

function updateWalletUI() {
    document.getElementById('totalBalance').innerText = userLocalData.balance.toLocaleString() + ' IQD';
}

function saveUserData() {
    if(currentUser) {
        localStorage.setItem(`keyInvest_${currentUser.uid}`, JSON.stringify(userLocalData));
    }
}

// === 9. سحوبات وهمية ===
function loadFakeHistory() {
    const historyList = document.getElementById('withdrawalHistory');
    historyList.innerHTML = '';
    
    const fakeData = [
        { amount: 50000, date: '2025/01/10', status: '✅ تم التحويل' },
        { amount: 25000, date: '2025/01/05', status: '✅ تم التحويل' },
        { amount: 100000, date: '2024/12/28', status: '✅ تم التحويل' },
        { amount: 15000, date: '2024/12/15', status: '✅ تم التحويل' }
    ];

    fakeData.forEach(item => {
        historyList.innerHTML += `
            <li class="history-item">
                <span><i class="fas fa-arrow-up" style="color:red; margin-left:5px;"></i> سحب ${item.amount.toLocaleString()}</span>
                <span style="opacity:0.7; font-size:0.8rem">${item.date}</span>
            </li>
        `;
    });
}
