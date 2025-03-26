/**
 * چت بات هوش مصنوعی با استفاده از API OpenRouter
 */

// تنظیمات اولیه و متغیرهای جهانی
const API_BASE_URL = 'https://openrouter.ai/api/v1';
let isConnected = false;
let currentModel = null;
let availableModels = [];
let filteredModels = [];
let autoResizeObserver = null;
let typingEffect = null;
let creativity = 0.7; // مقدار پیش‌فرض
let typingSpeed = 'medium'; // مقدار پیش‌فرض

// سرعت‌های تایپ (بر حسب میلی‌ثانیه بین هر حرف)
const TYPING_SPEEDS = {
    fast: 10,
    medium: 25,
    slow: 50
};

// المان‌های DOM
const dom = {
    modelSelect: document.getElementById('model-select'),
    modelSearch: document.getElementById('model-search'),
    messagesContainer: document.getElementById('messages'),
    messageForm: document.getElementById('message-form'),
    userInput: document.getElementById('user-input'),
    sendButton: document.querySelector('.send-btn'),
    chatHistory: document.querySelector('.chat-history'),
    newChatButton: document.querySelector('.new-chat-btn'),
    statusIndicator: document.querySelector('.status-indicator'),
    statusText: document.querySelector('.status-text'),
    themeToggle: document.querySelector('.theme-toggle'),
    settingsModal: document.getElementById('settings-modal'),
    saveSettingsButton: document.getElementById('save-settings'),
    closeModalButton: document.querySelector('.close-modal'),
    settingsButton: document.getElementById('settings-btn'),
    apiKeyInput: document.getElementById('api-key'),
    siteCodeInput: document.getElementById('site-code'),
    manualCodeInput: document.getElementById('manual-code'),
    creativitySlider: document.getElementById('creativity-slider'),
    creativityValue: document.getElementById('creativity-value'),
    typingSpeedSelect: document.getElementById('typing-speed'),
    chatSearch: document.getElementById('chat-search')
};

// مقداردهی اولیه
function init() {
    // بارگذاری کلید API
    const apiKey = Storage.getApiKey();
    if (apiKey) {
        dom.apiKeyInput.value = apiKey;
        checkConnection();
    } else {
        showSettingsModal();
    }
    
    // بارگذاری کد سایت
    const siteCode = Storage.getSiteCode();
    if (siteCode) {
        dom.siteCodeInput.value = siteCode;
    }
    
    // بارگذاری کد دستی
    const manualCode = Storage.getManualCode();
    if (manualCode) {
        dom.manualCodeInput.value = manualCode;
    }
    
    // بارگذاری میزان خلاقیت
    creativity = Storage.getCreativity();
    dom.creativitySlider.value = Math.round(creativity * 10);
    dom.creativityValue.textContent = creativity.toFixed(1);
    
    // بارگذاری سرعت تایپ
    typingSpeed = Storage.getTypingSpeed();
    dom.typingSpeedSelect.value = typingSpeed;
    
    // بارگذاری تم
    const theme = Storage.getTheme();
    setTheme(theme);
    
    // بارگذاری عبارت جستجوی مدل
    const searchQuery = Storage.getModelSearchQuery();
    if (searchQuery) {
        dom.modelSearch.value = searchQuery;
    }
    
    // تنظیم مدل‌های ذخیره شده
    const cachedModels = Storage.getModels();
    if (cachedModels && cachedModels.length > 0) {
        availableModels = cachedModels;
        filterModels(searchQuery);
    }
    
    // بارگذاری تاریخچه چت‌ها
    loadChatHistory();
    
    // بارگذاری چت فعال
    const activeChatId = Storage.getActiveChat();
    if (activeChatId) {
        loadChat(activeChatId);
    } else {
        createNewChat();
    }
    
    // تنظیم رویدادها
    setupEventListeners();
    
    // تنظیم observer برای تغییر اندازه خودکار textarea
    setupAutoResize();
}

// تنظیم رویدادها
function setupEventListeners() {
    // رویداد جستجوی مدل
    dom.modelSearch.addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();
        Storage.saveModelSearchQuery(query);
        filterModels(query);
    });
    
    // رویداد تغییر میزان خلاقیت
    dom.creativitySlider.addEventListener('input', function() {
        const value = parseInt(this.value) / 10;
        creativity = value;
        dom.creativityValue.textContent = value.toFixed(1);
    });
}

