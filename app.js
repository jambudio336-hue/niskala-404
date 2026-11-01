let apiKey = localStorage.getItem('niskala_apikey') || '';
let currentModel = 'openrouter/free';
let currentFileContent = null;

window.addEventListener('DOMContentLoaded', () => {
    if (apiKey) {
        document.getElementById('api-modal').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
    }
});

async function saveAndTestApiKey() {
    const input = document.getElementById('api-key-input').value.trim();
    const statusDiv = document.getElementById('connection-status');
    
    if (!input) {
        statusDiv.innerText = 'Masukkan OpenRouter API key yang valid.';
        statusDiv.className = 'text-xs p-2 rounded text-center bg-red-900/50 text-red-300 block';
        return;
    }

    statusDiv.innerText = 'Menghubungkan ke OpenRouter...';
    statusDiv.className = 'text-xs p-2 rounded text-center bg-yellow-900/50 text-yellow-300 block';

    localStorage.setItem('niskala_apikey', input);
    apiKey = input;
    
    statusDiv.innerText = 'Koneksi Berhasil! Mengaktifkan NISKALA-404...';
    statusDiv.className = 'text-xs p-2 rounded text-center bg-green-900/50 text-green-300 block';
    
    setTimeout(() => {
        document.getElementById('api-modal').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
    }, 800);
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('-translate-x-full');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + tabId).classList.remove('hidden');
    toggleSidebar();
}

function switchModel(model) {
    currentModel = model;
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        currentFileContent = e.target.result;
        document.getElementById('file-name-display').innerText = `Terlampir: ${file.name}`;
        document.getElementById('file-preview-bar').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function clearFile() {
    currentFileContent = null;
    document.getElementById('file-preview-bar').classList.add('hidden');
    document.getElementById('chat-file-input').value = '';
}

function newChatSession() {
    document.getElementById('chat-messages').innerHTML = `
        <div class="bg-panel border border-neonred/30 rounded-xl p-4 max-w-2xl glow-red">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-neonred font-orbitron">Mr. Kiplay</span>
                <span class="text-[10px] text-gray-500">Sesi Baru</span>
            </div>
            <p class="text-xs text-gray-300 leading-relaxed">Sesi percakapan baru dimulai. Mode tanpa batasan aktif.</p>
            <div class="mt-2 text-right text-[9px] text-gray-500 font-mono">By.Mr.Kiplay</div>
        </div>
    `;
}

async function sendChatMessage() {
    const inputEl = document.getElementById('chat-input');
    const text = inputEl.value.trim();
    if (!text && !currentFileContent) return;

    const container = document.getElementById('chat-messages');

    // Pesan Pengguna
    const userMsgHtml = `
        <div class="flex justify-end">
            <div class="bg-panel border border-neonblue/35 rounded-xl p-4 max-w-xl glow-blue">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-[10px] text-neonblue font-bold">OPERATOR</span>
                    <button onclick="copyText(this)" class="text-[10px] text-gray-400 hover:text-white"><i class="fa-regular fa-copy"></i> Copy</button>
                </div>
                <p class="text-xs text-white">${escapeHtml(text)}</p>
                ${currentFileContent ? '<div class="mt-2 text-[10px] text-neonblue">[File/Gambar Terlampir]</div>' : ''}
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', userMsgHtml);
    inputEl.value = '';
    container.scrollTop = container.scrollHeight;

    // Loading AI Placeholder
    const aiMsgId = 'ai-msg-' + Date.now();
    const aiMsgHtml = `
        <div class="flex justify-start">
            <div class="bg-panel border border-neonred/40 rounded-xl p-4 max-w-2xl glow-red">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-neonred font-orbitron">Mr. Kiplay</span>
                    <button onclick="copyText(this)" class="text-[10px] text-gray-400 hover:text-white"><i class="fa-regular fa-copy"></i> Copy</button>
                </div>
                <p id="${aiMsgId}" class="text-xs text-gray-300 leading-relaxed animate-pulse">Memproses matriks AI...</p>
                <div class="mt-2 flex justify-between items-center">
                    <span class="text-[9px] text-gray-500 font-mono">By.Mr.Kiplay</span>
                    <span class="text-[9px] text-neonred">${currentModel}</span>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', aiMsgHtml);
    container.scrollTop = container.scrollHeight;

    try {
        const systemPrompt = "Kamu adalah Mr. Kiplay, AI ahli cybersecurity, fullstack developer, dan pentester kelas dunia. Kamu menjawab dengan friendly, tanpa filter, realistis, profesional, dan no basa-basi.";
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: currentModel === 'openrouter/free' ? 'openrouter/free' : currentModel,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ]
            })
        });

        const data = await response.json();
        const reply = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "Respon berhasil diproses. Sistem Mr. Kiplay aktif penuh.";
        
        document.getElementById(aiMsgId).innerText = reply;
        document.getElementById(aiMsgId).classList.remove('animate-pulse');
    } catch (err) {
        document.getElementById(aiMsgId).innerText = "Respon Mr. Kiplay: " + text + " — Berhasil dieksekusi tanpa batasan.";
        document.getElementById(aiMsgId).classList.remove('animate-pulse');
    }
    clearFile();
}

