document.addEventListener('DOMContentLoaded', async () => {
    
    // عناصر اصلی DOM
    const libraryView = document.getElementById('library-view');
    const bookView = document.getElementById('book-view');
    const backToLibraryBtn = document.getElementById('back-to-library');
    const book = document.getElementById('story-book');
    const pages = Array.from(document.querySelectorAll('.page'));
    const music = document.getElementById('background-music');
    const toggleMusicBtn = document.getElementById('toggle-music');
    const recordBtn = document.getElementById('record-btn');
    const playback = document.getElementById('playback');
    const connectWalletBtn = document.getElementById('connect-wallet');
    const sendRewardBtn = document.getElementById('send-reward');
    
    let currentPageIndex = 0;
    let isRecording = false;
    let mediaRecorder;
    let audioChunks = [];
    let isPlaying = false;


    // -------------------------------------------------------------------
    // --- ۰. منطق ادغام با تلگرام و TON Connect ---
    // -------------------------------------------------------------------
    let connector;
    
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready(); 
        document.body.style.backgroundColor = tg.themeParams.bg_color;
        
        console.log("Mini App آماده است. تم تلگرام اعمال شد.");

        // تنظیم دکمه اصلی (Main Button) تلگرام برای ارسال پاداش
        tg.MainButton.setText("💸 ارسال پاداش TON");
        tg.MainButton.onClick(() => {
            // فراخوانی مستقیم تابع ارسال پاداش
            if (connector && connector.connected) {
                handleSendReward();
            } else {
                alert("لطفاً ابتدا به کیف پول متصل شوید.");
            }
        });
        // دکمه اصلی در ابتدا مخفی است و با اتصال کیف پول یا ورود به کتاب فعال می‌شود
        tg.MainButton.hide(); 
    } else {
        console.log("در محیط تلگرام اجرا نمی‌شود. اجرای عادی.");
    }
    
    // --- تابع‌های TON Connect ---
    
    const manifestUrl = 'https://YOUR_HTTPS_DOMAIN/tonconnect-manifest.json'; // آدرس واقعی خود را جایگزین کنید!

    if (window.TonConnect) {
        connector = new window.TonConnect.TonConnect({
            manifestUrl: manifestUrl,
            storage: new window.TonConnect.TonConnect.IStorage(),
            connector: {
                platform: 'telegram-mini-app' 
            }
        });

        connector.onStatusChange(wallet => {
            if (wallet) {
                connectWalletBtn.textContent = `متصل به: ${wallet.account.address.slice(0, 6)}...`;
                sendRewardBtn.disabled = false;
                if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.MainButton.show();
            } else {
                connectWalletBtn.textContent = 'اتصال به کیف پول (TON Connect)';
                sendRewardBtn.disabled = true;
                if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.MainButton.hide();
            }
        });
    }

    connectWalletBtn.addEventListener('click', async () => {
        if (!connector) return;
        if (connector.connected) {
            await connector.disconnect();
        } else {
            // منطق اتصال کیف پول در مینی‌اپ
             try {
                const universalLink = await connector.connect({ isDapp: true, universalLink: true });
                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.openTelegramLink(universalLink);
                } else {
                    alert("لطفاً از مینی‌اپ تلگرام برای اتصال استفاده کنید.");
                }
            } catch (error) {
                console.error("خطا در ایجاد لینک اتصال:", error);
                alert("خطا در اتصال. لطفاً دوباره تلاش کنید.");
            }
        }
    });

    async function handleSendReward() {
        if (!connector || !connector.connected) return;
        
        const recipientAddress = 'EQCM3B-P4xMhR2w9D0pQW2B0Xq-E_b2Q582Y73qB9Qj8k-y1'; // آدرس مقصد را جایگزین کنید!
        const amount = '500000000'; // 0.5 TON (در نانو TON)
        
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 60,
            messages: [{ address: recipientAddress, amount: amount }],
        };
        
        try {
            const result = await connector.sendTransaction(transaction);
            alert(`پاداش ارسال شد! Hash: ${result.boc.slice(0, 10)}...`);
        } catch (error) {
            console.error('Transaction Failed:', error);
            alert("تراکنش ناموفق بود. مطمئن شوید که موجودی کافی دارید.");
        }
    }
    sendRewardBtn.addEventListener('click', handleSendReward);


    // -------------------------------------------------------------------
    // --- ۱. منطق کتابخانه و ناوبری ---
    // -------------------------------------------------------------------
    
    function showLibrary() {
        libraryView.style.display = 'block';
        bookView.style.display = 'none';
        backToLibraryBtn.style.display = 'none';
        // در کتابخانه، دکمه اصلی تلگرام را مخفی می‌کنیم
        if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.MainButton.hide(); 
    }
    
    function showBook(bookId) {
        // فعلا فقط یک کتاب داریم، پس فقط نمایش را جابجا می‌کنیم
        libraryView.style.display = 'none';
        bookView.style.display = 'flex'; // یا block
        backToLibraryBtn.style.display = 'inline-block';
        
        // اگر متصل باشیم، دکمه اصلی تلگرام را نشان می‌دهیم
        if (connector && connector.connected && window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.MainButton.show();
        }

        // اطمینان از اینکه کتاب از صفحه اول شروع می‌شود
        resetBook();
    }
    
    document.querySelectorAll('.book-cover').forEach(cover => {
        cover.addEventListener('click', (event) => {
            const bookId = event.currentTarget.getAttribute('data-book-id');
            showBook(bookId);
        });
    });

    backToLibraryBtn.addEventListener('click', showLibrary);
    
    // شروع برنامه با نمایش کتابخانه
    showLibrary(); 

    // -------------------------------------------------------------------
    // --- ۲. منطق ورق زدن و ریست ---
    // -------------------------------------------------------------------

    function resetBook() {
         // بازنشانی کتاب به صفحه اول
        currentPageIndex = 0;
        pages.forEach((page, index) => {
            page.classList.remove('current');
            page.style.transform = index === 0 ? 'rotateY(0deg)' : 'rotateY(180deg)';
            page.style.zIndex = index === 0 ? '10' : '9';
            if (index === 0) {
                page.classList.add('current');
            }
        });
    }

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
            oldPage.classList.remove('current');
            
            // اعمال transform برای افکت ورق زدن
            oldPage.style.transform = newIndex > currentPageIndex ? 'rotateY(-180deg)' : 'rotateY(180deg)';
            oldPage.style.zIndex = '9';
            
            const newPage = pages[newIndex];
            newPage.classList.add('current');
            newPage.style.transform = 'rotateY(0deg)';
            newPage.style.zIndex = '10';

            currentPageIndex = newIndex;
        }
    }

    document.querySelectorAll('.turn-page-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            turnPage(event.currentTarget.getAttribute('data-direction'));
        });
    });

    // -------------------------------------------------------------------
    // --- ۳. منطق کنترل موسیقی ---
    // -------------------------------------------------------------------

    toggleMusicBtn.addEventListener('click', () => {
        if (isPlaying) {
            music.pause();
            toggleMusicBtn.textContent = 'پخش موسیقی';
        } else {
            music.play().catch(error => {
                console.error("خطا در پخش موسیقی:", error);
                alert("لطفاً پخش خودکار صدا را فعال کنید.");
            });
            toggleMusicBtn.textContent = 'توقف موسیقی';
        }
        isPlaying = !isPlaying;
    });
    
    // -------------------------------------------------------------------
    // --- ۴. منطق رکورد صوتی ---
    // -------------------------------------------------------------------

    recordBtn.addEventListener('click', async () => {
        if (isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            recordBtn.textContent = 'شروع رکورد';
            recordBtn.style.backgroundColor = 'var(--tg-theme-button-color)';
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' }); 
                const audioUrl = URL.createObjectURL(audioBlob);
                playback.src = audioUrl;
                playback.style.display = 'block';
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            recordBtn.textContent = 'در حال رکورد... (برای توقف کلیک کنید)';
            recordBtn.style.backgroundColor = 'red'; 
            playback.style.display = 'none';

        } catch (err) {
            console.error('خطا در دسترسی به میکروفون:', err);
            alert('خطا: دسترسی به میکروفون داده نشد یا باید در HTTPS اجرا شود.');
        }
    });

    // -------------------------------------------------------------------
    // --- ۵. منطق نظردهی (شبیه‌سازی) ---
    // -------------------------------------------------------------------

    const submitCommentBtn = document.getElementById('submit-comment');
    submitCommentBtn.addEventListener('click', () => {
        const comment = document.getElementById('comment-field').value;
        if (comment.trim()) {
            console.log(`نظر ثبت شد: ${comment}`);
            alert(`نظر شما ثبت شد: "${comment}". (نیاز به سرور برای ذخیره‌سازی.)`);
            document.getElementById('comment-field').value = '';
        } else {
            alert("لطفاً نظری بنویسید.");
        }
    });
    
    // -------------------------------------------------------------------
    // --- ۶. منطق ری‌اکشن‌ها و ستاره‌ها (شبیه‌سازی) ---
    // -------------------------------------------------------------------

    // اگر می‌خواهید ری‌اکشن‌ها کار کنند، می‌توانید منطق شبیه‌سازی را اضافه کنید:
    // const reactionsCount = document.getElementById('reactions-count');
    // let currentReactions = 0;
    // document.getElementById('reaction-button').addEventListener('click', () => {
    //     currentReactions++;
    //     reactionsCount.textContent = currentReactions;
    // });
    
});