// فیلتر کردن مدل‌ها بر اساس عبارت جستجو
function filterModels(query) {
    if (!query) {
        filteredModels = [...availableModels];
    } else {
        filteredModels = availableModels.filter(model => 
            model.name.toLowerCase().includes(query.toLowerCase()) || 
            model.id.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    populateModelSelect();
}

// تنظیم تغییر اندازه خودکار برای textarea
function setupAutoResize() {
    // پاکسازی observer قبلی اگر وجود داشته باشد
    if (autoResizeObserver) {
        autoResizeObserver.disconnect();
    }
    
    // ایجاد یک observer برای تغییر ارتفاع textarea
    autoResizeObserver = new ResizeObserver(() => {
        adjustTextareaHeight();
    });
    
    // شروع مشاهده textarea
    autoResizeObserver.observe(dom.userInput);
    
    // تنظیم رویداد input برای تغییر ارتفاع
    dom.userInput.addEventListener('input', adjustTextareaHeight);
}

// تنظیم ارتفاع textarea بر اساس محتوا
function adjustTextareaHeight() {
    const textarea = dom.userInput;
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 150);
    textarea.style.height = `${newHeight}px`;
}

// بررسی اتصال به API
async function checkConnection() {
    updateConnectionStatus(false, 'در حال اتصال...');
    
    const apiKey = Storage.getApiKey();
    if (!apiKey) {
        updateConnectionStatus(false, 'نیاز به کلید API');
        return;
    }
    
    try {
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
        
        // اگر کد سایت تنظیم شده باشد، آن را به هدرها اضافه می‌کنیم
        const siteCode = Storage.getSiteCode();
        if (siteCode) {
            headers['HTTP-Referer'] = siteCode;
        }
        
        const response = await fetch(`${API_BASE_URL}/models`, {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`خطای HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.data) {
            availableModels = data.data;
            Storage.saveModels(availableModels);
            
            // جستجوی مدل‌ها با عبارت جستجوی ذخیره شده
            const searchQuery = Storage.getModelSearchQuery();
            filterModels(searchQuery);
            
            // بررسی آخرین مدل استفاده شده
            const lastModel = Storage.getLastModel();
            if (lastModel) {
                currentModel = lastModel;
                dom.modelSelect.value = lastModel;
            }
            
            updateConnectionStatus(true, 'متصل');
            isConnected = true;
        } else {
            throw new Error('داده‌های نامعتبر از API');
        }
    } catch (error) {
        console.error('خطا در بررسی اتصال:', error);
        updateConnectionStatus(false, 'خطا در اتصال');
        isConnected = false;
    }
}

// بروزرسانی وضعیت اتصال در رابط کاربری
function updateConnectionStatus(connected, message) {
    dom.statusIndicator.className = `status-indicator ${connected ? 'online' : 'offline'}`;
    dom.statusText.textContent = message;
}

// پر کردن لیست انتخاب مدل‌ها
function populateModelSelect() {
    dom.modelSelect.innerHTML = '<option value="">انتخاب مدل...</option>';
    
    // استفاده از filteredModels به جای availableModels
    filteredModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = `${model.name} (${model.context_length} tokens)`;
        dom.modelSelect.appendChild(option);
    });
    
    // بازیابی مدل ذخیره شده در چت فعال یا آخرین مدل استفاده شده
    const activeChat = getActiveChat();
    if (activeChat && activeChat.model) {
        dom.modelSelect.value = activeChat.model;
        currentModel = activeChat.model;
    } else {
        const lastModel = Storage.getLastModel();
        if (lastModel) {
            dom.modelSelect.value = lastModel;
            currentModel = lastModel;
        }
    }
}

// ایجاد چت جدید
function createNewChat() {
    const chatId = generateUniqueId();
    const newChat = {
        id: chatId,
        title: 'چت جدید',
        model: currentModel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
    };
    
    Storage.saveChat(newChat);
    Storage.saveActiveChat(chatId);
    
    loadChatHistory();
    loadChat(chatId);
}

// بارگذاری تاریخچه چت‌ها
function loadChatHistory() {
    const chats = Storage.getChats();
    const activeChatId = Storage.getActiveChat();
    const searchQuery = dom.chatSearch.value.trim().toLowerCase();
    
    dom.chatHistory.innerHTML = '';
    
    // مرتب‌سازی چت‌ها بر اساس زمان بروزرسانی (جدیدترین در بالا)
    chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === activeChatId ? 'active' : ''}`;
        chatItem.setAttribute('data-id', chat.id);
        
        // گرفتن اولین پیام کاربر به عنوان عنوان
        let title = chat.title;
        if (chat.messages && chat.messages.length > 0) {
            const firstUserMessage = chat.messages.find(msg => msg.role === 'user');
            if (firstUserMessage) {
                title = firstUserMessage.content.substring(0, 30);
                if (firstUserMessage.content.length > 30) {
                    title += '...';
                }
            }
        }
        
        // اگر عبارت جستجو وجود دارد، کلمات مطابق را پررنگ می‌کنیم
        if (searchQuery) {
            const regex = new RegExp(`(${searchQuery})`, 'gi');
            title = title.replace(regex, '<span class="highlight">$1</span>');
        }
        
        chatItem.innerHTML = title;
        
        chatItem.addEventListener('click', () => {
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
            });
            chatItem.classList.add('active');
            loadChat(chat.id);
        });
        
        dom.chatHistory.appendChild(chatItem);
    });
}

