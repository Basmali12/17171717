// === تهيئة البيانات ===
let userData = JSON.parse(localStorage.getItem('keyInvestUser_v3')) || {
    isRegistered: false,
    name: '',
    phone: '',
    id: 'ID' + Math.floor(Math.random() * 100000),
    balance: 0, // الأرباح المتاحة
    plans: [] // قائمة الاشتراكات
};

// === عند التحميل ===
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    updateUI();
    
    // أنميشن بسيط
    gsap.from(".plans-container", {y: 30, opacity: 0, duration: 0.8, delay: 0.2});
});

// === 1. التسجيل ===
function checkLogin() {
    const modal = document.getElementById('loginModal');
    if (!userData.isRegistered) {
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
        document.getElementById('headerName').innerText = userData.name;
        document.getElementById('userId').innerText = userData.id;
    }
}

function registerUser() {
    const name = document.getElementById('regName').value;
    const phone = document.getElementById('regPhone').value;

    if (name.length < 3 || phone.length < 10) return alert('يرجى إدخال بيانات صحيحة');

    userData.isRegistered = true;
    userData.name = name;
    userData.phone = phone;
    saveData();
    checkLogin();
}

function logout() {
    if(confirm('تسجيل خروج؟')) {
        localStorage.removeItem('keyInvestUser_v3');
        location.reload();
    }
}

// === 2. نظام الباقات (طلب الاشتراك) ===
function requestPlan(type, price) {
    // محاكاة لطلب الاشتراك - يذهب للأدمن (حالة قيد المراجعة)
    
    // التحقق اذا كان لديه طلب قيد المراجعة لنفس الباقة
    const hasPending = userData.plans.some(p => p.type === type && p.status === 'pending');
    if(hasPending) {
        return alert('لديك طلب اشتراك قيد المراجعة لهذه الباقة مسبقاً.');
    }

    if(confirm(`هل أنت متأكد من تقديم طلب اشتراك في باقة ${price.toLocaleString()} IQD؟\nسيقوم الأدمن بمراجعة الطلب وتفعيله.`)) {
        
        const newPlan = {
            id: Date.now(),
            type: type,
            price: price,
            status: 'pending', // الحالة الافتراضية: قيد المراجعة
            requestDate: new Date().toLocaleDateString(),
            startDate: null, // يتحدد عند التفعيل
            endDate: null // يتحدد عند التفعيل (بعد 4 شهور)
        };

        userData.plans.push(newPlan);
        saveData();
        updateUI();
        
        // الانتقال لصفحة الطلبات لرؤية الحالة
        switchTab('profile');
        alert('✅ تم إرسال طلب الاشتراك بنجاح!\nالحالة الحالية: قيد المراجعة من قبل الأدمن.');
    }
}

// === 3. تحديث الواجهة ===
function updateUI() {
    // تحديث الرصيد (محاكاة للأرباح)
    document.getElementById('walletBalance').innerText = userData.balance.toLocaleString() + ' IQD';
    
    // تحديث قائمة الاشتراكات في البروفايل
    const list = document.getElementById('myPlansList');
    list.innerHTML = '';
    
    let activeCount = 0;
    let pendingCount = 0;

    if(userData.plans.length === 0) {
        list.innerHTML = '<li style="text-align:center; color:#999; padding:10px;">لا توجد اشتراكات بعد</li>';
    } else {
        userData.plans.forEach(plan => {
            let statusText = '';
            let statusClass = '';

            if(plan.status === 'pending') {
                statusText = '⏳ قيد المراجعة';
                statusClass = 'pending';
                pendingCount++;
            } else if (plan.status === 'active') {
                statusText = '✅ نشط';
                statusClass = 'active';
                activeCount++;
            } else {
                statusText = '❌ مرفوض/منتهي';
                statusClass = '';
            }

            // اسم الباقة للعرض
            let planName = plan.type === 'starter' ? 'باقة 100 ألف' : (plan.type === 'pro' ? 'باقة 500 ألف' : 'باقة VIP');

            list.innerHTML += `
                <li class="req-item ${statusClass}">
                    <div>
                        <strong>${planName}</strong>
                        <div style="font-size:0.8rem; color:#777">${plan.requestDate}</div>
                    </div>
                    <div class="status-txt ${statusClass}">${statusText}</div>
                </li>
            `;
        });
    }

    document.getElementById('activePlansCount').innerText = activeCount;
    document.getElementById('pendingPlansCount').innerText = pendingCount;
}

// === 4. التنقل ===
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    
    const target = document.getElementById(tabId);
    if(target) {
        target.classList.add('active');
        // Animation
        gsap.fromTo(target, {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.3});
    }

    // تحديث الأزرار
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // تحديد الزر النشط يدوياً بناءً على التبويب
    if(tabId === 'home') document.querySelectorAll('.nav-item')[2].classList.add('active');
    if(tabId === 'store') document.querySelectorAll('.nav-item')[3].classList.add('active');
    if(tabId === 'profile') document.querySelectorAll('.nav-item')[0].classList.add('active');
    if(tabId === 'team') document.querySelectorAll('.nav-item')[1].classList.add('active');
    if(tabId === 'agents') document.querySelectorAll('.nav-item')[4].classList.add('active');
}

// === تخزين البيانات ===
function saveData() {
    localStorage.setItem('keyInvestUser_v3', JSON.stringify(userData));
}

// === (خاص بالمبرمج) محاكاة تفعيل الأدمن ===
// يمكنك استدعاء هذه الدالة من الكونسول لتجربة تفعيل اشتراك: adminActivatePlan()
function adminActivatePlan() {
    if(userData.plans.length > 0) {
        userData.plans[0].status = 'active';
        userData.plans[0].startDate = new Date().toLocaleDateString();
        // اضافة 4 شهور
        let end = new Date();
        end.setMonth(end.getMonth() + 4);
        userData.plans[0].endDate = end.toLocaleDateString();
        
        saveData();
        updateUI();
        console.log('تم تفعيل أول باقة بنجاح للمحاكاة');
        alert('Admin Action: تم تفعيل الباقة (محاكاة)');
    } else {
        console.log('لا توجد باقات');
    }
}