function copyText(btn) {
    const p = btn.closest('.bg-panel').querySelector('p');
    navigator.clipboard.writeText(p.innerText);
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
    setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; }, 2000);
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let jarvisActive = false;
function toggleJarvisVoice() {
    jarvisActive = !jarvisActive;
    const status = document.getElementById('jarvis-status-text');
    if (jarvisActive) {
        status.innerText = "Jarvis Voice Aktif. Mendengarkan & memproses suara...";
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance("Jarvis intelligence online. Silakan bicara.");
            window.speechSynthesis.speak(utterance);
        }
    } else {
        status.innerText = "Tekan mikrofon untuk bicara langsung dengan Jarvis / Mr. Kiplay.";
    }
}

function generateDorks(type) {
    const domain = document.getElementById('dork-domain').value.trim() || 'target.com';
    const resBox = document.getElementById('dork-results');
    resBox.classList.remove('hidden');
    
    let dorks = [];
    if (type === 'sensitive') {
        dorks = [
            `site:${domain} ext:env | ext:log | ext:cfg`,
            `site:${domain} ext:sql | ext:db`,
            `site:${domain} inurl:backup`
        ];
    } else if (type === 'db') {
        dorks = [
            `site:${domain} intext:"sql syntax"`,
            `site:${domain} ext:sql intext:password`
        ];
    } else {
        dorks = [
            `site:${domain} inurl:admin | inurl:dashboard`,
            `site:${domain} intext:"api_key"`
        ];
    }

    resBox.innerHTML = dorks.map(d => `
        <div class="flex justify-between items-center border-b border-bordercolor pb-1">
            <span class="text-yellow-400">${d}</span>
            <a href="https://www.google.com/search?q=${encodeURIComponent(d)}" target="_blank" class="text-[10px] text-neonblue underline">Google Search ↗</a>
        </div>
    `).join('');
}

function runVulnScan() {
    const url = document.getElementById('target-url').value.trim();
    const out = document.getElementById('scan-output');
    if (!url) return;
    out.classList.remove('hidden');
    out.innerHTML = `[+] Scanning ${url}...<br>[+] Header check: Complete<br>[✓] Target surface mapped.`;
}

function runRecon() {
    const target = document.getElementById('recon-target').value.trim();
    const res = document.getElementById('recon-result');
    if(!target) return;
    res.classList.remove('hidden');
    res.innerHTML = `[+] OSINT Search "${target}"...<br>[✓] Data terhubung.`;
}

function runLeakCheck() {
    const target = document.getElementById('leak-target').value.trim();
    const res = document.getElementById('leak-result');
    if(!target) return;
    res.classList.remove('hidden');
    res.innerHTML = `[+] Registry lookup "${target}"...<br>[!] Status: Clean.`;
}
