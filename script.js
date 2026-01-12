// === تهيئة البيانات ===
let userData = JSON.parse(localStorage.getItem('keyInvestUser_v2')) || {
    isRegistered: false,
    name: '',
    inviteCode: '',
    balance: 0,
    dailyProfit: 0,
    team: [],
    history: [],
    lastBonusDate: null, // لتخزين تاريخ آخر مكافأة
    investments: []
};

// === عند تحميل الصفحة ===
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    updateUI();
    renderTeamList(); // عرض الفريق

    // GSAP Animations (حركات الدخول)
    gsap.from(".app-header", {y: -50, opacity: 0, duration: 1, ease: "power2.out"});
    gsap.from(".balance-card", {scale: 0.8, opacity: 0, duration: 0.8, delay: 0.3});
    gsap.from(".gsap-card", {y: 50, opacity: 0, stagger: 0.2, duration: 0.8, delay: 0.5});
    gsap.from(".bottom-nav", {y: 100, duration: 1, ease: "elastic.out(1, 0.5)", delay: 1});
});

// === 1. نظام التسجيل والبروفايل ===
function checkLogin() {
    const modal = document.getElementById('loginModal');
    if (!userData.isRegistered) {
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
        document.getElementById('headerName').innerText = userData.name;
        document.getElementById('profileName').innerText = userData.name;
        document.getElementById('profileCode').innerText = "Code: " + userData.inviteCode;
        document.getElementById('myInviteCode').innerText = window.location.hostname + "/ref/" + userData.inviteCode;
    }
}

function registerUser() {
    const nameInput = document.getElementById('regName').value;
    const passInput = document.getElementById('regPass').value;

    if (nameInput.length < 3) return alert('الاسم قصير جداً');

    const randomCode = 'KEY' + Math.floor(1000 + Math.random() * 9000);

    userData.isRegistered = true;
    userData.name = nameInput;
    userData.inviteCode = randomCode;
    
    addHistory("تم إنشاء الحساب", 0, "info");
    saveData();
    checkLogin();
    
    gsap.to("#loginModal", {opacity: 0, duration: 0.5, onComplete: () => {
        document.getElementById('loginModal').style.display = 'none';
    }});
}

function logout() {
    if(confirm('هل تريد تسجيل الخروج وحذف البيانات؟')) {
        localStorage.removeItem('keyInvestUser_v2');
        location.reload();
    }
}

// === 2. ميزة القلب (3D Flip) ===
function flipCard(cardElement) {
    // نمنع القلب إذا ضغط المستخدم على زر أو رابط داخل البطاقة
    if(event.target.tagName === 'BUTTON' || event.target.tagName === 'A') return;

    const isFlipped = cardElement.classList.contains('flipped');
    
    // إعادة البطاقات الأخرى لوضعها الطبيعي
    document.querySelectorAll('.flip-card-container').forEach(c => {
        if(c !== cardElement) {
            c.classList.remove('flipped');
            gsap.to(c.querySelector('.flip-card-inner'), {rotationY: 0, duration: 0.4});
        }
    });

    if (isFlipped) {
        cardElement.classList.remove('flipped');
        gsap.to(cardElement.querySelector('.flip-card-inner'), {rotationY: 0, duration: 0.6});
    } else {
        cardElement.classList.add('flipped');
        gsap.to(cardElement.querySelector('.flip-card-inner'), {rotationY: 180, duration: 0.6});
    }
}

// === 3. العمليات المالية ===
function buyPlan(e, type, price, profit, days) {
    e.stopPropagation(); // منع القلب عند الضغط على الزر

    if (userData.balance >= price) {
        userData.balance -= price;
        userData.dailyProfit += profit;
        
        addHistory(`شراء باقة ${type}`, -price, "minus");
        userData.investments.push({type, date: new Date().toLocaleDateString()});
        
        alert(`تم تفعيل ${type} بنجاح!`);
        saveData();
        updateUI();
    } else {
        alert('رصيدك غير كافٍ! (جرب الشحن من البروفايل)');
    }
}

// الميزة المضافة: المكافأة اليومية
function claimDailyBonus() {
    const today = new Date().toDateString();
    
    if (userData.lastBonusDate === today) {
        alert('🚫 لقد استلمت المكافأة اليوم بالفعل، عد غداً!');
        return;
    }

    const bonusAmount = 250;
    userData.balance += bonusAmount;
    userData.lastBonusDate = today;
    
    addHistory("مكافأة يومية", bonusAmount, "plus");
    
    // تأثير احتفالي بسيط
    alert(`🎉 مبروك! حصلت على ${bonusAmount} IQD`);
    
    saveData();
    updateUI();
}