// بارگذاری یک چت
function loadChat(chatId) {
    const chat = Storage.getChat(chatId);
    if (!chat) return;
    
    Storage.saveActiveChat(chatId);
    
    // تنظیم مدل انتخاب شده
    if (chat.model) {
        dom.modelSelect.value = chat.model;
        currentModel = chat.model;
    }
    
    // نمایش پیام‌ها
    dom.messagesContainer.innerHTML = '';
    
    if (chat.messages && chat.messages.length > 0) {
        chat.messages.forEach(message => {
            addMessageToUI(message, false); // false: بدون افکت تایپ
        });
        
        // اسکرول به پایین
        setTimeout(() => {
            dom.messagesContainer.scrollTop = dom.messagesContainer.scrollHeight;
        }, 100);
    } else {
        // اگر پیامی نیست، پیام خوش‌آمدگویی نمایش داده شود
        const welcomeMessage = {
            role: 'system',
            content: 'به چت بات هوش مصنوعی خوش آمدید. لطفاً یک مدل را انتخاب کنید و پیام خود را بنویسید.'
        };
        addMessageToUI(welcomeMessage);
    }
}

// افزودن پیام به رابط کاربری
function addMessageToUI(message, withTypingEffect = true) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.role === 'user' ? 'user' : (message.role === 'system' ? 'system' : 'bot')}`;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    
    // تنها برای پیام‌های ربات، افکت تایپ اعمال می‌شود
    if (withTypingEffect && message.role === 'assistant') {
        contentElement.className += ' typing';
        messageElement.appendChild(contentElement);
        dom.messagesContainer.appendChild(messageElement);
        
        // شروع افکت تایپ
        startTypingEffect(contentElement, message.content);
    } else {
        // برای سایر پیام‌ها یا بدون افکت تایپ
        if (message.role === 'system') {
            contentElement.textContent = message.content;
        } else {
            contentElement.innerHTML = formatMessage(message.content);
        }
        
        messageElement.appendChild(contentElement);
        
        // افزودن تاریخ و زمان به پیام (به جز پیام‌های سیستمی)
        if (message.role !== 'system' && message.timestamp) {
            const date = new Date(message.timestamp);
            const dateElement = document.createElement('div');
            dateElement.className = 'message-date';
            dateElement.textContent = formatDate(date);
            messageElement.appendChild(dateElement);
            
            const timeElement = document.createElement('div');
            timeElement.className = 'message-time';
            timeElement.textContent = formatTime(date);
            messageElement.appendChild(timeElement);
        }
        
        dom.messagesContainer.appendChild(messageElement);
    }
}

// شروع افکت تایپ برای پیام‌ها
function startTypingEffect(element, text) {
    // اگر قبلاً افکت تایپی در حال اجراست، آن را متوقف کنیم
    if (typingEffect) {
        clearInterval(typingEffect);
    }
    
    // ابتدا محتوای متن را به HTML تبدیل می‌کنیم
    const formattedText = formatMessage(text);
    
    // سپس HTML را به متن ساده تبدیل می‌کنیم تا نشانه‌های HTML پردازش نشوند
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedText;
    const plainText = tempDiv.textContent;
    
    let index = 0;
    let htmlContent = '';
    
    // مشخص کردن سرعت تایپ بر اساس تنظیمات
    const speed = TYPING_SPEEDS[typingSpeed];
    
    typingEffect = setInterval(() => {
        if (index < plainText.length) {
            htmlContent += plainText.charAt(index);
            element.textContent = htmlContent;
            index++;
        } else {
            clearInterval(typingEffect);
            typingEffect = null;
            
            // پس از پایان تایپ، محتوای HTML کامل را نمایش می‌دهیم
            element.innerHTML = formattedText;
            element.classList.remove('typing');
            
            // افزودن زمان به پیام
            const messageElement = element.parentElement;
            const timestamp = new Date().toISOString();
            
            const timeElement = document.createElement('div');
            timeElement.className = 'message-time';
            timeElement.textContent = formatTime(timestamp);
            messageElement.appendChild(timeElement);
        }
    }, speed);
}

// ارسال پیام به API
async function sendMessage(message) {
    if (!isConnected || !currentModel) {
        addSystemMessage('لطفاً از اتصال و انتخاب یک مدل اطمینان حاصل کنید.');
        return null;
    }
    
    const apiKey = Storage.getApiKey();
    if (!apiKey) {
        addSystemMessage('کلید API تنظیم نشده است.');
        return null;
    }
    
    // دریافت همه پیام‌های چت فعال برای حفظ زمینه
    const activeChat = getActiveChat();
    const chatMessages = activeChat.messages || [];
    
    // آماده‌سازی پیام‌ها برای API
    const messages = chatMessages
        .filter(msg => msg.role !== 'system') // حذف پیام‌های سیستمی
        .map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    
    // افزودن پیام جدید
    messages.push({
        role: 'user',
        content: message
    });
    
    try {
        updateConnectionStatus(true, 'در حال پردازش...');
        
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
        
        // اگر کد سایت تنظیم شده باشد، آن را به هدرها اضافه می‌کنیم
        const siteCode = Storage.getSiteCode();
        if (siteCode) {
            headers['HTTP-Referer'] = siteCode;
        }
        
        const response = await fetch(`${API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: currentModel,
                messages: messages,
                temperature: creativity // استفاده از میزان خلاقیت تنظیم شده
            })
        });
        
        if (!response.ok) {
            throw new Error(`خطای HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.choices && data.choices.length > 0) {
            const assistantMessage = data.choices[0].message;
            updateConnectionStatus(true, 'متصل');
            return assistantMessage;
        } else {
            throw new Error('پاسخ نامعتبر از API');
        }
    } catch (error) {
        console.error('خطا در ارسال پیام:', error);
        updateConnectionStatus(false, 'خطا در ارسال');
        addSystemMessage(`خطا در ارسال پیام: ${error.message}`);
        return null;
    }
}

// افزودن پیام سیستمی به چت
function addSystemMessage(content) {
    const systemMessage = {
        role: 'system',
        content: content,
        timestamp: new Date().toISOString()
    };
    
    addMessageToUI(systemMessage);
}

// دریافت چت فعال
function getActiveChat() {
    const activeChatId = Storage.getActiveChat();
    return Storage.getChat(activeChatId);
}

// نمایش modal تنظیمات
function showSettingsModal() {
    dom.settingsModal.style.display = 'flex';
}

// پنهان کردن modal تنظیمات
function hideSettingsModal() {
    dom.settingsModal.style.display = 'none';
}

// تغییر تم
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        dom.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        dom.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    Storage.saveTheme(theme);
}

// تبدیل متن به HTML با پشتیبانی از markdown ساده
function formatMessage(text) {
    // کد بلاک‌ها
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // کد درون خطی
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // لینک‌ها
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // لیست‌ها
    text = text.replace(/^\s*[\*\-]\s+(.*)/gm, '<li>$1</li>');
    text = text.replace(/<li>(.*)<\/li>\s*<li>/g, '<li>$1</li><li>');
    text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // پاراگراف‌ها
    text = text.replace(/\n\n/g, '</p><p>');
    
    // خطوط جدید
    text = text.replace(/\n/g, '<br>');
    
    return `<p>${text}</p>`;
}

// فرمت زمان برای نمایش
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// فرمت تاریخ برای نمایش
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// تولید شناسه یکتا
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// رویدادها

// رویداد ارسال فرم
dom.messageForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const userMessage = dom.userInput.value.trim();
    if (!userMessage) return;
    
    // افزودن پیام کاربر به UI
    const message = {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
    };
    
    addMessageToUI(message);
    
    // ذخیره پیام کاربر
    Storage.addMessageToActiveChat(message);
    
    // بروزرسانی عنوان چت در سایدبار
    loadChatHistory();
    
    // پاک کردن ورودی
    dom.userInput.value = '';
    adjustTextareaHeight();
    
    // ارسال پیام به API
    const assistantMessage = await sendMessage(userMessage);
    
    if (assistantMessage) {
        // افزودن پاسخ هوش مصنوعی با افکت تایپ
        const botMessage = {
            role: 'assistant',
            content: assistantMessage.content,
            timestamp: new Date().toISOString()
        };
        
        addMessageToUI(botMessage, true); // true: با افکت تایپ
        
        // ذخیره پاسخ هوش مصنوعی
        Storage.addMessageToActiveChat(botMessage);
    }
});

// تغییر مدل
dom.modelSelect.addEventListener('change', (event) => {
    currentModel = event.target.value;
    
    if (currentModel) {
        // ذخیره آخرین مدل استفاده شده
        Storage.saveLastModel(currentModel);
    
        // ذخیره مدل در چت فعال
        const activeChatId = Storage.getActiveChat();
        if (activeChatId) {
            const chat = Storage.getChat(activeChatId);
            if (chat) {
                chat.model = currentModel;
                Storage.saveChat(chat);
            }
        }
    }
});

// دکمه چت جدید
dom.newChatButton.addEventListener('click', () => {
    createNewChat();
});

// دکمه تغییر تم
dom.themeToggle.addEventListener('click', () => {
    const currentTheme = Storage.getTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
});

// باز کردن تنظیمات با کلیک روی دکمه تنظیمات
dom.settingsButton.addEventListener('click', () => {
    showSettingsModal();
});

// باز کردن تنظیمات با کلیک روی وضعیت اتصال
document.querySelector('.connection-status').addEventListener('click', () => {
    showSettingsModal();
});

// ذخیره تنظیمات
dom.saveSettingsButton.addEventListener('click', () => {
    const apiKey = dom.apiKeyInput.value.trim();
    const siteCode = dom.siteCodeInput.value.trim();
    const manualCode = dom.manualCodeInput.value.trim();
    const creativityValue = parseFloat(dom.creativityValue.textContent);
    const typingSpeedValue = dom.typingSpeedSelect.value;
    
    if (apiKey) {
        Storage.saveApiKey(apiKey);
        Storage.saveSiteCode(siteCode);
        Storage.saveManualCode(manualCode);
        Storage.saveCreativity(creativityValue);
        Storage.saveTypingSpeed(typingSpeedValue);
        
        // بروزرسانی متغیرهای جهانی
        creativity = creativityValue;
        typingSpeed = typingSpeedValue;
        
        hideSettingsModal();
        checkConnection();
    } else {
        alert('لطفاً کلید API را وارد کنید!');
    }
});

// بستن تنظیمات
dom.closeModalButton.addEventListener('click', () => {
    hideSettingsModal();
});

// کلیک خارج از modal
dom.settingsModal.addEventListener('click', (event) => {
    if (event.target === dom.settingsModal) {
        hideSettingsModal();
    }
});

// رویداد جستجو در تاریخچه چت‌ها
dom.chatSearch.addEventListener('input', () => {
    loadChatHistory();
});

// شروع برنامه
init(); 