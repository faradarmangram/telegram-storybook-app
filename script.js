document.addEventListener('DOMContentLoaded', () => {
    
    // -------------------------------------------------------------------
    // --- ۰. منطق ادغام با تلگرام (جدید در گام ۲) ---
    // -------------------------------------------------------------------
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // اطمینان از آماده بودن مینی‌اپ
        tg.ready(); 
        
        // تنظیم رنگ پس‌زمینه اصلی بر اساس تم تلگرام
        document.body.style.backgroundColor = tg.themeParams.bg_color;
        
        console.log("Mini App آماده است. تم تلگرام اعمال شد.");

        // فعال‌سازی دکمه اصلی (Main Button) تلگرام برای ارسال پاداش
        tg.MainButton.setText("💸 ارسال پاداش TON");
        tg.MainButton.onClick(() => {
            // در فاز بعدی منطق TON Connect اینجا قرار می‌گیرد
            alert("آماده برای ارسال پاداش! نیاز به ادغام TON Connect.");
        });
        tg.MainButton.show(); // نمایش دکمه

    } else {
        console.log("در محیط تلگرام اجرا نمی‌شود. اجرای عادی.");
    }
    // -------------------------------------------------------------------


    const book = document.getElementById('story-book');
    const pages = Array.from(document.querySelectorAll('.page'));
    let currentPageIndex = 0;

    // --- ۱. منطق ورق زدن ---
    
    // در ابتدا، فقط صفحه اول (index 0) را به عنوان صفحه جاری تنظیم کن.
    pages.forEach((page, index) => {
        page.classList.remove('current', 'prev-turned');
        if (index === 0) {
            page.classList.add('current');
        }
    });

    /**
     * صفحه کتاب را ورق می‌زند (جلو یا عقب).
     * @param {string} direction 'next' یا 'prev'
     */
    function turnPage(direction) {
        const totalPages = pages.length;
        let newIndex = currentPageIndex;

        if (direction === 'next' && currentPageIndex < totalPages - 1) {
            newIndex++;
        } else if (direction === 'prev' && currentPageIndex > 0) {
            newIndex--;
        }

        if (newIndex !== currentPageIndex) {
            const oldPage = pages[currentPageIndex];
            const newPage = pages[newIndex];

            // منطق افکت ورق زدن:
            oldPage.classList.remove('current');
            
            // تنظیم transform برای ایجاد افکت بصری ورق خوردن
            if (newIndex > currentPageIndex) {
                 oldPage.style.transform = 'rotateY(-180deg)';
                 oldPage.style.zIndex = '9';
            } else { 
                 oldPage.style.transform = 'rotateY(180deg)';
                 oldPage.style.zIndex = '9';
            }
            
            newPage.classList.add('current');
            newPage.style.transform = 'rotateY(0deg)';
            newPage.style.zIndex = '10';

            currentPageIndex = newIndex;
        }
    }

    // اضافه کردن شنونده کلیک به تمام دکمه‌های ورق زدن
    document.querySelectorAll('.turn-page-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const direction = event.currentTarget.getAttribute('data-direction');
            turnPage(direction);
        });
    });


    // --- ۲. کنترل موسیقی متن ---
    const music = document.getElementById('background-music');
    const toggleMusicBtn = document.getElementById('toggle-music');
    let isPlaying = false;

    toggleMusicBtn.addEventListener('click', () => {
        if (isPlaying) {
            music.pause();
            toggleMusicBtn.textContent = 'پخش موسیقی';
        } else {
            music.play().catch(error => {
                console.error("خطا در پخش موسیقی:", error);
                alert("لطفاً پخش خودکار صدا را در تنظیمات مرورگر/تلگرام فعال کنید.");
            });
            toggleMusicBtn.textContent = 'توقف موسیقی';
        }
        isPlaying = !isPlaying;
    });
    
    
    // --- ۳. شبیه‌سازی تعاملات (رکورد، نظردهی، پاداش) ---

    // A. رکورد صوتی (فعلاً هشدار - منطق واقعی در گام بعدی)
    const recordBtn = document.getElementById('record-btn');
    recordBtn.addEventListener('click', () => {
        alert("قابلیت رکورد صدا در گام بعدی فعال می‌شود. (نیاز به HTTPS دارد.)");
    });
    
    // B. نظردهی 
    const submitCommentBtn = document.getElementById('submit-comment');
    submitCommentBtn.addEventListener('click', () => {
        const comment = document.getElementById('comment-field').value;
        if (comment.trim()) {
            alert(`نظر شما ثبت شد: "${comment}". (در نسخه نهایی به سرور ارسال می‌شود.)`);
            document.getElementById('comment-field').value = ''; // پاک کردن فیلد
        } else {
            alert("لطفاً نظری بنویسید.");
        }
    });

    // C. بلاکچین/پاداش 
    document.getElementById('connect-wallet').addEventListener('click', () => {
        alert("اتصال کیف پول TON در گام بعدی با استفاده از کتابخانه TON Connect SDK انجام خواهد شد.");
    });
    document.getElementById('send-reward').addEventListener('click', () => {
        alert("ارسال پاداش TON پس از اتصال کیف پول فعال خواهد شد.");
    });
    
});