function simulateDeposit() {
    const amount = 50000;
    userData.balance += amount;
    addHistory("شحن رصيد (تجريبي)", amount, "plus");
    alert('تم شحن 50,000 IQD بنجاح');
    saveData();
    updateUI();
}

function processWithdraw() {
    const amount = parseInt(document.getElementById('wAmount').value);
    if (!amount || amount > userData.balance) return alert('الرصيد غير كافي أو المبلغ خطأ');
    
    userData.balance -= amount;
    addHistory(`طلب سحب أرباح`, -amount, "minus");
    alert('تم إرسال طلب السحب بنجاح!');
    document.getElementById('wAmount').value = ''; // تصفير الحقل
    saveData();
    updateUI();
}

// === 4. إدارة السجل والتحديث ===
function addHistory(desc, amount, type) {
    const record = { desc, amount, type, date: new Date().toLocaleTimeString() };
    userData.history.unshift(record); 
}

function toggleHistory() {
    const sec = document.getElementById('historySection');
    if(sec.style.display === 'block') {
        sec.style.display = 'none';
    } else {
        sec.style.display = 'block';
        renderHistory();
    }
}

function renderHistory() {
    const list = document.getElementById('transactionList');
    list.innerHTML = '';
    
    if(userData.history.length === 0) {
        list.innerHTML = '<li style="text-align:center;color:#999">لا توجد عمليات بعد</li>';
        return;
    }

    userData.history.forEach(item => {
        let colorClass = item.type === 'plus' ? 'h-plus' : (item.type === 'minus' ? 'h-minus' : '');
        let sign = item.type === 'plus' ? '+' : '';
        // نخفي المبلغ اذا كان 0
        let amountText = item.amount !== 0 ? `<span class="${colorClass}">${sign}${item.amount}</span>` : '';

        list.innerHTML += `
            <li class="history-item">
                <span>${item.desc} <small style="color:#bbb;font-size:0.7em">(${item.date})</small></span>
                ${amountText}
            </li>
        `;
    });
}

// === 5. التنقل (Navigation) ===
function switchTab(tabId) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.tab-content').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });

    // إظهار التبويب المطلوب
    const target = document.getElementById(tabId);
    if(target) {
        target.style.display = 'block';
        gsap.fromTo(target, {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.3});
    }

    // تحديث أزرار الناف بار السفلية
    updateActiveNavButton(tabId);
}

function updateActiveNavButton(activeTabId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // نربط كل زر بالتبويب الخاص به يدوياً لضمان الدقة
    if(activeTabId === 'home') selectNav(2); // الزر الأوسط
    else if(activeTabId === 'team') selectNav(1);
    else if(activeTabId === 'profile') selectNav(0);
    else if(activeTabId === 'agents') selectNav(3);
    else if(activeTabId === 'withdraw_sec') selectNav(4);
}

function selectNav(index) {
    const navItems = document.querySelectorAll('.nav-item');
    if(navItems[index]) navItems[index].classList.add('active');
}

// === 6. الفريق ===
function addTeamMember() {
    if(userData.team.length >= 10) return alert('وصلت للحد الأقصى (10 أعضاء)');
    
    const names = ["أحمد علي", "سارة محمد", "حسين كاظم", "نور الهدى", "مصطفى سعد"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    userData.team.push({name: randomName, date: new Date().toLocaleDateString()});
    alert('تم إضافة عضو جديد لفريقك!');
    
    saveData();
    updateUI();
    renderTeamList();
}

function renderTeamList() {
    const list = document.getElementById('teamMembersList');
    if(!list) return;
    
    list.innerHTML = '';
    userData.team.forEach((member, i) => {
        list.innerHTML += `
            <li style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
                <span>👤 ${member.name}</span>
                <span style="color:#999; font-size:0.8em">${member.date}</span>
            </li>
        `;
    });
}

function updateUI() {
    document.getElementById('walletBalance').innerText = userData.balance.toLocaleString() + ' IQD';
    document.getElementById('dailyProfit').innerText = userData.dailyProfit.toLocaleString();
    if(document.getElementById('teamCount')) {
        document.getElementById('teamCount').innerText = userData.team.length;
    }
}

function saveData() {
    localStorage.setItem('keyInvestUser_v2', JSON.stringify(userData));
}
