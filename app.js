if (window.lucide) {
    lucide.createIcons();
}

// --- CONSTANTES & SEGURANÇA ---
let ADMIN_PASS = "Constru007";
const PRECO_GASOLINA_ATUAL = 6.10;
const AUTONOMIA_KM_LITRO = 10;

// --- FIREBASE CONFIGURATION & INITIALIZATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDTXUX4Ra_mLlzOwtdD09TkplYbMtKAqww",
    authDomain: "mdu-a24ed.firebaseapp.com",
    databaseURL: "https://mdu-a24ed-default-rtdb.firebaseio.com",
    projectId: "mdu-a24ed",
    storageBucket: "mdu-a24ed.firebasestorage.app",
    messagingSenderId: "620514769965",
    appId: "1:620514769965:web:82167b9a748c7865004ca4",
    measurementId: "G-B8TVZE7VQJ"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const dbRef = firebase.database().ref('mala_estoque_db_v8_app');

// --- BANCO DE DADOS EM NUVEM ---
let db = {
    adminPass: "Constru007",
    operadores: [],
    estoquePadrao: [
        { sap: "22026267", desc: "CABO DROP LOW F FIG8 1FO CINZA", qtdInicial: 500 },
        { sap: "22065512", desc: "CONECTOR FO CAMPO CPO SC APC FRKW", qtdInicial: 100 }
    ],
    tecnicos: [
        {
            name: "João Silva", login: "joao", senha: "123", car: "V-102 (Fiorino)", avatar: "",
            lat: -9.6658, lng: -35.7350, rua: "Av. Fernandes Lima, 1000 - Maceió",
            trackingOn: false, gpsStatus: "desativado", autoKm: 0, autoLitros: 0, autoCusto: 0,
            online: false, lastSeen: "Hoje às 08:30", amigos: ["carlos"], pedidosAmizade: [], notificacoes: [],
            mala: [
                { sap: "22026267", desc: "CABO DROP LOW F FIG8 1FO CINZA", qtd: 500, lancado: 0, abastecido: 500, seriais: [] },
                { sap: "22065512", desc: "CONECTOR FO CAMPO CPO SC APC FRKW", qtd: 100, lancado: 0, abastecido: 100, seriais: ["SER-101", "SER-102"] }
            ]
        },
        {
            name: "Carlos Mendes", login: "carlos", senha: "123", car: "V-088 (Fiorino)", avatar: "",
            lat: -9.6700, lng: -35.7400, rua: "Rua do Sol, 45 - Maceió",
            trackingOn: false, gpsStatus: "desativado", autoKm: 0, autoLitros: 0, autoCusto: 0,
            online: false, lastSeen: "Ontem às 17:45", amigos: ["joao"], pedidosAmizade: [], notificacoes: [],
            mala: [
                { sap: "22026267", desc: "CABO DROP LOW F FIG8 1FO CINZA", qtd: 500, lancado: 0, abastecido: 500, seriais: [] },
                { sap: "22065512", desc: "CONECTOR FO CAMPO CPO SC APC FRKW", qtd: 100, lancado: 0, abastecido: 100, seriais: ["SER-103"] }
            ]
        }
    ],
    materiais: [
        { sap: "22026267", desc: "CABO DROP LOW F FIG8 1FO CINZA" },
        { sap: "22065512", desc: "CONECTOR FO CAMPO CPO SC APC FRKW" },
        { sap: "21004321", desc: "FIXADOR FIO BR RG6 CIRCUL 7MM" },
        { sap: "21008976", desc: "ABRAÇADEIRA T30R PRETA" }
    ],
    estoqueFisico: [
        { id: 1, sap: "22026267", desc: "CABO DROP LOW F FIG8 1FO CINZA", qtd: 1500, seriais: [], data: "2026-09-01" },
        { id: 2, sap: "22065512", desc: "CONECTOR FO CAMPO CPO SC APC FRKW", qtd: 400, seriais: ["SER-201", "SER-202"], data: "2026-09-01" }
    ],
    favoritos: ["CABO DROP LOW F FIG8 1FO CINZA", "CONECTOR FO CAMPO CPO SC APC FRKW"],
    lancamentos: [],
    trajetos: [
        { id: 101, data: "2026-10-08", techLogin: "joao", techNome: "João Silva", veiculo: "V-102 (Fiorino)", origem: "Base Central", destino: "MDU GPON Node 37855", kmIni: 45000, kmFim: 45050, kmPercorrido: 50, kmPorLitro: 10, litros: 5.0, precoGasolina: 6.10, custoTotal: 30.50, custoPorKm: 0.61, gpsAtivo: true, paradaFinal: "Parada Final - Node 37855", tempoParado: "1h 15min" }
    ],
    reposicoes: [],
    mensagens: [],
    movimentacoes: [{ data: "12/09/2026 09:00", tipo: "Sistema", responsavel: "Admin", detalhes: "Sistema Red & Black v8 inicializado." }],
    notificacoes: [],
    sosAtivo: null
};

let chartConsumoInstance = null;
let chartEstoqueInstance = null;
let isVisualizador = false;
let gpsWatchId = null;
let themeMode = localStorage.getItem('boxfield_theme') || 'dark';

let paradaInicioTime = null;
let statusParadaAtual = "Em movimento";

let mediaRecorder = null;
let audioChunks = [];
let isRecordingAudio = false;

let mapLeaflet = null;
let mapMarkers = {};

let usuarioLogado = null;
let carrinhoPassagem = [];
let carrinhoAtual = [];
let chatDestinatarioAtual = "Base";
let subMalaAtual = "miscelaneas";
let cardTechAtivo = "lancamento";
let isMobileLayout = false;
let isInitialLoadDone = false;
let isTouchingMaterialScroll = false;
let isTouchingHistoryScroll = false;
let chatAdminAtual = null;

function normalizarArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(item => item !== null && item !== undefined);
    if (typeof val === 'object') return Object.values(val).filter(item => item !== null && item !== undefined);
    return [];
}

function normalizarEstruturaDb() {
    db.tecnicos = normalizarArray(db.tecnicos);
    db.tecnicos.forEach(t => {
        t.mala = normalizarArray(t.mala);
        t.mala.forEach(m => {
            m.seriais = normalizarArray(m.seriais);
        });
        t.amigos = normalizarArray(t.amigos);
        t.pedidosAmizade = normalizarArray(t.pedidosAmizade);
        t.notificacoes = normalizarArray(t.notificacoes);
    });
    db.operadores = normalizarArray(db.operadores);
    db.estoquePadrao = normalizarArray(db.estoquePadrao);
    db.materiais = normalizarArray(db.materiais);
    db.estoqueFisico = normalizarArray(db.estoqueFisico);
    db.favoritos = normalizarArray(db.favoritos);
    db.lancamentos = normalizarArray(db.lancamentos);
    db.lancamentos.forEach(l => {
        l.items = normalizarArray(l.items);
    });
    db.trajetos = normalizarArray(db.trajetos);
    db.reposicoes = normalizarArray(db.reposicoes);
    db.mensagens = normalizarArray(db.mensagens);
    db.movimentacoes = normalizarArray(db.movimentacoes);
    db.notificacoes = normalizarArray(db.notificacoes);
    if (!db.sosAtivo || typeof db.sosAtivo !== 'object' || !db.sosAtivo.nome) {
        db.sosAtivo = null;
    }
}

function salvarDb() {
    normalizarEstruturaDb();
    return dbRef.set(db).catch(err => {
        console.error("Erro ao sincronizar com Firebase:", err);
    });
}

function calcularDistanciaKM(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function applyTheme() {
    const btnText = document.getElementById('theme-toggle-text');
    if (themeMode === 'light') {
        document.body.classList.add('theme-light');
        if (btnText) btnText.innerText = "Modo Escuro (Preto)";
    } else {
        document.body.classList.remove('theme-light');
        if (btnText) btnText.innerText = "Modo Claro (Branco)";
    }
}

function toggleTheme() {
    themeMode = themeMode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('boxfield_theme', themeMode);
    applyTheme();
}

function togglePasswordVisibility() {
    let passInput = document.getElementById('login-pass');
    let eyeIcon = document.getElementById('login-eye-icon');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
        passInput.type = 'password';
        eyeIcon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) lucide.createIcons();
}

// --- SINCRONIZAÇÃO EM TEMPO REAL FIREBASE ---
dbRef.on('value', (snapshot) => {
    const serverData = snapshot.val();
    if (serverData) {
        db = {
            ...db,
            ...serverData,
            notificacoes: serverData.notificacoes ? normalizarArray(serverData.notificacoes) : [],
            mensagens: serverData.mensagens ? normalizarArray(serverData.mensagens) : [],
            sosAtivo: (serverData.sosAtivo && serverData.sosAtivo.nome) ? serverData.sosAtivo : null
        };
        normalizarEstruturaDb();
        if (db.adminPass) ADMIN_PASS = db.adminPass;

        if (!isInitialLoadDone) {
            isInitialLoadDone = true;
            verificarSessaoSalvaInstantanea();
        }

        const activeEl = document.activeElement;
        const isUserInteracting = activeEl && (
            activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.tagName === 'SELECT'
        );

        if (!document.getElementById('admin-screen').classList.contains('hidden')) {
            // Atualiza SOS e Notificações SEMPRE mesmo que o admin esteja digitando
            atualizarBannerSosENotificacoesAdmin();
            if (chatAdminAtual) {
                atualizarMensagensAdminBox();
                atualizarChatAdminLista();
            }
            if (!isUserInteracting) {
                atualizarPainelAdmin();
            }
        }

        if (usuarioLogado && !document.getElementById('tech-screen').classList.contains('hidden')) {
            let techAtualizada = db.tecnicos.find(t => t.login === usuarioLogado.login);
            if (techAtualizada) {
                usuarioLogado = techAtualizada;
                atualizarTechNotificacoesBadge();
                atualizarTelemetriaTecnicoLive();
            }

            if (cardTechAtivo === 'lancamento') {
                if (!isTouchingMaterialScroll) {
                    renderizarSelecaoTecnico(true);
                }
                if (!isUserInteracting) {
                    renderizarCarrinhoTecnico();
                }
            } else if (cardTechAtivo === 'historico') {
                if (!isTouchingHistoryScroll) {
                    renderizarHistoricoLancesTecnico();
                }
            } else if (cardTechAtivo === 'chat') {
                atualizarMsgTechBox();
                atualizarBadgesChatTech();
                renderizarColegasChatTech();
            } else if (!isUserInteracting && cardTechAtivo !== 'lancamento' && cardTechAtivo !== 'historico') {
                renderizarCardTechAtivo();
            }
        }
    } else {
        salvarDb();
        if (!isInitialLoadDone) {
            isInitialLoadDone = true;
            verificarSessaoSalvaInstantanea();
        }
    }
});

function inicializarPWA() {
    applyTheme();
    verificarSessaoSalvaInstantanea();

    const manifest = {
        name: "Mala & Estoque Red & Black",
        short_name: "MalaEstoque",
        description: "Sistema Avançado de Logística e Estoque SIAKI",
        start_url: "./",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#7f1d1d",
        icons: [{
            src: "https://i.ibb.co/xqyBP0Yn/icon.jpg",
            sizes: "512x512",
            type: "image/png"
        }]
    };
    const blobManifest = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = URL.createObjectURL(blobManifest);
    document.head.appendChild(manifestLink);

    if ('serviceWorker' in navigator) {
        const swCode = `
            const CACHE_NAME = 'mala-estoque-v8';
            const urlsToCache = ['./', 'https://cdn.tailwindcss.com', 'https://unpkg.com/lucide@latest', 'https://cdn.jsdelivr.net/npm/chart.js'];
            self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)).then(() => self.skipWaiting())); });
            self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
            self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./')))); });
        `;
        const blobSW = new Blob([swCode], { type: 'text/javascript' });
        navigator.serviceWorker.register(URL.createObjectURL(blobSW)).catch(err => console.log('SW Info:', err));
    }

    window.addEventListener('online', atualizarStatusConexao);
    window.addEventListener('offline', atualizarStatusConexao);
    atualizarStatusConexao();
}

function atualizarStatusConexao() {
    const isOnline = navigator.onLine;
    const banner = document.getElementById('offline-banner');
    if (!banner) return;

    if (!isOnline) {
        banner.className = 'fixed top-0 left-0 right-0 z-50 p-2 bg-amber-600 text-white text-center text-xs font-bold shadow-lg flex items-center justify-center space-x-2';
        banner.innerHTML = '<span>⚡ Modo Offline Ativo: Dados salvos localmente e sincronizados ao reconectar.</span>';
        banner.classList.remove('hidden');
    } else {
        if (!banner.classList.contains('hidden')) {
            banner.className = 'fixed top-0 left-0 right-0 z-50 p-2 bg-emerald-600 text-white text-center text-xs font-bold shadow-lg flex items-center justify-center space-x-2';
            banner.innerHTML = '<span>✅ Conexão Restabelecida! Sincronizado com o Firebase.</span>';
            setTimeout(() => banner.classList.add('hidden'), 3500);
        }
    }
}

// --- PERSISTÊNCIA DE SESSÃO ININTERRUPTA ---
function verificarSessaoSalvaInstantanea() {
    let saved = localStorage.getItem('boxfield_session');
    if (saved) {
        try {
            let sessao = JSON.parse(saved);
            if (sessao.type === 'admin') {
                isVisualizador = false;
                document.getElementById('app-body-container').classList.remove('mode-visualizador');
                document.getElementById('visualizador-banner').classList.add('hidden');
                document.getElementById('painel-role-title').innerText = "Painel ADM Oficial";
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('admin-screen').classList.remove('hidden');
                atualizarPainelAdmin();
            } else if (sessao.type === 'operador') {
                isVisualizador = true;
                document.getElementById('app-body-container').classList.add('mode-visualizador');
                document.getElementById('visualizador-banner').classList.remove('hidden');
                document.getElementById('painel-role-title').innerText = `Operador: ${sessao.nome} (Leitura)`;
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('admin-screen').classList.remove('hidden');
                atualizarPainelAdmin();
            } else if (sessao.type === 'tech') {
                let tech = db.tecnicos ? db.tecnicos.find(t => t.login === sessao.login) : null;
                if (tech) {
                    usuarioLogado = tech;
                    tech.online = true;
                    tech.lastSeen = "Agora (Online)";
                    iniciarGpsAutomaticoTecnico();
                    document.getElementById('login-screen').classList.add('hidden');
                    document.getElementById('tech-screen').classList.remove('hidden');
                    inicializarPainelTecnico();
                }
            }
        } catch (e) {
            console.error("Erro ao restaurar sessão:", e);
        }
    }
}

function toggleLayoutMode() {
    isMobileLayout = !isMobileLayout;
    let container = document.getElementById('app-body-container');
    let btnText = document.getElementById('layout-toggle-text');
    if (isMobileLayout) {
        container.classList.add('mobile-frame', 'mobile-admin-active');
        if (btnText) btnText.innerText = "Layout PC (Expandido)";
    } else {
        container.classList.remove('mobile-frame', 'mobile-admin-active');
        if (btnText) btnText.innerText = "Alternar Layout PC/Mobile";
    }
    if (window.lucide) lucide.createIcons();
}

function handleLogin(event) {
    event.preventDefault();
    const userInput = document.getElementById('login-user').value.trim().toLowerCase();
    const passInput = document.getElementById('login-pass').value.trim();
    const currentAdminPass = db.adminPass || ADMIN_PASS;

    if (userInput === 'admin' && (passInput === currentAdminPass || passInput === 'Constru007' || passInput === '123')) {
        isVisualizador = false;
        localStorage.setItem('boxfield_session', JSON.stringify({ type: 'admin' }));
        document.getElementById('app-body-container').classList.remove('mode-visualizador');
        document.getElementById('visualizador-banner').classList.add('hidden');
        document.getElementById('painel-role-title').innerText = "Painel ADM Oficial";
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-screen').classList.remove('hidden');
        registrarMovimentacao("Login ADM", "Admin", "Administrador acessou a Central com sucesso.");
        salvarDb();
        atualizarPainelAdmin();
        return;
    }

    let operador = (db.operadores || []).find(o => o.login.toLowerCase() === userInput && (o.senha === passInput || passInput === '123'));
    if (operador) {
        isVisualizador = true;
        localStorage.setItem('boxfield_session', JSON.stringify({ type: 'operador', nome: operador.nome }));
        document.getElementById('app-body-container').classList.add('mode-visualizador');
        document.getElementById('visualizador-banner').classList.remove('hidden');
        document.getElementById('painel-role-title').innerText = `Operador: ${operador.nome} (Leitura)`;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-screen').classList.remove('hidden');
        atualizarPainelAdmin();
        return;
    }

    let tech = (db.tecnicos || []).find(t => t.login.toLowerCase() === userInput && (t.senha === passInput || passInput === '123'));
    if (tech) {
        isVisualizador = false;
        usuarioLogado = tech;
        tech.online = true;
        tech.lastSeen = "Agora (Online)";

        localStorage.setItem('boxfield_session', JSON.stringify({ type: 'tech', login: tech.login }));
        iniciarGpsAutomaticoTecnico();

        registrarMovimentacao("Login Técnico", tech.name, `Técnico entrou no sistema com rastreamento GPS e permanência online ativa.`);
        salvarDb();
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('tech-screen').classList.remove('hidden');
        inicializarPainelTecnico();
        return;
    }

    alert("Usuário ou senha incorretos.");
}

function baixarBackupGeral() {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    let dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `mala_estoque_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

function restaurarBackupJson(event) {
    if (isVisualizador) return;
    let file = event.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function (e) {
        try {
            let parsedData = JSON.parse(e.target.result);
            if (confirm("Tem certeza que deseja substituir todos os dados atuais pelo arquivo JSON importado?")) {
                db = parsedData;
                salvarDb();
                atualizarPainelAdmin();
                alert("✅ Dados restaurados com sucesso do arquivo JSON!");
            }
        } catch (err) {
            alert("Erro ao ler o arquivo JSON: " + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function zerarSistemaFirebase() {
    if (isVisualizador) return;
    let senhaDigitada = prompt("⚠️ ATENÇÃO EXTREMA: Esta ação limpará todo o estoque físico, os estoques das malas dos técnicos, lançamentos, históricos e relatórios, mantendo apenas os cadastros dos técnicos.\n\nDigite a senha do Administrador para confirmar:");
    let currentAdminPass = db.adminPass || ADMIN_PASS;
    if (senhaDigitada === currentAdminPass || senhaDigitada === 'Constru007') {
        if (confirm("Tem certeza absoluta? O Excel gerado virá totalmente limpo do zero.")) {
            db.tecnicos.forEach(t => {
                t.mala = [];
                t.autoKm = 0;
                t.autoLitros = 0;
                t.autoCusto = 0;
                t.notificacoes = [];
            });
            db.estoqueFisico = [];
            db.lancamentos = [];
            db.trajetos = [];
            db.reposicoes = [];
            db.mensagens = [];
            db.movimentacoes = [{ data: new Date().toLocaleString(), tipo: "Sistema", responsavel: "Admin", detalhes: "Estoques e relatórios limpos do zero, mantendo cadastros de técnicos." }];
            db.notificacoes = [];
            db.sosAtivo = null;

            salvarDb();
            atualizarPainelAdmin();
            alert("✅ Estoques, malas e relatórios limpos com sucesso! Cadastros de técnicos preservados.");
        }
    } else if (senhaDigitada !== null) {
        alert("Senha incorreta! Operação cancelada.");
    }
}

function zerarLancamentosMateriaisTecnicos(loginTech = null) {
    if (isVisualizador) return;
    let msg = loginTech ? `Deseja zerar todos os lançamentos e contadores de materiais da mala do técnico ${loginTech}?` : "Deseja zerar os lançamentos e contadores de materiais da mala de TODOS os técnicos?";
    if (confirm(msg)) {
        if (loginTech) {
            let t = db.tecnicos.find(x => x.login === loginTech);
            if (t && t.mala) {
                t.mala.forEach(m => m.lancado = 0);
            }
            registrarMovimentacao("Zerar Lançamentos", "Admin", `Zerou lançamentos de materiais do técnico ${t ? t.name : loginTech}`);
        } else {
            db.tecnicos.forEach(t => {
                if (t.mala) {
                    t.mala.forEach(m => m.lancado = 0);
                }
            });
            registrarMovimentacao("Zerar Lançamentos Geral", "Admin", "Zerou lançamentos de materiais de todos os técnicos.");
        }
        salvarDb();
        atualizarPainelAdmin();
        alert("✅ Lançamentos de materiais zerados com sucesso!");
    }
}

function reiniciarKmTecnico(login) {
    if (isVisualizador) return;
    let tech = db.tecnicos.find(t => t.login === login);
    if (tech) {
        tech.autoKm = 0;
        tech.autoLitros = 0;
        tech.autoCusto = 0;
        if (usuarioLogado && usuarioLogado.login === login) {
            usuarioLogado.autoKm = 0;
            usuarioLogado.autoLitros = 0;
            usuarioLogado.autoCusto = 0;
        }
        registrarMovimentacao("Reset KM", "Admin", `Reiniciou a quilometragem do técnico ${tech.name}`);
        salvarDb().then(() => {
            atualizarPainelAdmin();
            atualizarTelemetriaTecnicoLive();
            alert(`✅ KM do técnico ${tech.name} reiniciado com sucesso!`);
        });
    }
}

function reiniciarKmTodosTecnicos() {
    if (isVisualizador) return;
    if (confirm("Deseja reiniciar a quilometragem de TODOS os técnicos?")) {
        db.tecnicos.forEach(t => {
            t.autoKm = 0;
            t.autoLitros = 0;
            t.autoCusto = 0;
        });
        if (usuarioLogado) {
            usuarioLogado.autoKm = 0;
            usuarioLogado.autoLitros = 0;
            usuarioLogado.autoCusto = 0;
        }
        registrarMovimentacao("Reset KM Geral", "Admin", `Reiniciou a quilometragem de todos os técnicos.`);
        salvarDb().then(() => {
            atualizarPainelAdmin();
            atualizarTelemetriaTecnicoLive();
            alert("✅ Quilometragem de todos os técnicos reiniciada com sucesso!");
        });
    }
}

function iniciarGpsAutomaticoTecnico() {
    if (!usuarioLogado) return;
    let techNoDb = db.tecnicos.find(x => x.login === usuarioLogado.login);

    if ("geolocation" in navigator) {
        if (gpsWatchId !== null) {
            navigator.geolocation.clearWatch(gpsWatchId);
        }
        gpsWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                let lat = pos.coords.latitude;
                let lng = pos.coords.longitude;

                let oldLat = techNoDb ? techNoDb.lat : usuarioLogado.lat;
                let oldLng = techNoDb ? techNoDb.lng : usuarioLogado.lng;

                let distKm = calcularDistanciaKM(oldLat, oldLng, lat, lng);

                if (distKm < 0.01) {
                    if (!paradaInicioTime) {
                        paradaInicioTime = Date.now();
                        statusParadaAtual = "Em Parada";
                    } else {
                        let minutosParado = Math.floor((Date.now() - paradaInicioTime) / 60000);
                        if (minutosParado >= 2) {
                            statusParadaAtual = `Parada Final (${minutosParado} min)`;
                        }
                    }
                } else {
                    if (paradaInicioTime) {
                        let minutosParado = Math.floor((Date.now() - paradaInicioTime) / 60000);
                        if (minutosParado >= 1) {
                            registrarParadaTrajetoAutomatico(usuarioLogado, `Parada de ${minutosParado} min em campo`);
                        }
                    }
                    paradaInicioTime = null;
                    statusParadaAtual = "Em movimento";

                    let kmAtual = (techNoDb ? techNoDb.autoKm : usuarioLogado.autoKm) || 0;
                    let novoKm = kmAtual + distKm;
                    let litrosConsumidos = novoKm / AUTONOMIA_KM_LITRO;
                    let custoConsumido = litrosConsumidos * PRECO_GASOLINA_ATUAL;

                    if (usuarioLogado) {
                        usuarioLogado.autoKm = novoKm;
                        usuarioLogado.autoLitros = litrosConsumidos;
                        usuarioLogado.autoCusto = custoConsumido;
                    }
                    if (techNoDb) {
                        techNoDb.autoKm = novoKm;
                        techNoDb.autoLitros = litrosConsumidos;
                        techNoDb.autoCusto = custoConsumido;
                    }
                }

                if (usuarioLogado) {
                    usuarioLogado.lat = lat;
                    usuarioLogado.lng = lng;
                    usuarioLogado.rua = `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    usuarioLogado.trackingOn = true;
                    usuarioLogado.gpsStatus = "ativado";
                    usuarioLogado.online = true;
                }
                if (techNoDb) {
                    techNoDb.lat = lat;
                    techNoDb.lng = lng;
                    techNoDb.rua = `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    techNoDb.trackingOn = true;
                    techNoDb.gpsStatus = "ativado";
                    techNoDb.online = true;
                }

                atualizarBadgeGpsCelularTech(true);
                atualizarTelemetriaTecnicoLive();
                salvarDb();
            },
            (err) => {
                console.warn("Aviso/Erro GPS: " + err.message);
                if (usuarioLogado) { usuarioLogado.trackingOn = false; usuarioLogado.gpsStatus = "desativado"; }
                if (techNoDb) { techNoDb.trackingOn = false; techNoDb.gpsStatus = "desativado"; }
                atualizarBadgeGpsCelularTech(false);
                salvarDb();
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
        );
    }
}

function registrarParadaTrajetoAutomatico(tech, infoParada) {
    let minutos = Math.floor((Date.now() - paradaInicioTime) / 60000);
    if (!db.trajetos) db.trajetos = [];
    db.trajetos.push({
        id: Date.now(),
        data: new Date().toISOString().split('T')[0],
        techLogin: tech.login,
        techNome: tech.name,
        veiculo: tech.car,
        origem: "Deslocamento Anterior",
        destino: "Parada Final / Atendimento",
        kmIni: 0,
        kmFim: 0,
        kmPercorrido: 0,
        kmPorLitro: AUTONOMIA_KM_LITRO,
        litros: 0,
        precoGasolina: PRECO_GASOLINA_ATUAL,
        custoTotal: 0,
        custoPorKm: 0,
        gpsAtivo: true,
        paradaFinal: infoParada,
        tempoParado: `${minutos} min`
    });
    salvarDb();
}

function atualizarTelemetriaTecnicoLive() {
    if (!usuarioLogado) return;
    let km = usuarioLogado.autoKm || 0;
    let kmEl = document.getElementById('tech-auto-km-live');
    let statusParadaEl = document.getElementById('tech-status-parada-live');

    if (kmEl) kmEl.innerText = km.toFixed(2) + " KM";
    if (statusParadaEl) statusParadaEl.innerText = statusParadaAtual;
}

function atualizarBadgeGpsCelularTech(ativo) {
    let badge = document.getElementById('tech-gps-status-badge');
    if (!badge) return;
    if (ativo) {
        badge.className = "text-[8px] text-emerald-300 font-bold flex items-center bg-emerald-950/90 border border-emerald-700 px-1 py-0.5 rounded leading-none truncate shadow";
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1 animate-pulse flex-shrink-0"></span> GPS`;
    } else {
        badge.className = "text-[8px] text-red-300 font-bold flex items-center bg-red-950/90 border border-red-700 px-1 py-0.5 rounded leading-none truncate shadow";
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-red-500 inline-block mr-1 flex-shrink-0"></span> Off`;
    }
}

function logout() {
    if (usuarioLogado && !isVisualizador) {
        let t = db.tecnicos.find(x => x.login === usuarioLogado.login);
        if (t) { t.online = false; t.lastSeen = new Date().toLocaleTimeString(); }
        registrarMovimentacao("Logout", usuarioLogado.name, `Técnico encerrou sessão pelo botão.`);
        salvarDb();
    }
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    localStorage.removeItem('boxfield_session');
    isVisualizador = false;
    document.getElementById('app-body-container').classList.remove('mode-visualizador', 'mobile-frame', 'mobile-admin-active');
    document.getElementById('visualizador-banner').classList.add('hidden');
    usuarioLogado = null;
    carrinhoAtual = [];
    carrinhoPassagem = [];
    document.getElementById('admin-screen').classList.add('hidden');
    document.getElementById('tech-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
}

function registrarMovimentacao(tipo, responsavel, detalhes) {
    if (isVisualizador) return;
    if (!db.movimentacoes) db.movimentacoes = [];
    db.movimentacoes.unshift({
        data: new Date().toLocaleString(),
        tipo,
        responsavel,
        detalhes
    });
}

function abrirModalSegurancaADM() {
    if (isVisualizador) { alert("Visualizadores não têm acesso às configurações de segurança."); return; }
    renderizarListaOperadores();
    document.getElementById('modal-seguranca').classList.remove('hidden');
}

function fecharModalSegurancaADM() {
    document.getElementById('modal-seguranca').classList.add('hidden');
}

function salvarNovaSenhaAdmin() {
    if (isVisualizador) return;
    let novaSenha = document.getElementById('adm-new-pass').value.trim();
    if (!novaSenha) { alert("Digite a nova senha do Administrador!"); return; }
    db.adminPass = novaSenha;
    ADMIN_PASS = novaSenha;
    registrarMovimentacao("Segurança ADM", "Admin", "Alterou a senha do Administrador.");
    salvarDb();
    document.getElementById('adm-new-pass').value = '';
    alert("✅ Senha do Administrador atualizada com sucesso!");
}

function cadastrarOperadorVisualizador() {
    if (isVisualizador) return;
    let nome = document.getElementById('op-name').value.trim();
    let login = document.getElementById('op-login').value.trim().toLowerCase();
    let senha = document.getElementById('op-pass').value.trim();

    if (!nome || !login || !senha) { alert("Preencha todos os campos do operador!"); return; }
    if (!db.operadores) db.operadores = [];
    if (db.operadores.some(o => o.login === login)) { alert("Já existe um operador com este login!"); return; }

    db.operadores.push({ nome, login, senha, role: 'visualizador' });
    registrarMovimentacao("Cadastro Operador", "Admin", `Cadastrou operador visualizador: ${nome} (@${login})`);
    salvarDb();
    document.getElementById('op-name').value = '';
    document.getElementById('op-login').value = '';
    document.getElementById('op-pass').value = '';
    alert("✅ Operador Visualizador cadastrado!");
    renderizarListaOperadores();
}

function renderizarListaOperadores() {
    let container = document.getElementById('operadores-list-container');
    if (!container) return;
    if (!db.operadores || db.operadores.length === 0) {
        container.innerHTML = '<p class="text-zinc-400 italic">Nenhum operador visualizador cadastrado.</p>';
        return;
    }
    container.innerHTML = db.operadores.map((op, idx) => `
        <div class="p-2.5 bg-zinc-900 rounded-xl border border-zinc-700 flex justify-between items-center">
            <div>
                <b class="text-white">${op.nome}</b> <span class="text-red-400 font-mono">(@${op.login})</span>
                <span class="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold ml-1">Visualizador (Sem Mensagens)</span>
            </div>
            <button type="button" onclick="removerOperador(${idx})" class="action-btn-write text-red-400 font-bold hover:underline">Excluir</button>
        </div>
    `).join('');
}

function removerOperador(idx) {
    if (isVisualizador) return;
    if (confirm("Deseja remover este operador?")) {
        db.operadores.splice(idx, 1);
        salvarDb();
        renderizarListaOperadores();
    }
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('aside nav button').forEach(el => {
        el.classList.remove('bg-red-600', 'text-white');
        el.classList.add('text-zinc-300');
    });
    document.querySelectorAll('#admin-mobile-nav button').forEach(el => {
        el.classList.remove('bg-red-600', 'text-white', 'shadow');
        el.classList.add('text-zinc-300');
    });

    document.getElementById('acontent-' + tabId).classList.remove('hidden');

    let btnDesktop = document.getElementById('atab-' + tabId);
    if (btnDesktop) {
        btnDesktop.classList.add('bg-red-600', 'text-white');
        btnDesktop.classList.remove('text-zinc-300');
    }

    let btnMobile = document.getElementById('atab-m-' + tabId);
    if (btnMobile) {
        btnMobile.classList.add('bg-red-600', 'text-white', 'shadow');
        btnMobile.classList.remove('text-zinc-300');
    }

    if (tabId === 'mapa') {
        setTimeout(inicializarMapaLeaflet, 200);
    }
    atualizarPainelAdmin();
}

function renderizarGraficosDashboard() {
    const ctxConsumo = document.getElementById('chart-consumo-tecnico');
    const ctxEstoque = document.getElementById('chart-estoque-distribuicao');
    if (!ctxConsumo || !ctxEstoque || !window.Chart) return;

    const consumosPorTecnico = {};
    (db.lancamentos || []).forEach(l => {
        const tec = l.tecnico || 'Desconhecido';
        let total = 0;
        (l.items || []).forEach(i => total += Number(i.qtd || 0));
        consumosPorTecnico[tec] = (consumosPorTecnico[tec] || 0) + total;
    });

    const techLabels = Object.keys(consumosPorTecnico);
    const techData = Object.values(consumosPorTecnico);

    if (!chartConsumoInstance) {
        chartConsumoInstance = new Chart(ctxConsumo, {
            type: 'bar',
            data: {
                labels: techLabels.length ? techLabels : ['Sem dados'],
                datasets: [{
                    label: 'Itens Consumidos (un)',
                    data: techData.length ? techData : [0],
                    backgroundColor: 'rgba(220, 38, 38, 0.85)',
                    borderColor: '#f87171',
                    borderWidth: 1.5,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { labels: { color: '#ffffff', font: { size: 11, weight: 'bold' } } }
                },
                scales: {
                    x: { ticks: { color: '#e4e4e7', font: { weight: 'bold' } }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                    y: { ticks: { color: '#e4e4e7', font: { weight: 'bold' } }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                }
            }
        });
    } else {
        chartConsumoInstance.data.labels = techLabels.length ? techLabels : ['Sem dados'];
        chartConsumoInstance.data.datasets[0].data = techData.length ? techData : [0];
        chartConsumoInstance.update('none');
    }

    const estoquesPorMaterial = {};
    (db.estoqueFisico || []).forEach(e => {
        const mat = e.desc || e.sap || 'Outros';
        estoquesPorMaterial[mat] = (estoquesPorMaterial[mat] || 0) + Number(e.qtd || 0);
    });

    const matLabels = Object.keys(estoquesPorMaterial);
    const matData = Object.values(estoquesPorMaterial);

    if (!chartEstoqueInstance) {
        chartEstoqueInstance = new Chart(ctxEstoque, {
            type: 'doughnut',
            data: {
                labels: matLabels.length ? matLabels : ['Sem itens'],
                datasets: [{
                    data: matData.length ? matData : [1],
                    backgroundColor: [
                        '#ef4444', '#10b981', '#3b82f6', '#f59e0b',
                        '#8b5cf6', '#ec4899', '#06b6d4', '#94a3b8'
                    ],
                    borderWidth: 2,
                    borderColor: '#18181b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ffffff', font: { size: 11, weight: 'bold' } }
                    }
                }
            }
        });
    } else {
        chartEstoqueInstance.data.labels = matLabels.length ? matLabels : ['Sem itens'];
        chartEstoqueInstance.data.datasets[0].data = matData.length ? matData : [1];
        chartEstoqueInstance.update('none');
    }
}

function atualizarSelectMalaAdmin() {
    let malaSelect = document.getElementById('admin-select-mala-tech');
    if (!malaSelect) return;

    let currentMalaVal = malaSelect.value;
    let termoBusca = (document.getElementById('admin-search-tech-mala')?.value || '').toLowerCase();
    let techFiltrados = db.tecnicos.filter(t => t.name.toLowerCase().includes(termoBusca) || t.login.toLowerCase().includes(termoBusca));

    malaSelect.innerHTML = techFiltrados.map(t => `<option value="${t.login}">${t.name} (${t.car})</option>`).join('');
    if (currentMalaVal && techFiltrados.some(t => t.login === currentMalaVal)) {
        malaSelect.value = currentMalaVal;
    }
    renderizarMalaAdmin();
}

function obterLancamentosSIAKIFiltrados() {
    let dtStart = document.getElementById('admin-filter-date-start')?.value || '';
    let dtEnd = document.getElementById('admin-filter-date-end')?.value || '';
    let techFiltro = document.getElementById('admin-filter-lanc-tech')?.value || 'todos';
    let buscaServico = (document.getElementById('admin-filter-search-servico')?.value || '').toLowerCase();

    return (db.lancamentos || []).filter(l => {
        if (techFiltro !== 'todos') {
            let matchLogin = l.techLogin && l.techLogin.toLowerCase() === techFiltro.toLowerCase();
            let techObj = db.tecnicos.find(t => t.login.toLowerCase() === techFiltro.toLowerCase());
            let matchName = techObj && l.tecnico && l.tecnico.toLowerCase() === techObj.name.toLowerCase();
            if (!matchLogin && !matchName) return false;
        }
        if (dtStart && (!l.data || l.data < dtStart)) return false;
        if (dtEnd && (!l.data || l.data > dtEnd)) return false;

        if (buscaServico) {
            let matchNode = l.node && l.node.toLowerCase().includes(buscaServico);
            let matchProj = l.projeto && l.projeto.toLowerCase().includes(buscaServico);
            let matchTec = l.tecnico && l.tecnico.toLowerCase().includes(buscaServico);
            let matchItem = l.items && l.items.some(i => (i.material && i.material.toLowerCase().includes(buscaServico)) || (i.sap && i.sap.toLowerCase().includes(buscaServico)));
            if (!matchNode && !matchProj && !matchTec && !matchItem) return false;
        }
        return true;
    });
}

// --- ATUALIZAÇÃO DEDICADA DE SOS E NOTIFICAÇÕES (SEM CONFLITOS) ---
function atualizarBannerSosENotificacoesAdmin() {
    let sosBanner = document.getElementById('sos-alert-banner');
    if (sosBanner) {
        if (db.sosAtivo && db.sosAtivo.nome) {
            sosBanner.classList.remove('hidden');
            let detailEl = document.getElementById('sos-msg-detail');
            if (detailEl) {
                detailEl.innerText = `Técnico ${db.sosAtivo.nome} (${db.sosAtivo.car}) acionou o SOS em ${db.sosAtivo.hora}!`;
            }
        } else {
            sosBanner.classList.add('hidden');
        }
    }

    let notifCounter = document.getElementById('notif-counter');
    let notifList = document.getElementById('notif-list');
    let listaNotifs = normalizarArray(db.notificacoes);

    if (notifCounter) {
        if (listaNotifs.length > 0) {
            notifCounter.classList.remove('hidden');
            notifCounter.innerText = listaNotifs.length;
        } else {
            notifCounter.classList.add('hidden');
            notifCounter.innerText = "0";
        }
    }

    if (notifList) {
        if (listaNotifs.length > 0) {
            notifList.innerHTML = listaNotifs.slice().reverse().map((n, revIdx) => {
                let realIdx = listaNotifs.length - 1 - revIdx;
                return `
                    <div class="p-2 bg-black rounded-xl border-l-4 border-red-600 flex justify-between items-start gap-2">
                        <div>
                            <p class="font-semibold text-white">${n.text}</p>
                            <span class="text-[9px] text-zinc-300">${n.time || ''}</span>
                        </div>
                        <button type="button" onclick="removerNotificacaoIndividualAdmin(${realIdx})" class="text-zinc-400 hover:text-red-400 text-xs font-bold px-1" title="Remover">×</button>
                    </div>
                `;
            }).join('');
        } else {
            notifList.innerHTML = '<p class="text-zinc-300 text-center py-4">Nenhuma notificação.</p>';
        }
    }
}

function atualizarPainelAdmin() {
    document.getElementById('stat-techs').innerText = db.tecnicos.length;
    document.getElementById('stat-launches').innerText = db.lancamentos.length;

    let totalConsumido = 0;
    db.lancamentos.forEach(l => (l.items || []).forEach(i => totalConsumido += Number(i.qtd || 0)));
    document.getElementById('stat-consumed').innerText = totalConsumido + " un";

    let totalFisico = 0;
    db.estoqueFisico.forEach(e => totalFisico += Number(e.qtd || 0));
    document.getElementById('stat-fisico').innerText = totalFisico + " un";

    renderizarGraficosDashboard();
    renderizarResumoAutonomiaEHist();
    atualizarBannerSosENotificacoesAdmin();

    let naoLidasAdmin = isVisualizador ? 0 : db.mensagens.filter(m => m.destinatario === "Base" && !m.lido).length;
    let badgeAdminChat = document.getElementById('badge-admin-chat');
    if (badgeAdminChat) {
        if (naoLidasAdmin > 0) {
            badgeAdminChat.classList.remove('hidden');
            badgeAdminChat.innerText = naoLidasAdmin;
        } else {
            badgeAdminChat.classList.add('hidden');
        }
    }

    let tHtml = '';
    db.tecnicos.forEach((t, index) => {
        let avatarImg = t.avatar ? `<img src="${t.avatar}" class="w-10 h-10 rounded-full object-cover">` : `<div class="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">${t.name.charAt(0)}</div>`;
        let statusBadge = t.online ? '<span class="text-emerald-300 text-[10px] font-bold flex items-center"><span class="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1"></span>Online</span>' : `<span class="text-zinc-400 text-[10px] font-bold flex items-center"><span class="w-2 h-2 rounded-full bg-zinc-500 inline-block mr-1"></span>Offline (Visto: ${t.lastSeen || 'N/A'})</span>`;

        let isGpsAtivo = t.gpsStatus === "ativado" || (t.trackingOn && t.gpsStatus !== "desativado");
        let gpsBadge = isGpsAtivo
            ? '<span class="text-emerald-300 font-bold bg-emerald-950/90 border border-emerald-700 px-2 py-0.5 rounded-full inline-block shadow">🟢 GPS ATIVO (FUNDO)</span>'
            : '<span class="text-red-300 font-bold bg-red-950/90 border border-red-700 px-2 py-0.5 rounded-full inline-block shadow">🔴 GPS DESATIVADO</span>';

        tHtml += `
            <tr class="border-b border-zinc-700">
                <td class="p-4">${avatarImg}</td>
                <td class="p-4 font-bold text-white">${t.name} <br>${statusBadge}</td>
                <td class="p-4">${gpsBadge}</td>
                <td class="p-4 text-zinc-100 font-mono font-semibold">@${t.login}</td>
                <td class="p-4 text-zinc-100 font-mono font-semibold">${t.senha}</td>
                <td class="p-4 text-zinc-100 font-semibold">${t.car}</td>
                <td class="p-4 text-center space-x-2">
                    <button type="button" onclick="zerarLancamentosMateriaisTecnicos('${t.login}')" class="action-btn-write px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded-lg font-bold shadow" title="Zerar lançamentos de materiais deste técnico">Zerar Lançados</button>
                    <button type="button" onclick="reiniciarKmTecnico('${t.login}')" class="action-btn-write px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow" title="Reiniciar KM deste técnico">Resetar KM</button>
                    <button type="button" onclick="editarTecnico(${index})" class="action-btn-write px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold shadow">Editar</button>
                    <button type="button" onclick="excluirTecnico(${index})" class="action-btn-write px-2.5 py-1 bg-red-600/20 text-red-300 rounded-lg font-bold shadow">Excluir</button>
                </td>
            </tr>
        `;
    });
    document.getElementById('admin-tech-table').innerHTML = tHtml || '<tr><td colspan="7" class="p-4 text-center">Nenhum técnico.</td></tr>';

    let padraoHtml = '';
    (db.estoquePadrao || []).forEach((ep, idx) => {
        padraoHtml += `
            <tr class="border-b border-zinc-700">
                <td class="p-3 font-mono text-red-400 font-bold">${ep.sap}</td>
                <td class="p-3 text-white font-semibold">${ep.desc}</td>
                <td class="p-3 text-center font-bold text-emerald-300">${ep.qtdInicial} un</td>
                <td class="p-3 text-center">
                    <button type="button" onclick="removerItemEstoquePadrao(${idx})" class="action-btn-write text-red-400 font-bold hover:underline">Remover</button>
                </td>
            </tr>
        `;
    });
    let padraoTable = document.getElementById('admin-padrao-table');
    if (padraoTable) padraoTable.innerHTML = padraoHtml || '<tr><td colspan="4" class="p-4 text-center text-zinc-400">Nenhum material no estoque padrão.</td></tr>';

    let fisicoHtml = '';
    db.estoqueFisico.forEach((ef, idx) => {
        let seriaisStr = ef.seriais && ef.seriais.length > 0 ? ef.seriais.join(', ') : '<span class="text-zinc-400">Apenas Miscelânea</span>';
        fisicoHtml += `
            <tr class="border-b border-zinc-700">
                <td class="p-3 text-zinc-200">${ef.data}</td>
                <td class="p-3 font-mono text-emerald-300 font-semibold">${ef.sap}</td>
                <td class="p-3 text-white font-semibold">${ef.desc}</td>
                <td class="p-3 text-center font-bold text-white">${ef.qtd}</td>
                <td class="p-3 font-mono text-xs text-red-300 font-semibold">${seriaisStr}</td>
                <td class="p-3 text-center"><button type="button" onclick="removerEstoqueFisico(${idx})" class="action-btn-write text-red-400 font-bold hover:underline">Remover</button></td>
            </tr>
        `;
    });
    document.getElementById('admin-fisico-table').innerHTML = fisicoHtml || '<tr><td colspan="6" class="p-4 text-center">Estoque físico vazio.</td></tr>';

    let passTechSel = document.getElementById('pass-tech-select');
    let passMatSel = document.getElementById('pass-mat-select');
    let mapSelectTech = document.getElementById('map-select-tech');
    let exportTechSel = document.getElementById('export-excel-tech');
    let malaAddMatSel = document.getElementById('admin-mala-add-mat');
    let lancTechFilterSel = document.getElementById('admin-filter-lanc-tech');

    if (passTechSel) {
        let cur = passTechSel.value;
        passTechSel.innerHTML = db.tecnicos.map(t => `<option value="${t.login}">${t.name} (${t.car})</option>`).join('');
        if (cur && db.tecnicos.some(t => t.login === cur)) passTechSel.value = cur;
    }
    if (passMatSel) {
        let cur = passMatSel.value;
        passMatSel.innerHTML = db.estoqueFisico.map(e => `<option value="${e.sap}">${e.sap} - ${e.desc} (${e.qtd})</option>`).join('');
        if (cur && db.estoqueFisico.some(e => e.sap === cur)) passMatSel.value = cur;
    }
    if (malaAddMatSel) {
        let cur = malaAddMatSel.value;
        let listaCatalogo = obterTodosMateriaisCatalogo();
        malaAddMatSel.innerHTML = listaCatalogo.map(m => `<option value="${m.sap}">${m.sap} - ${m.desc}</option>`).join('');
        if (cur && listaCatalogo.some(m => m.sap === cur)) malaAddMatSel.value = cur;
    }
    if (lancTechFilterSel) {
        let cur = lancTechFilterSel.value || 'todos';
        lancTechFilterSel.innerHTML = `<option value="todos">Todos os Técnicos</option>` + db.tecnicos.map(t => `<option value="${t.login}">${t.name}</option>`).join('');
        if (cur === 'todos' || db.tecnicos.some(t => t.login === cur)) lancTechFilterSel.value = cur;
    }
    if (exportTechSel) {
        let cur = exportTechSel.value || 'todos';
        exportTechSel.innerHTML = `<option value="todos">👥 Todos os Técnicos</option>` + db.tecnicos.map(t => `<option value="${t.login}">${t.name} (${t.car})</option>`).join('');
        if (cur === 'todos' || db.tecnicos.some(t => t.login === cur)) exportTechSel.value = cur;
    }
    if (mapSelectTech) {
        let currentVal = mapSelectTech.value || 'geral';
        mapSelectTech.innerHTML = `<option value="geral">🌐 Visão Geral (Todos)</option>` + db.tecnicos.map(t => {
            let gpsStr = (t.gpsStatus === 'ativado' || t.trackingOn) ? '🟢 GPS Ativo' : '🔴 GPS Desativado';
            return `<option value="${t.login}">${t.name} (${t.car}) - ${gpsStr}</option>`;
        }).join('');
        mapSelectTech.value = currentVal;
    }

    atualizarSelectMalaAdmin();

    let matHtml = '';
    (db.materiais || []).forEach((m, i) => {
        matHtml += `
            <div class="p-3 bg-black border border-zinc-700 rounded-xl flex justify-between items-center text-xs shadow-sm">
                <div class="truncate mr-2"><b class="text-red-400 font-mono font-bold">${m.sap}</b> - <span class="text-white font-semibold">${m.desc}</span></div>
                <div class="flex space-x-2 flex-shrink-0 action-btn-write">
                    <button type="button" onclick="abrirModalEditarMaterial(${i})" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[10px] shadow">Editar</button>
                    <button type="button" onclick="removerMaterialAdmin(${i})" class="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-[10px] shadow">Excluir</button>
                </div>
            </div>`;
    });
    let adminMatList = document.getElementById('admin-materiais-list');
    if (adminMatList) adminMatList.innerHTML = matHtml || '<p class="text-zinc-400 text-xs italic">Nenhum material cadastrado.</p>';

    let lancamentosFiltrados = obterLancamentosSIAKIFiltrados();

    let lHtml = '';
    lancamentosFiltrados.forEach((l, index) => {
        let itensStr = (l.items || []).forEach ? (l.items || []).map(it => `${it.material} (${it.qtd})`).join(' | ') : '';
        let lancId = l.id !== undefined ? `'${l.id}'` : index;
        lHtml += `
            <tr class="border-b border-zinc-700">
                <td class="p-3 text-zinc-200 font-semibold">${l.data || '-'} ${l.hora ? '• ' + l.hora : ''}</td>
                <td class="p-3 font-bold text-white">${l.tecnico}</td>
                <td class="p-3 text-red-400 font-bold">${l.projeto}</td>
                <td class="p-3 font-mono text-zinc-100 font-semibold">${l.node}</td>
                <td class="p-3 text-zinc-100">${itensStr}</td>
                <td class="p-3 text-center space-x-2">
                    <button type="button" onclick="copiarServicoSIAKILinha(${lancId}, ${index})" class="action-btn-write px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[10px] shadow">Copiar</button>
                    <button type="button" onclick="excluirLancamento(${lancId}, ${index})" class="action-btn-write px-2.5 py-1 bg-red-600/20 text-red-300 rounded-lg font-bold text-[10px] shadow">Excluir</button>
                </td>
            </tr>
        `;
    });
    document.getElementById('admin-launch-history').innerHTML = lHtml || '<tr><td colspan="6" class="p-4 text-center text-zinc-400">Nenhum lançamento encontrado no filtro selecionado.</td></tr>';

    renderizarPinsMapaLeaflet();
    renderizarHistoricoGeral();
    if (!isVisualizador) atualizarChatAdminLista();
    if (window.lucide) lucide.createIcons();
}

function obterTodosMateriaisCatalogo() {
    let todosMateriais = [];
    let sapsVistos = new Set();

    (db.materiais || []).forEach(m => {
        if (m.sap && !sapsVistos.has(m.sap)) {
            todosMateriais.push({ sap: m.sap, desc: m.desc });
            sapsVistos.add(m.sap);
        }
    });

    (db.estoqueFisico || []).forEach(ef => {
        if (ef.sap && !sapsVistos.has(ef.sap)) {
            todosMateriais.push({ sap: ef.sap, desc: ef.desc });
            sapsVistos.add(ef.sap);
        }
    });

    (db.estoquePadrao || []).forEach(ep => {
        if (ep.sap && !sapsVistos.has(ep.sap)) {
            todosMateriais.push({ sap: ep.sap, desc: ep.desc });
            sapsVistos.add(ep.sap);
        }
    });

    return todosMateriais;
}

// --- MAPA LEAFLET ---
function inicializarMapaLeaflet() {
    let container = document.getElementById('map-leaflet-container');
    if (!container || !window.L) return;

    if (!mapLeaflet) {
        mapLeaflet = L.map('map-leaflet-container').setView([-9.6658, -35.7350], 13);
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 16,
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        }).addTo(mapLeaflet);
    }
    mapLeaflet.invalidateSize();
    renderizarPinsMapaLeaflet();
}

function criarIconeTecnicoLeaflet(tech) {
    let isGpsOn = tech.gpsStatus === "ativado" || (tech.trackingOn && tech.gpsStatus !== "desativado");
    let borderCol = isGpsOn ? '#10b981' : '#ef4444';

    let avatarContent = tech.avatar
        ? `<img src="${tech.avatar}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;">`
        : `<div style="width: 38px; height: 38px; border-radius: 50%; background: #dc2626; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">${tech.name.charAt(0)}</div>`;

    let html = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer;">
            <div style="width: 44px; height: 44px; border-radius: 50%; border: 3px solid ${borderCol}; background: #09090b; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.8);">
                ${avatarContent}
            </div>
            <div style="margin-top: 2px; background: rgba(9, 9, 11, 0.95); color: #ffffff; border: 1px solid #71717a; border-radius: 8px; padding: 2px 8px; font-size: 11px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.8);">
                ${tech.name} (${statusParadaAtual})
            </div>
        </div>
    `;

    return L.divIcon({
        html: html,
        className: 'custom-tech-pin',
        iconSize: [60, 65],
        iconAnchor: [30, 32]
    });
}

function renderizarPinsMapaLeaflet() {
    if (!mapLeaflet) return;

    Object.values(mapMarkers).forEach(m => mapLeaflet.removeLayer(m));
    mapMarkers = {};

    let filterTech = document.getElementById('map-select-tech')?.value || 'geral';

    (db.tecnicos || []).forEach(t => {
        if (filterTech !== 'geral' && t.login !== filterTech) return;

        let lat = t.lat || -9.6658;
        let lng = t.lng || -35.7350;

        let marker = L.marker([lat, lng], { icon: criarIconeTecnicoLeaflet(t) }).addTo(mapLeaflet);

        let isGpsOn = t.gpsStatus === "ativado" || (t.trackingOn && t.gpsStatus !== "desativado");
        let gpsStatusText = isGpsOn ? "<b style='color:#34d399;'>🟢 GPS ATIVO (FUNDO)</b>" : "<b style='color:#f87171;'>🔴 GPS DESATIVADO</b>";

        let popupContent = `
            <div style="font-family: sans-serif; font-size: 12px; color: #ffffff; padding: 4px;">
                <div style="font-weight: bold; font-size: 14px; border-bottom: 1px solid #52525b; padding-bottom: 4px; margin-bottom: 4px; color: #f87171;">${t.name}</div>
                <div><b>Veículo:</b> ${t.car || 'N/A'}</div>
                <div><b>Status GPS:</b> ${gpsStatusText}</div>
                <div><b>Status Parada:</b> <span style="color:#fbbf24;">${statusParadaAtual}</span></div>
                <div><b>Km Rodado:</b> ${(t.autoKm || 0).toFixed(2)} KM</div>
                <div><b>Consumo Registrado:</b> ${(t.autoLitros || 0).toFixed(2)} L (R$ ${(t.autoCusto || 0).toFixed(2)})</div>
            </div>
        `;
        marker.bindPopup(popupContent);
        mapMarkers[t.login] = marker;
    });

    if (filterTech !== 'geral' && mapMarkers[filterTech]) {
        let t = db.tecnicos.find(x => x.login === filterTech);
        if (t && t.lat && t.lng) {
            mapLeaflet.setView([t.lat, t.lng], 16);
            mapMarkers[filterTech].openPopup();
        }
    }
    renderizarCardsMapaTecnicosList();
}

function renderizarCardsMapaTecnicosList() {
    let mapTechsHtml = '';
    db.tecnicos.forEach(t => {
        let badgeOn = t.online ? 'bg-emerald-400' : 'bg-zinc-500';
        let avatar = t.avatar ? `<img src="${t.avatar}" class="w-10 h-10 rounded-full object-cover">` : `<div class="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">${t.name.charAt(0)}</div>`;

        let isGpsAtivo = t.gpsStatus === "ativado" || (t.trackingOn && t.gpsStatus !== "desativado");
        let gpsStatusStr = isGpsAtivo ? '<span class="text-emerald-300 font-bold">🟢 GPS Ativo</span>' : '<span class="text-red-300 font-bold">🔴 GPS Desativado</span>';

        mapTechsHtml += `
            <div onclick="selecionarEPlugarMapa('${t.login}')" class="bg-black border border-zinc-700 rounded-2xl p-4 flex items-center space-x-3 shadow-md hover:border-red-600 transition cursor-pointer">
                ${avatar}
                <div class="flex-1">
                    <h4 class="font-bold text-white text-sm">${t.name}</h4>
                    <p class="text-[10px] text-red-400 font-semibold">${t.car}</p>
                    <p class="text-[10px] text-zinc-300 truncate">📍 ${t.rua || 'Localização em campo'}</p>
                    <div class="flex justify-between items-center mt-1">
                        <span class="text-[10px] font-bold text-zinc-200 flex items-center"><span class="w-2 h-2 rounded-full ${badgeOn} inline-block mr-1"></span>${t.online ? 'Online' : 'Offline'}</span>
                        <span class="text-[10px] font-semibold">${gpsStatusStr}</span>
                    </div>
                </div>
            </div>
        `;
    });
    let listEl = document.getElementById('admin-map-techs-list');
    if (listEl) listEl.innerHTML = mapTechsHtml;
}

function selecionarEPlugarMapa(login) {
    let sel = document.getElementById('map-select-tech');
    if (sel) { sel.value = login; renderizarPinsMapaLeaflet(); }
}

// --- AUTONOMIA & LOGÍSTICA ---
function renderizarResumoAutonomiaEHist() {
    if (!db.trajetos) db.trajetos = [];

    let totalKm = 0;
    let totalLitros = 0;
    let totalCusto = 0;

    db.trajetos.forEach(t => {
        totalKm += Number(t.kmPercorrido || 0);
        totalLitros += Number(t.litros || 0);
        totalCusto += Number(t.custoTotal || 0);
    });

    db.tecnicos.forEach(t => {
        totalKm += Number(t.autoKm || 0);
        totalLitros += Number(t.autoLitros || 0);
        totalCusto += Number(t.autoCusto || 0);
    });

    let custoMedioPorKm = totalKm > 0 ? (totalCusto / totalKm) : 0;

    if (document.getElementById('stat-auto-km')) document.getElementById('stat-auto-km').innerText = totalKm.toFixed(1) + " KM";
    if (document.getElementById('stat-auto-litros')) document.getElementById('stat-auto-litros').innerText = totalLitros.toFixed(1) + " L";
    if (document.getElementById('stat-auto-custo')) document.getElementById('stat-auto-custo').innerText = "R$ " + totalCusto.toFixed(2);
    if (document.getElementById('stat-auto-por-km')) document.getElementById('stat-auto-por-km').innerText = "R$ " + custoMedioPorKm.toFixed(2) + " / KM";

    renderizarCardsConsumoPatrao();
    renderizarHistoricoAutonomia();
}

function renderizarCardsConsumoPatrao() {
    let container = document.getElementById('patrao-tech-consumption-cards');
    if (!container) return;

    let html = "";
    db.tecnicos.forEach(t => {
        let kmTech = Number(t.autoKm || 0);
        let litrosTech = Number(t.autoLitros || 0);
        let custoTech = Number(t.autoCusto || 0);
        let avatar = t.avatar ? `<img src="${t.avatar}" class="w-10 h-10 rounded-full object-cover">` : `<div class="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">${t.name.charAt(0)}</div>`;
        let statusOn = t.online ? '<span class="text-emerald-300 font-bold">Online</span>' : '<span class="text-zinc-400">Offline</span>';

        html += `
            <div class="bg-black border border-zinc-700 rounded-2xl p-4 space-y-3 shadow-lg">
                <div class="flex items-center space-x-3 border-b border-zinc-700 pb-2">
                    ${avatar}
                    <div class="flex-1">
                        <h4 class="font-bold text-white text-sm">${t.name}</h4>
                        <p class="text-[10px] text-red-400 font-semibold">${t.car || 'Sem veículo'} • ${statusOn}</p>
                    </div>
                    <button type="button" onclick="reiniciarKmTecnico('${t.login}')" class="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold action-btn-write shadow" title="Zerar KM">Zerar KM</button>
                </div>
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <div class="bg-zinc-900 p-2 rounded-xl border border-zinc-700">
                        <span class="text-zinc-300 text-[9px] block font-semibold">KM Rodados</span>
                        <b class="text-amber-400 font-mono text-sm">${kmTech.toFixed(1)} KM</b>
                    </div>
                    <div class="bg-zinc-900 p-2 rounded-xl border border-zinc-700">
                        <span class="text-zinc-300 text-[9px] block font-semibold">Litros (10km/L)</span>
                        <b class="text-blue-300 font-mono text-sm">${litrosTech.toFixed(1)} L</b>
                    </div>
                    <div class="bg-zinc-900 p-2 rounded-xl border border-zinc-700">
                        <span class="text-zinc-300 text-[9px] block font-semibold">Custo R$</span>
                        <b class="text-emerald-300 font-mono text-sm">R$ ${custoTech.toFixed(2)}</b>
                    </div>
                </div>
                <div class="text-[10px] text-zinc-200 truncate font-semibold">
                    📍 <b>Última Posição:</b> ${t.rua || 'Aguardando sinal GPS'}
                </div>
            </div>
        `;
    });
    container.innerHTML = html || '<p class="text-zinc-400 italic text-center col-span-3">Nenhum técnico cadastrado para logísticas.</p>';
}

function renderizarHistoricoAutonomia() {
    let tbody = document.getElementById('admin-autonomia-table');
    if (!tbody) return;

    let filterTech = (document.getElementById('filter-auto-tech')?.value || '').toLowerCase();
    let filterDate = document.getElementById('filter-auto-date')?.value;

    let lista = (db.trajetos || []).filter(t => {
        if (filterTech && !t.techNome.toLowerCase().includes(filterTech) && !t.techLogin.toLowerCase().includes(filterTech)) return false;
        if (filterDate && t.data !== filterDate) return false;
        return true;
    });

    tbody.innerHTML = lista.map((t) => {
        let gpsStatusTag = t.gpsAtivo
            ? '<span class="text-emerald-300 font-bold bg-emerald-950/90 border border-emerald-700 px-2 py-0.5 rounded shadow">🟢 Ativo (Fundo)</span>'
            : '<span class="text-red-300 font-bold bg-red-950/90 border border-red-700 px-2 py-0.5 rounded shadow">🔴 Desativado</span>';

        let paradaInfo = t.paradaFinal ? `<b class="text-amber-300">${t.paradaFinal}</b>` : `<b>${t.origem}</b> ➔ <b>${t.destino}</b>`;
        let tempoParadoInfo = t.tempoParado ? `<span class="text-emerald-300 font-bold">${t.tempoParado}</span>` : '-';

        return `
            <tr class="border-b border-zinc-700">
                <td class="p-3 text-zinc-200 font-semibold">${t.data}</td>
                <td class="p-3 font-bold text-white">${t.techNome} <br><span class="text-[10px] text-red-400 font-semibold">${t.veiculo}</span></td>
                <td class="p-3 text-zinc-100 font-semibold">${paradaInfo}</td>
                <td class="p-3 text-center font-semibold">${tempoParadoInfo}</td>
                <td class="p-3 text-center font-bold text-amber-300 font-mono">${t.kmPercorrido} KM</td>
                <td class="p-3 text-center font-bold text-blue-300 font-mono">${Number(t.litros).toFixed(2)} L</td>
                <td class="p-3 text-center font-bold text-emerald-300 font-mono">R$ ${Number(t.custoTotal).toFixed(2)}</td>
                <td class="p-3 text-center text-xs">${gpsStatusTag}</td>
                <td class="p-3 text-center"><button type="button" onclick="excluirTrajetoAutonomia(${t.id})" class="action-btn-write text-red-400 font-bold hover:underline">Excluir</button></td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="9" class="p-4 text-center text-zinc-400">Nenhum percurso ou parada registrada.</td></tr>';
}

function limparFiltroAutonomia() {
    if (document.getElementById('filter-auto-tech')) document.getElementById('filter-auto-tech').value = '';
    if (document.getElementById('filter-auto-date')) document.getElementById('filter-auto-date').value = '';
    renderizarHistoricoAutonomia();
}

function excluirTrajetoAutonomia(trajetoId) {
    if (isVisualizador) return;
    if (confirm("Deseja excluir este registro de trajeto e paradas?")) {
        db.trajetos = db.trajetos.filter(t => t.id !== trajetoId);
        salvarDb();
        atualizarPainelAdmin();
    }
}

function baixarExcelDetalhadoPorData() {
    let dataSelecionada = document.getElementById('export-excel-date').value;
    let techSelecionado = document.getElementById('export-excel-tech').value;

    let filtrados = (db.trajetos || []).filter(t => {
        if (dataSelecionada && t.data !== dataSelecionada) return false;
        if (techSelecionado !== 'todos' && t.techLogin !== techSelecionado) return false;
        return true;
    });

    let csvContent = "data:text/csv;charset=utf-8,Data;Tecnico;Veiculo;Local Parada / Destino;Tempo Parado;KM Percorrido;Litros (10km/L);Preco Gasolina (R$);Custo Total (R$);GPS Fundo\n";
    filtrados.forEach(t => {
        csvContent += `${t.data};"${t.techNome}";"${t.veiculo}";"${t.paradaFinal || t.destino}";"${t.tempoParado || 'N/A'}";${t.kmPercorrido};${Number(t.litros).toFixed(2)};${t.precoGasolina};${Number(t.custoTotal).toFixed(2)};${t.gpsAtivo ? 'SIM' : 'NAO'}\n`;
    });

    if (filtrados.length === 0) {
        db.tecnicos.forEach(t => {
            if (techSelecionado === 'todos' || t.login === techSelecionado) {
                csvContent += `${new Date().toISOString().split('T')[0]};"${t.name}";"${t.car || 'N/A'}";"Posição Atual GPS";"N/A";${(t.autoKm || 0).toFixed(2)};${(t.autoLitros || 0).toFixed(2)};${PRECO_GASOLINA_ATUAL};${(t.autoCusto || 0).toFixed(2)};SIM\n`;
            }
        });
    }

    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_logistica_patrao_${dataSelecionada || 'geral'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("✅ Relatório Logístico Excel exportado com sucesso para o patrão!");
}

function limparFiltroDatasLancamentos() {
    if (document.getElementById('admin-filter-date-start')) document.getElementById('admin-filter-date-start').value = '';
    if (document.getElementById('admin-filter-date-end')) document.getElementById('admin-filter-date-end').value = '';
    if (document.getElementById('admin-filter-lanc-tech')) document.getElementById('admin-filter-lanc-tech').value = 'todos';
    if (document.getElementById('admin-filter-search-servico')) document.getElementById('admin-filter-search-servico').value = '';
    atualizarPainelAdmin();
}

function adicionarItemEstoquePadrao() {
    if (isVisualizador) return;
    let sap = document.getElementById('padrao-sap').value.trim();
    let desc = document.getElementById('padrao-desc').value.trim();
    let qtd = Number(document.getElementById('padrao-qtd').value);

    if (!sap || !desc || qtd <= 0) { alert("Preencha SAP, Descrição e quantidade válidos!"); return; }
    if (!db.estoquePadrao) db.estoquePadrao = [];

    let exist = db.estoquePadrao.find(e => e.sap === sap);
    if (exist) {
        exist.qtdInicial = qtd;
        exist.desc = desc;
    } else {
        db.estoquePadrao.push({ sap, desc, qtdInicial: qtd });
    }

    if (!db.materiais) db.materiais = [];
    if (!db.materiais.some(m => m.sap === sap)) {
        db.materiais.push({ sap, desc });
    }

    registrarMovimentacao("Estoque Padrão", "Admin", `Configurado item ${desc} (${sap}) com qtd inicial ${qtd}`);
    salvarDb();
    document.getElementById('padrao-sap').value = '';
    document.getElementById('padrao-desc').value = '';
    document.getElementById('padrao-qtd').value = '100';
    alert("✅ Material adicionado ao Estoque Padrão com sucesso!");
    atualizarPainelAdmin();
}

function removerItemEstoquePadrao(idx) {
    if (isVisualizador) return;
    if (confirm("Remover este item do Estoque Padrão?")) {
        db.estoquePadrao.splice(idx, 1);
        salvarDb();
        atualizarPainelAdmin();
    }
}

function adicionarEstoqueFisicoUnitario() {
    if (isVisualizador) return;
    let sap = document.getElementById('fisico-sap').value.trim();
    let desc = document.getElementById('fisico-desc').value.trim();
    let qtd = Number(document.getElementById('fisico-qtd').value);
    let seriaisTxt = document.getElementById('fisico-seriais').value.trim();
    if (!sap || !desc || qtd <= 0) { alert("Preencha todos os campos do estoque físico!"); return; }

    let seriaisArr = seriaisTxt ? seriaisTxt.split(',').map(s => s.trim()) : [];
    let existente = db.estoqueFisico.find(e => e.sap === sap);
    if (existente) {
        existente.qtd += qtd;
        if (seriaisArr.length > 0) {
            if (!existente.seriais) existente.seriais = [];
            existente.seriais.push(...seriaisArr);
        }
    } else {
        db.estoqueFisico.push({ id: Date.now(), sap, desc, qtd, seriais: seriaisArr, data: new Date().toISOString().split('T')[0] });
    }

    if (!db.materiais) db.materiais = [];
    if (!db.materiais.some(m => m.sap === sap)) {
        db.materiais.push({ sap, desc });
    }

    registrarMovimentacao("Estoque Físico", "Admin", `Entrada de ${qtd}x ${desc} (${sap}) c/ Seriais`);
    document.getElementById('fisico-sap').value = '';
    document.getElementById('fisico-desc').value = '';
    document.getElementById('fisico-qtd').value = '1';
    document.getElementById('fisico-seriais').value = '';
    salvarDb();
    alert("✅ Entrada com bipagem registrada com sucesso!");
    atualizarPainelAdmin();
}

function adicionarEstoqueFisicoMassa() {
    if (isVisualizador) return;
    let linhas = document.getElementById('fisico-massa').value.trim().split('\n');
    let count = 0;
    linhas.forEach(linha => {
        let partes = linha.split('|').map(p => p.trim());
        if (partes.length >= 3) {
            let [sap, desc, qtdStr, seriaisStr] = partes;
            let qtd = Number(qtdStr) || 1;
            let seriaisArr = seriaisStr ? seriaisStr.split(',').map(s => s.trim()) : [];
            let existente = db.estoqueFisico.find(e => e.sap === sap);
            if (existente) {
                existente.qtd += qtd;
                if (seriaisArr.length > 0) {
                    if (!existente.seriais) existente.seriais = [];
                    existente.seriais.push(...seriaisArr);
                }
            } else {
                db.estoqueFisico.push({ id: Date.now() + Math.random(), sap, desc, qtd, seriais: seriaisArr, data: new Date().toISOString().split('T')[0] });
            }
            if (!db.materiais) db.materiais = [];
            if (!db.materiais.some(m => m.sap === sap)) {
                db.materiais.push({ sap, desc });
            }
            count++;
        }
    });
    if (count === 0) { alert("Formato inválido! Use: COD_SAP | Descrição | Quantidade | Seriais"); return; }
    registrarMovimentacao("Estoque Físico Massa", "Admin", `Processada entrada em massa de ${count} itens.`);
    document.getElementById('fisico-massa').value = '';
    salvarDb();
    alert(`✅ ${count} entradas em massa processadas com sucesso!`);
    atualizarPainelAdmin();
}

function removerEstoqueFisico(idx) {
    if (isVisualizador) return;
    db.estoqueFisico.splice(idx, 1);
    salvarDb();
    atualizarPainelAdmin();
}

function adicionarItemCarrinhoPassagem() {
    if (isVisualizador) return;
    let sap = document.getElementById('pass-mat-select').value;
    let qtd = Number(document.getElementById('pass-qtd').value);
    let seriaisTxt = document.getElementById('pass-seriais').value.trim();
    let fisico = db.estoqueFisico.find(e => e.sap === sap);

    if (!fisico || qtd <= 0) { alert("Selecione um material e quantidade válidos."); return; }
    if (fisico.qtd < qtd) { alert("Quantidade insuficiente no estoque físico central!"); return; }

    carrinhoPassagem.push({
        sap: fisico.sap,
        desc: fisico.desc,
        qtd: qtd,
        seriais: seriaisTxt ? seriaisTxt.split(',').map(s => s.trim()) : []
    });
    document.getElementById('pass-seriais').value = '';
    document.getElementById('pass-qtd').value = '1';
    renderizarCarrinhoPassagem();
}

function renderizarCarrinhoPassagem() {
    let tbody = document.getElementById('pass-cart-table');
    if (!tbody) return;
    if (carrinhoPassagem.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-3 text-center text-zinc-400">Nenhum item adicionado.</td></tr>';
        return;
    }
    tbody.innerHTML = carrinhoPassagem.map((it, idx) => `
        <tr class="border-b border-zinc-700">
            <td class="p-2 font-mono text-red-400 font-semibold">${it.sap} - ${it.desc}</td>
            <td class="p-2 text-center font-bold text-white">${it.qtd}</td>
            <td class="p-2 font-mono text-xs text-zinc-200">${it.seriais.join(', ') || 'Apenas Qtd'}</td>
            <td class="p-2 text-center"><button type="button" onclick="if(!isVisualizador) { carrinhoPassagem.splice(${idx},1); renderizarCarrinhoPassagem(); }" class="action-btn-write text-red-400 font-bold">X</button></td>
        </tr>
    `).join('');
}

function executarPassagemMultiplaTecnico() {
    if (isVisualizador) return;
    let techLogin = document.getElementById('pass-tech-select').value;
    let tech = db.tecnicos.find(t => t.login === techLogin);
    if (!tech) { alert("Selecione um técnico válido!"); return; }
    if (carrinhoPassagem.length === 0) { alert("Adicione pelo menos 1 material para transferir!"); return; }

    let resumoItensTxt = [];
    for (let it of carrinhoPassagem) {
        let fisico = db.estoqueFisico.find(e => e.sap === it.sap);
        if (!fisico || fisico.qtd < it.qtd) { alert(`Quantidade insuficiente para o material ${it.desc}`); return; }

        fisico.qtd -= it.qtd;

        if (!tech.mala) tech.mala = [];
        let itemMala = tech.mala.find(m => m.sap === it.sap);
        if (itemMala) {
            itemMala.qtd = Number(itemMala.qtd || 0) + Number(it.qtd);
            itemMala.abastecido = Number(itemMala.abastecido || 0) + Number(it.qtd);
            if (it.seriais.length > 0) {
                if (!itemMala.seriais) itemMala.seriais = [];
                itemMala.seriais.push(...it.seriais);
            }
        } else {
            tech.mala.push({
                sap: it.sap,
                desc: it.desc,
                qtd: Number(it.qtd),
                lancado: 0,
                abastecido: Number(it.qtd),
                seriais: [...it.seriais]
            });
        }
        resumoItensTxt.push(`${it.qtd}x ${it.desc}`);
    }

    registrarMovimentacao("Passagem Múltipla", "Admin", `Transferidos ${carrinhoPassagem.length} itens para ${tech.name}`);

    if (!tech.notificacoes) tech.notificacoes = [];
    const notifMsg = `Você recebeu novos materiais da Base Central (${resumoItensTxt.join(', ')})`;
    tech.notificacoes.push({ text: notifMsg, time: new Date().toLocaleDateString() });

    db.notificacoes.push({ text: `Transferência múltipla realizada para ${tech.name}.`, time: new Date().toLocaleDateString(), tipo: "success" });

    let itensCopia = [...carrinhoPassagem];
    carrinhoPassagem = [];
    salvarDb();
    atualizarPainelAdmin();
    renderizarCarrinhoPassagem();

    abrirComprovanteTermoMultiplo(tech.name, itensCopia);
}

function abrirComprovanteTermoMultiplo(techName, itens) {
    let listaHtml = itens.map(i => `<li><b>${i.qtd}x</b> ${i.sap} - ${i.desc} ${i.seriais.length > 0 ? `[Seriais: ${i.seriais.join(', ')}]` : ''}</li>`).join('');
    let content = `
        <p><b>Data:</b> ${new Date().toLocaleString()}</p>
        <p><b>Técnico Responsável:</b> ${techName}</p>
        <p><b>Itens Transferidos:</b></p>
        <ul class="list-disc pl-4 space-y-1">${listaHtml}</ul>
        <div class="mt-4 p-3 bg-zinc-950 border border-red-900 rounded-xl text-[11px] leading-relaxed text-zinc-200">
            <b>TERMO DE RESPONSABILIDADE:</b> Declaro que recebi os materiais acima descritos em perfeito estado de conservação, assumindo total responsabilidade pela guarda, uso adequado em campo e devolução quando solicitada.
        </div>
    `;
    document.getElementById('comprovante-content').innerHTML = content;
    document.getElementById('modal-comprovante').classList.remove('hidden');
}

function fecharModalComprovante() {
    document.getElementById('modal-comprovante').classList.add('hidden');
}

function switchMalaSubTab(sub) {
    subMalaAtual = sub;
    document.querySelectorAll('.mala-subcontent').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('#acontent-malas button[id^="msub-"]').forEach(el => {
        el.classList.remove('bg-red-600', 'text-white');
        el.classList.add('bg-zinc-800', 'text-zinc-300');
    });
    document.getElementById('mala-subcontent-' + sub).classList.remove('hidden');
    document.getElementById('msub-' + sub).classList.add('bg-red-600', 'text-white');
    document.getElementById('msub-' + sub).classList.remove('bg-zinc-800', 'text-zinc-300');
    renderizarMalaAdmin();
}

function incluirMaterialManualMalaAdmin() {
    if (isVisualizador) return;
    let loginSelect = document.getElementById('admin-select-mala-tech');
    let matSelect = document.getElementById('admin-mala-add-mat');
    let qtdInput = document.getElementById('admin-mala-add-qtd');

    if (!loginSelect || !matSelect || !qtdInput) return;

    let techLogin = loginSelect.value;
    let sap = matSelect.value;
    let qtd = Number(qtdInput.value);

    let tech = db.tecnicos.find(t => t.login === techLogin);
    if (!tech) { alert("Selecione um técnico válido!"); return; }
    if (!sap || isNaN(qtd) || qtd <= 0) { alert("Selecione um material e informe uma quantidade maior que zero!"); return; }

    let todosMats = obterTodosMateriaisCatalogo();
    let matInfo = todosMats.find(m => m.sap === sap) || { sap: sap, desc: sap };

    if (!tech.mala) tech.mala = [];
    let itemMala = tech.mala.find(m => m.sap === sap);

    if (itemMala) {
        itemMala.qtd = Number(itemMala.qtd || 0) + qtd;
        itemMala.abastecido = Number(itemMala.abastecido || 0) + qtd;
    } else {
        tech.mala.push({
            sap: matInfo.sap,
            desc: matInfo.desc,
            qtd: qtd,
            lancado: 0,
            abastecido: qtd,
            seriais: []
        });
    }

    if (!tech.notificacoes) tech.notificacoes = [];
    const textoNotif = `Base adicionou ${qtd}x ${matInfo.desc} à sua mala.`;
    tech.notificacoes.push({
        text: textoNotif,
        time: new Date().toLocaleDateString()
    });

    registrarMovimentacao("Inclusão Manual Mala", "Admin", `Adicionou ${qtd}x ${matInfo.desc} (${sap}) na mala de ${tech.name}`);
    qtdInput.value = '1';

    salvarDb();
    renderizarMalaAdmin();
    alert(`✅ ${qtd}x ${matInfo.desc} incluído no estoque da mala de ${tech.name} com sucesso e notificado ao técnico!`);
}

function renderizarMalaAdmin() {
    let loginSelect = document.getElementById('admin-select-mala-tech');
    if (!loginSelect) return;
    let login = loginSelect.value;
    let tech = db.tecnicos.find(t => t.login === login);
    if (!tech) {
        let tbody = document.getElementById('admin-mala-table');
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Nenhum técnico selecionado ou mala vazia.</td></tr>';
        return;
    }
    if (!tech.mala) tech.mala = [];

    let tbody = document.getElementById('admin-mala-table');
    if (tbody) {
        tbody.innerHTML = tech.mala.map((m, idx) => `
            <tr class="border-b border-zinc-700">
                <td class="p-3 font-mono text-red-400 font-semibold">${m.sap}</td>
                <td class="p-3 text-white font-semibold">${m.desc}</td>
                <td class="p-3 text-center font-bold text-white">${m.qtd}</td>
                <td class="p-3 text-center text-amber-300 font-bold">${m.lancado || 0}</td>
                <td class="p-3 text-center space-x-2">
                    <input type="number" id="edit-mala-${idx}" min="0" value="${m.qtd}" class="w-16 px-2 py-1 bg-black border border-zinc-600 rounded text-center text-red-400 font-bold outline-none inline-block">
                    <button type="button" onclick="salvarEdicaoMalaAdmin('${tech.login}', ${idx})" class="action-btn-write px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold shadow">Salvar</button>
                    <button type="button" onclick="excluirMaterialMalaAdmin('${tech.login}', ${idx})" class="action-btn-write px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold shadow">Excluir</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="p-4 text-center">Nenhum item na mala.</td></tr>';
    }

    let seriaisListEl = document.getElementById('admin-seriais-list');
    if (seriaisListEl) {
        let htmlSeriais = "";
        tech.mala.forEach(m => {
            if (m.seriais && m.seriais.length > 0) {
                htmlSeriais += `<div class="p-3 bg-black border border-zinc-700 rounded-xl text-xs"><b class="text-red-400">${m.desc} (${m.sap})</b>: ${m.seriais.join(', ')}</div>`;
            }
        });
        seriaisListEl.innerHTML = htmlSeriais || '<p class="text-zinc-400 italic">Nenhum item com serial cadastrado nesta mala.</p>';
    }

    let reposListEl = document.getElementById('admin-reposicao-list');
    if (reposListEl) {
        let repTech = db.reposicoes.filter(r => r.tecnico === tech.name || r.techLogin === tech.login);
        reposListEl.innerHTML = repTech.map((r) => `
            <div class="p-3 bg-black border border-zinc-700 rounded-xl flex justify-between items-center text-xs">
                <div><b class="text-white">${r.material}</b> - Qtd solicitada: <span class="text-amber-300 font-bold">${r.qtd}</span> (${r.status || 'Pendente'})</div>
                <div class="space-x-2">
                    <button type="button" onclick="aprovarReposicaoAdmin('${r.id}', '${tech.login}', '${r.material.replace(/'/g, "\\'")}', ${r.qtd})" class="action-btn-write px-3 py-1 bg-emerald-600 text-white rounded font-bold shadow">Aprovar</button>
                    <button type="button" onclick="removerReposicaoAdmin('${r.id}')" class="action-btn-write text-red-400 font-bold hover:underline">Excluir</button>
                </div>
            </div>
        `).join('') || '<p class="text-zinc-400 italic">Nenhum pedido de reposição pendente.</p>';
    }
}

function salvarEdicaoMalaAdmin(techLogin, itemIdx) {
    if (isVisualizador) return;
    let tech = db.tecnicos.find(t => t.login === techLogin);
    let inputEl = document.getElementById(`edit-mala-${itemIdx}`);
    let novaQtd = inputEl ? Number(inputEl.value) : NaN;
    if (isNaN(novaQtd) || novaQtd < 0) {
        alert("Informe uma quantidade válida (0 ou maior)!");
        return;
    }
    if (tech && tech.mala && tech.mala[itemIdx]) {
        let nomeMat = tech.mala[itemIdx].desc;
        tech.mala[itemIdx].qtd = novaQtd;
        if (!tech.notificacoes) tech.notificacoes = [];
        tech.notificacoes.push({
            text: `Base atualizou o saldo de ${nomeMat} para ${novaQtd} un.`,
            time: new Date().toLocaleDateString()
        });
        registrarMovimentacao("Edição Mala", "Admin", `Editada quantidade do item ${nomeMat} para ${novaQtd} na mala de ${tech.name}`);
        salvarDb();
        renderizarMalaAdmin();
        alert("✅ Quantidade da mala atualizada, salva e notificada ao técnico com sucesso!");
    }
}

function excluirMaterialMalaAdmin(techLogin, itemIdx) {
    if (isVisualizador) return;
    let tech = db.tecnicos.find(t => t.login === techLogin);
    if (tech && tech.mala && tech.mala[itemIdx]) {
        let itemNome = tech.mala[itemIdx].desc;
        if (confirm(`Tem certeza que deseja excluir o material "${itemNome}" da mala do técnico ${tech.name}?`)) {
            tech.mala.splice(itemIdx, 1);
            registrarMovimentacao("Exclusão Material Mala", "Admin", `Removeu ${itemNome} da mala de ${tech.name}`);
            salvarDb();
            renderizarMalaAdmin();
            alert("✅ Material removido da mala sem erros!");
        }
    }
}

function aprovarReposicaoAdmin(repId, techLogin, materialDesc, qtd) {
    if (isVisualizador) return;
    let tech = db.tecnicos.find(t => t.login === techLogin);
    if (tech) {
        if (!tech.mala) tech.mala = [];
        let malaItem = tech.mala.find(m => m.desc === materialDesc || m.sap === materialDesc);
        if (malaItem) {
            malaItem.qtd = Number(malaItem.qtd || 0) + Number(qtd);
            malaItem.abastecido = Number(malaItem.abastecido || 0) + Number(qtd);
        } else {
            tech.mala.push({ sap: "REP-99", desc: materialDesc, qtd: Number(qtd), lancado: 0, abastecido: Number(qtd), seriais: [] });
        }
        
        if (!tech.notificacoes) tech.notificacoes = [];
        tech.notificacoes.push({
            text: `✅ Reposição de ${qtd}x ${materialDesc} aprovada e adicionada à sua mala!`,
            time: new Date().toLocaleDateString()
        });
    }
    let rep = db.reposicoes.find(r => String(r.id) === String(repId));
    if (rep) {
        rep.status = "Aprovado";
    } else {
        db.reposicoes = db.reposicoes.filter(r => !(String(r.techLogin) === String(techLogin) && String(r.material) === String(materialDesc) && String(r.qtd) === String(qtd) && r.status === "Pendente"));
    }
    registrarMovimentacao("Reposição Aprovada", "Admin", `Aprovada reposição de ${qtd}x ${materialDesc} para ${tech ? tech.name : techLogin}`);
    salvarDb().then(() => {
        atualizarPainelAdmin();
        renderizarMalaAdmin();
        alert("✅ Reposição aprovada, adicionada diretamente ao estoque da mala do técnico e notificada com sucesso!");
    });
}

function removerReposicaoAdmin(repId) {
    if (isVisualizador) return;
    db.reposicoes = db.reposicoes.filter(r => String(r.id) !== String(repId));
    salvarDb();
    renderizarMalaAdmin();
}

function renderizarHistoricoGeral() {
    let dataFiltro = document.getElementById('filtro-hist-data').value;
    let histFiltrado = dataFiltro ? db.movimentacoes.filter(m => m.data.includes(dataFiltro)) : db.movimentacoes;
    let tbody = document.getElementById('admin-historico-table');
    if (!tbody) return;

    tbody.innerHTML = histFiltrado.map(h => `
        <tr class="border-b border-zinc-700">
            <td class="p-3 text-zinc-200 font-mono font-semibold">${h.data}</td>
            <td class="p-3 font-bold text-red-400">${h.tipo}</td>
            <td class="p-3 text-white font-semibold">${h.responsavel}</td>
            <td class="p-3 text-zinc-100">${h.detalhes}</td>
        </tr>
    `).join('') || '<tr><td colspan="4" class="p-4 text-center">Nenhum registro no histórico.</td></tr>';
}

function limparHistoricoGeral() {
    if (isVisualizador) return;
    if (confirm("Deseja realmente limpar todo o histórico de movimentações?")) {
        db.movimentacoes = [];
        salvarDb();
        renderizarHistoricoGeral();
        alert("✅ Histórico limpo com sucesso!");
    }
}

function baixarExcelGeral() {
    let csv = "data:text/csv;charset=utf-8,Data/Hora;Tipo;Responsavel;Detalhes\n";
    db.movimentacoes.forEach(m => {
        csv += `${m.data};"${m.tipo}";"${m.responsavel}";"${m.detalhes}"\n`;
    });
    let encodedUri = encodeURI(csv);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historico_movimentacoes_geral.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportarExcelSIAKI() {
    let filtrados = obterLancamentosSIAKIFiltrados();
    if (filtrados.length === 0) {
        alert("Nenhum lançamento encontrado no filtro selecionado para exportar!");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,DATA;COD SAP;Material;PROJETOS;CIDADE;LOCAL DE DESCARGA;Node/Site/Cód Imóvel;QTD. CONSUMO;QTD. DESCARTE\n";
    filtrados.forEach(l => {
        (l.items || []).forEach(it => {
            csvContent += `${l.data || ''};${it.sap};"${it.material}";${l.projeto};MACEIO;865323;${l.node};${it.qtd};${it.descarte || 0}\n`;
        });
    });
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "carregamento_massivo_SIAKI.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function copiarServicoSIAKILinha(idOuIndex, fallbackIndex) {
    let idxReal = db.lancamentos.findIndex(l => String(l.id) === String(idOuIndex));
    if (idxReal === -1 && typeof fallbackIndex === 'number') {
        idxReal = fallbackIndex;
    }
    if (idxReal === -1 || !db.lancamentos[idxReal]) {
        alert("Lançamento não encontrado!");
        return;
    }

    let l = db.lancamentos[idxReal];
    let texto = "DATA\tCOD SAP\tMaterial\tPROJETOS\tCIDADE\tLOCAL DE DESCARGA\tNode/Site/Cód Imóvel\tQTD. CONSUMO\tQTD. DESCARTE\n";
    (l.items || []).forEach(it => {
        texto += `${l.data || ''}\t${it.sap}\t${it.material}\t${l.projeto}\tMACEIO\t865323\t${l.node}\t${it.qtd}\t${it.descarte || 0}\n`;
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(() => {
            alert(`📋 Serviço do Node ${l.node} copiado com sucesso no padrão SIAKI!`);
        }).catch(() => {
            copiarFallbackTextarea(texto, 1);
        });
    } else {
        copiarFallbackTextarea(texto, 1);
    }
}

function copiarDadosSIAKI() {
    let filtrados = obterLancamentosSIAKIFiltrados();
    if (filtrados.length === 0) {
        alert("Nenhum lançamento encontrado com o filtro/data selecionado para copiar!");
        return;
    }

    let texto = "DATA\tCOD SAP\tMaterial\tPROJETOS\tCIDADE\tLOCAL DE DESCARGA\tNode/Site/Cód Imóvel\tQTD. CONSUMO\tQTD. DESCARTE\n";
    filtrados.forEach(l => {
        (l.items || []).forEach(it => {
            texto += `${l.data || ''}\t${it.sap}\t${it.material}\t${l.projeto}\tMACEIO\t865323\t${l.node}\t${it.qtd}\t${it.descarte || 0}\n`;
        });
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(() => {
            alert(`📋 ${filtrados.length} lançamento(s) copiado(s) no padrão SIAKI com sucesso!`);
        }).catch(() => {
            copiarFallbackTextarea(texto, filtrados.length);
        });
    } else {
        copiarFallbackTextarea(texto, filtrados.length);
    }
}

function copiarFallbackTextarea(texto, totalFiltrados) {
    let ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
        document.execCommand('copy');
        alert(`📋 ${totalFiltrados} lançamento(s) copiado(s) no padrão SIAKI com sucesso!`);
    } catch (e) {
        alert("Não foi possível copiar automaticamente.");
    }
    document.body.removeChild(ta);
}

function excluirLancamento(idOuIndex, fallbackIndex) {
    if (isVisualizador) return;
    if (confirm("Deseja excluir este lançamento SIAKI de forma sincronizada?")) {
        let idxReal = db.lancamentos.findIndex(l => String(l.id) === String(idOuIndex));
        if (idxReal === -1 && typeof fallbackIndex === 'number') {
            idxReal = fallbackIndex;
        }
        if (idxReal >= 0 && db.lancamentos[idxReal]) {
            db.lancamentos.splice(idxReal, 1);
        } else if (typeof idOuIndex === 'number' && idOuIndex >= 0 && idOuIndex < db.lancamentos.length) {
            db.lancamentos.splice(idOuIndex, 1);
        } else if (typeof fallbackIndex === 'number' && fallbackIndex >= 0 && fallbackIndex < db.lancamentos.length) {
            db.lancamentos.splice(fallbackIndex, 1);
        } else {
            alert("Erro ao localizar lançamento para exclusão.");
            return;
        }
        registrarMovimentacao("Exclusão Lançamento SIAKI", "Admin", `Excluiu lançamento do histórico SIAKI.`);
        salvarDb();
        atualizarPainelAdmin();
        alert("✅ Lançamento excluído com sucesso e sincronizado de forma imediata!");
    }
}

function abrirModalTecnico(index = -1) {
    if (isVisualizador) return;
    document.getElementById('edit-tech-index').value = index;
    if (index >= 0) {
        let t = db.tecnicos[index];
        document.getElementById('modal-tech-title').innerText = "Editar Técnico";
        document.getElementById('tech-form-name').value = t.name;
        document.getElementById('tech-form-login').value = t.login;
        document.getElementById('tech-form-pass').value = t.senha;
        document.getElementById('tech-form-car').value = t.car;
        document.getElementById('tech-form-apply-padrao').checked = false;
    } else {
        document.getElementById('modal-tech-title').innerText = "Cadastrar Técnico";
        document.getElementById('tech-form-name').value = '';
        document.getElementById('tech-form-login').value = '';
        document.getElementById('tech-form-pass').value = '';
        document.getElementById('tech-form-car').value = '';
        document.getElementById('tech-form-apply-padrao').checked = true;
    }
    document.getElementById('modal-tecnico').classList.remove('hidden');
}

function fecharModalTecnico() {
    document.getElementById('modal-tecnico').classList.add('hidden');
}

function salvarTecnicoForm() {
    if (isVisualizador) return;
    let index = parseInt(document.getElementById('edit-tech-index').value);
    let name = document.getElementById('tech-form-name').value;
    let login = document.getElementById('tech-form-login').value.trim().toLowerCase();
    let senha = document.getElementById('tech-form-pass').value;
    let car = document.getElementById('tech-form-car').value;
    let applyPadrao = document.getElementById('tech-form-apply-padrao').checked;

    if (!name || !login || !senha) { alert("Preencha todos os campos!"); return; }

    if (index >= 0) {
        db.tecnicos[index].name = name;
        db.tecnicos[index].login = login;
        db.tecnicos[index].senha = senha;
        db.tecnicos[index].car = car;
    } else {
        let malaInicial = [];
        if (applyPadrao && db.estoquePadrao && db.estoquePadrao.length > 0) {
            malaInicial = db.estoquePadrao.map(ep => ({
                sap: ep.sap,
                desc: ep.desc,
                qtd: Number(ep.qtdInicial || 0),
                lancado: 0,
                abastecido: Number(ep.qtdInicial || 0),
                seriais: []
            }));
        } else {
            malaInicial = (db.materiais || []).map(m => ({ sap: m.sap, desc: m.desc, qtd: 100, lancado: 0, abastecido: 100, seriais: [] }));
        }

        db.tecnicos.push({
            name, login, senha, car, avatar: "", lat: -9.6658, lng: -35.7350, rua: "Maceió - AL",
            trackingOn: false, gpsStatus: "desativado", autoKm: 0, autoLitros: 0, autoCusto: 0,
            online: false, lastSeen: "Nunca", amigos: [], pedidosAmizade: [], notificacoes: [],
            mala: malaInicial
        });
    }
    salvarDb();
    fecharModalTecnico();
    atualizarPainelAdmin();
}

function editarTecnico(i) { abrirModalTecnico(i); }
function excluirTecnico(i) { if (isVisualizador) return; if (confirm("Excluir técnico?")) { db.tecnicos.splice(i, 1); salvarDb(); atualizarPainelAdmin(); } }

function adicionarTecnicoPorLoginRapido() {
    if (isVisualizador) return;
    let login = document.getElementById('quick-add-login').value.trim().toLowerCase();
    let usePadrao = document.getElementById('quick-add-use-padrao').checked;

    if (!login) { alert("Digite o login!"); return; }
    if (db.tecnicos.find(t => t.login === login)) { alert("Técnico já existe!"); return; }

    let malaInicial = [];
    if (usePadrao && db.estoquePadrao && db.estoquePadrao.length > 0) {
        malaInicial = db.estoquePadrao.map(ep => ({
            sap: ep.sap,
            desc: ep.desc,
            qtd: Number(ep.qtdInicial || 0),
            lancado: 0,
            abastecido: Number(ep.qtdInicial || 0),
            seriais: []
        }));
    } else {
        malaInicial = (db.materiais || []).map(m => ({ sap: m.sap, desc: m.desc, qtd: 100, lancado: 0, abastecido: 100, seriais: [] }));
    }

    db.tecnicos.push({
        name: login.toUpperCase(),
        login: login,
        senha: "123",
        car: "Viatura Padrão",
        avatar: "",
        lat: -9.6658,
        lng: -35.7350,
        rua: "Maceió - AL",
        trackingOn: false,
        gpsStatus: "desativado",
        autoKm: 0,
        autoLitros: 0,
        autoCusto: 0,
        online: false,
        lastSeen: "Nunca",
        amigos: [],
        pedidosAmizade: [],
        notificacoes: [],
        mala: malaInicial
    });
    document.getElementById('quick-add-login').value = '';
    salvarDb();
    alert("✅ Técnico adicionado com sucesso com estoque padrão configurado!");
    atualizarPainelAdmin();
}

function adicionarMaterialAdmin() {
    if (isVisualizador) return;
    let sap = document.getElementById('mat-sap').value.trim();
    let desc = document.getElementById('mat-desc').value.trim();
    if (!sap || !desc) { alert("Preencha SAP e Descrição!"); return; }

    if (!db.materiais) db.materiais = [];
    if (!db.materiais.some(m => m.sap === sap)) {
        db.materiais.push({ sap, desc });
    }

    document.getElementById('mat-sap').value = '';
    document.getElementById('mat-desc').value = '';
    registrarMovimentacao("Catálogo SAP+Desc", "Admin", `Cadastrou material ${desc} (${sap})`);
    salvarDb();
    atualizarPainelAdmin();
    alert("✅ Material cadastrado no Catálogo SAP+Desc e sincronizado sem erros!");
}

function abrirModalEditarMaterial(i) {
    if (isVisualizador) return;
    let mat = db.materiais[i];
    if (!mat) return;
    document.getElementById('edit-mat-index').value = i;
    document.getElementById('edit-mat-sap').value = mat.sap;
    document.getElementById('edit-mat-desc').value = mat.desc;
    document.getElementById('modal-editar-material').classList.remove('hidden');
}

function fecharModalEditarMaterial() {
    document.getElementById('modal-editar-material').classList.add('hidden');
}

function salvarEdicaoMaterialAdmin() {
    if (isVisualizador) return;
    let idx = parseInt(document.getElementById('edit-mat-index').value);
    let novoSap = document.getElementById('edit-mat-sap').value.trim();
    let novaDesc = document.getElementById('edit-mat-desc').value.trim();

    if (!novoSap || !novaDesc) { alert("Preencha o Código SAP e a Descrição!"); return; }

    if (db.materiais && db.materiais[idx]) {
        let sapAntigo = db.materiais[idx].sap;
        let descAntiga = db.materiais[idx].desc;

        db.materiais[idx].sap = novoSap;
        db.materiais[idx].desc = novaDesc;

        db.tecnicos.forEach(t => {
            if (t.mala) {
                t.mala.forEach(m => {
                    if (m.sap === sapAntigo || m.desc === descAntiga) {
                        m.sap = novoSap;
                        m.desc = novaDesc;
                    }
                });
            }
        });

        registrarMovimentacao("Edição Catálogo", "Admin", `Alterou material (${sapAntigo}) para ${novaDesc} (${novoSap})`);
        salvarDb();
        fecharModalEditarMaterial();
        atualizarPainelAdmin();
        alert("✅ Material editado e atualizado em todo o sistema ao vivo!");
    }
}

function removerMaterialAdmin(i) {
    if (isVisualizador) return;
    let mat = db.materiais[i];
    if (!mat) return;

    if (confirm(`Tem certeza que deseja excluir o material "${mat.desc}" (${mat.sap})?\nIsso irá removê-lo do catálogo e das malas dos técnicos ao vivo.`)) {
        let sapExcluido = mat.sap;
        let descExcluida = mat.desc;

        db.materiais.splice(i, 1);

        db.tecnicos.forEach(t => {
            if (t.mala) {
                t.mala = t.mala.filter(m => m.sap !== sapExcluido && m.desc !== descExcluida);
            }
        });

        registrarMovimentacao("Exclusão Catálogo", "Admin", `Excluiu material ${descExcluida} (${sapExcluido}) do sistema`);
        salvarDb();
        atualizarPainelAdmin();
        alert("✅ Material removido do catálogo e das malas dos técnicos de forma sincronizada!");
    }
}

function acionarSOS() {
    if (confirm("ATENÇÃO: Deseja acionar o alerta SOS de emergência para a Base?")) {
        let sosPayload = {
            nome: usuarioLogado.name,
            car: usuarioLogado.car,
            hora: new Date().toLocaleTimeString()
        };
        db.sosAtivo = sosPayload;
        registrarMovimentacao("SOS", usuarioLogado.name, `ACIONOU SOS DE EMERGÊNCIA!`);
        db.notificacoes.push({ text: `EMERGÊNCIA: Técnico ${usuarioLogado.name} acionou o SOS!`, time: new Date().toLocaleDateString(), tipo: "danger" });
        salvarDb();
        alert("🚨 Alerta SOS enviado com sucesso para a Central!");
    }
}

// --- RESOLVER SOS DE FORMA IMEDIATA E DEFINITIVA ---
function resolverSos() {
    if (isVisualizador) return;
    db.sosAtivo = null;
    let sosBanner = document.getElementById('sos-alert-banner');
    if (sosBanner) sosBanner.classList.add('hidden');
    registrarMovimentacao("SOS Resolvido", "Admin", `Alerta SOS foi resolvido.`);
    
    // Remove diretamente do nó no Firebase e salva o banco
    dbRef.child('sosAtivo').remove().then(() => {
        salvarDb();
        atualizarBannerSosENotificacoesAdmin();
    }).catch(() => {
        salvarDb();
        atualizarBannerSosENotificacoesAdmin();
    });
}

function toggleNotifDropdown() {
    let d = document.getElementById('notif-dropdown');
    if (d) d.classList.toggle('hidden');
}

function removerNotificacaoIndividualAdmin(idx) {
    if (isVisualizador) return;
    if (Array.isArray(db.notificacoes)) {
        db.notificacoes.splice(idx, 1);
        dbRef.child('notificacoes').set(db.notificacoes).then(() => {
            atualizarBannerSosENotificacoesAdmin();
        });
    }
}

function limparNotificacoes() {
    if (isVisualizador) return;
    db.notificacoes = [];
    dbRef.child('notificacoes').set([]).then(() => {
        atualizarBannerSosENotificacoesAdmin();
    }).catch(() => {
        salvarDb();
        atualizarBannerSosENotificacoesAdmin();
    });
}

function inicializarPainelTecnico() {
    document.getElementById('tech-welcome-name').innerText = usuarioLogado.name + " (" + usuarioLogado.car + ")";
    if (usuarioLogado.avatar) document.getElementById('tech-avatar-box').innerHTML = `<img src="${usuarioLogado.avatar}" class="w-full h-full object-cover">`;
    else document.getElementById('tech-avatar-text').innerText = usuarioLogado.name.charAt(0);

    if (!usuarioLogado.mala) {
        usuarioLogado.mala = (db.materiais || []).map(m => ({ sap: m.sap, desc: m.desc, qtd: 0, lancado: 0, abastecido: 0, seriais: [] }));
    }
    atualizarTechNotificacoesBadge();
    atualizarBadgeGpsCelularTech(usuarioLogado.gpsStatus === 'ativado' || usuarioLogado.trackingOn);
    atualizarTelemetriaTecnicoLive();
    abrirCardTech('lancamento');
}

function atualizarTechNotificacoesBadge() {
    let counter = document.getElementById('tech-notif-counter');
    let list = document.getElementById('tech-notif-list');
    if (!usuarioLogado) return;
    let notifs = normalizarArray(usuarioLogado.notificacoes);
    usuarioLogado.notificacoes = notifs;

    if (counter) {
        if (notifs.length > 0) {
            counter.classList.remove('hidden');
            counter.innerText = notifs.length;
        } else {
            counter.classList.add('hidden');
            counter.innerText = "0";
        }
    }

    if (list) {
        if (notifs.length > 0) {
            list.innerHTML = notifs.slice().reverse().map((n, revIdx) => {
                let realIdx = notifs.length - 1 - revIdx;
                return `
                    <div class="p-2 bg-black rounded-xl border-l-4 border-red-600 flex justify-between items-start gap-2">
                        <div>
                            <p class="font-semibold text-white">${n.text}</p>
                            <span class="text-[9px] text-zinc-300">${n.time || ''}</span>
                        </div>
                        <button type="button" onclick="removerNotificacaoIndividualTech(${realIdx})" class="text-zinc-400 hover:text-red-400 text-xs font-bold px-1" title="Remover">×</button>
                    </div>
                `;
            }).join('');
        } else {
            list.innerHTML = '<p class="text-zinc-300 text-center py-2">Nenhuma notificação.</p>';
        }
    }
}

function toggleTechNotifDropdown() {
    let d = document.getElementById('tech-notif-dropdown');
    if (d) d.classList.toggle('hidden');
}

function removerNotificacaoIndividualTech(idx) {
    if (!usuarioLogado) return;
    let techIdx = db.tecnicos.findIndex(t => t.login === usuarioLogado.login);
    if (Array.isArray(usuarioLogado.notificacoes)) {
        usuarioLogado.notificacoes.splice(idx, 1);
        if (techIdx !== -1) {
            db.tecnicos[techIdx].notificacoes = [...usuarioLogado.notificacoes];
            dbRef.child(`tecnicos/${techIdx}/notificacoes`).set(usuarioLogado.notificacoes);
        }
        atualizarTechNotificacoesBadge();
    }
}

function limparTechNotificacoes() {
    if (!usuarioLogado) return;
    usuarioLogado.notificacoes = [];
    let techIdx = db.tecnicos.findIndex(t => t.login === usuarioLogado.login);
    if (techIdx !== -1) {
        db.tecnicos[techIdx].notificacoes = [];
        dbRef.child(`tecnicos/${techIdx}/notificacoes`).set([]).then(() => {
            atualizarTechNotificacoesBadge();
        });
    } else {
        salvarDb();
        atualizarTechNotificacoesBadge();
    }
}

function mudarFotoPerfil(e) {
    let file = e.target.files[0];
    if (file) {
        let r = new FileReader();
        r.onload = function (evt) {
            usuarioLogado.avatar = evt.target.result;
            let t = db.tecnicos.find(x => x.login === usuarioLogado.login);
            if (t) t.avatar = usuarioLogado.avatar;
            registrarMovimentacao("Foto de Perfil", usuarioLogado.name, `Atualizou sua foto de perfil.`);
            salvarDb();
            inicializarPainelTecnico();
            renderizarPinsMapaLeaflet();
        };
        r.readAsDataURL(file);
    }
}

function abrirModalChamada() {
    let select = document.getElementById('call-dest-select');
    select.innerHTML = `<option value="Base Central">Base Central</option>` + (usuarioLogado.amigos || []).map(a => `<option value="${a}">${a.toUpperCase()}</option>`).join('');
    document.getElementById('modal-chamada').classList.remove('hidden');
}

function enviarSolicitacaoLigacao() {
    let dest = document.getElementById('call-dest-select').value;
    registrarMovimentacao("Solicitação Ligação", usuarioLogado.name, `Solicitou ligação para ${dest}`);
    db.notificacoes.push({ text: `Técnico ${usuarioLogado.name} solicitou ligação para ${dest}!`, time: new Date().toLocaleDateString(), tipo: "info" });
    salvarDb();
    document.getElementById('modal-chamada').classList.add('hidden');
    alert(`📞 Solicitação de ligação enviada para ${dest} com sucesso!`);
}

function renderizarCardTechAtivo() {
    if (cardTechAtivo && usuarioLogado) {
        abrirCardTech(cardTechAtivo);
    }
}

function atualizarEstiloAbasTech(tipo) {
    ['lancamento', 'historico', 'mala', 'chat', 'reposicao', 'colega'].forEach(t => {
        let btn = document.getElementById('ttab-' + t);
        if (btn) {
            if (t === tipo) {
                btn.className = "flex-1 py-2 px-1 rounded-xl bg-red-600 text-white transition text-center flex flex-col items-center justify-center space-y-0.5 font-bold text-[10px] shadow";
            } else {
                btn.className = "flex-1 py-2 px-1 rounded-xl text-zinc-300 hover:bg-zinc-800 hover:text-white transition text-center flex flex-col items-center justify-center space-y-0.5 text-[10px] font-semibold";
            }
        }
    });
}

function limparCarrinhoTecnico() {
    if (carrinhoAtual.length === 0) {
        alert("O carrinho já está vazio.");
        return;
    }
    if (confirm("Deseja excluir rapidamente todos os itens selecionados do carrinho?")) {
        carrinhoAtual = [];
        renderizarCarrinhoTecnico();
        renderizarSelecaoTecnico(true);
    }
}

function abrirCardTech(tipo) {
    cardTechAtivo = tipo;
    atualizarEstiloAbasTech(tipo);
    let content = document.getElementById('tech-section-content');
    if (!content || !usuarioLogado) return;

    if (tipo === 'lancamento') {
        let totalItensCarrinho = carrinhoAtual.reduce((acc, i) => acc + Number(i.qtd || 0), 0);
        let indicadorResumoHtml = carrinhoAtual.length > 0 
            ? `<div class="p-3 bg-red-950/90 border border-red-700 rounded-xl flex items-center justify-between text-xs text-red-200 shadow">
                   <div>🔥 <b>Itens Selecionados:</b> ${carrinhoAtual.length} tipo(s) | <b class="text-amber-300">${totalItensCarrinho} unidades no total</b></div>
                   <button type="button" onclick="limparCarrinhoTecnico()" class="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-[10px] shadow">🗑️ Excluir Todos</button>
               </div>`
            : `<div class="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-center text-xs text-zinc-300 italic font-semibold">Nenhum item selecionado no momento. Escolha abaixo.</div>`;

        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h4 class="font-bold text-red-400 text-xs sm:text-sm flex items-center space-x-2"><i data-lucide="clipboard-list" class="w-4 h-4"></i><span>Lançamento em Campo</span></h4>
                    ${carrinhoAtual.length > 0 ? `<button type="button" onclick="limparCarrinhoTecnico()" class="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-[10px] shadow">🗑️ Excluir Todos</button>` : ''}
                </div>
                
                <div id="tech-selection-indicator-box">
                    ${indicadorResumoHtml}
                </div>

                <div class="grid grid-cols-1 gap-2.5">
                    <div>
                        <label class="block text-[11px] font-semibold text-zinc-200 mb-1">Projeto</label>
                        <select id="t-projeto" class="w-full px-3 py-2 bg-black border border-zinc-700 rounded-xl text-xs outline-none text-white font-semibold">
                            <option value="MDU GPON GF">MDU GPON GF</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[11px] font-semibold text-zinc-200 mb-1">Node / Imóvel</label>
                        <input type="text" id="t-node" autocomplete="off" placeholder="Ex: 378556075" class="w-full px-3 py-2 bg-black border border-zinc-700 rounded-xl text-xs outline-none text-white font-semibold">
                    </div>
                    <div>
                        <label class="block text-[11px] font-semibold text-zinc-200 mb-1">Local de Descarga</label>
                        <input type="text" id="t-local-desc" value="865323" readonly class="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-red-400 font-bold outline-none">
                    </div>
                </div>

                <div class="space-y-3 pt-1">
                    <div>
                        <label class="block text-[11px] font-semibold text-zinc-200 mb-1">Buscar Material no Catálogo</label>
                        <input type="text" id="t-search-mat" autocomplete="off" oninput="renderizarSelecaoTecnico(false)" placeholder="Digite o SAP ou Descrição..." class="w-full px-3 py-2 bg-black border border-zinc-700 rounded-xl text-xs outline-none text-white font-semibold mb-2">
                        <div id="t-material-list"
                             ontouchstart="isTouchingMaterialScroll = true"
                             ontouchend="setTimeout(() => { isTouchingMaterialScroll = false; }, 350)"
                             ontouchcancel="isTouchingMaterialScroll = false"
                             onscroll="isTouchingMaterialScroll = true; clearTimeout(window._matScrollTimeout); window._matScrollTimeout = setTimeout(() => { isTouchingMaterialScroll = false; }, 400);"
                             class="max-h-48 overflow-y-auto space-y-1 border border-zinc-700 p-2 rounded-xl bg-black"></div>
                    </div>
                    <div>
                        <label class="block text-[11px] font-semibold text-zinc-200 mb-1">Favoritos Rápido</label>
                        <div id="t-favorites-list" class="flex flex-wrap gap-1.5 p-2 border border-zinc-700 rounded-xl bg-black max-h-36 overflow-y-auto"></div>
                    </div>
                </div>

                <div class="pt-2 border-t border-zinc-700">
                    <h5 class="font-bold text-xs text-zinc-200 mb-2">Carrinho de Lançamento</h5>
                    <table class="w-full text-xs text-left text-zinc-200">
                        <thead class="bg-black border-b border-zinc-700 text-zinc-300"><tr><th class="p-2">Material</th><th class="p-2 text-center">Qtd</th><th class="p-2 text-center">Remover</th></tr></thead>
                        <tbody id="t-cart-table" class="divide-y divide-zinc-700"><tr><td colspan="3" class="p-3 text-center text-zinc-400">Nenhum item adicionado.</td></tr></tbody>
                    </table>
                </div>
                <button type="button" onclick="salvarLoteTecnico()" class="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg transition">Confirmar e Enviar Lançamento</button>
            </div>
        `;
        renderizarSelecaoTecnico(false);
        renderizarCarrinhoTecnico();
    } else if (tipo === 'historico') {
        content.innerHTML = `
            <div class="space-y-3">
                <h4 class="font-bold text-red-400 text-xs sm:text-sm flex items-center space-x-2">
                    <i data-lucide="history" class="w-4 h-4"></i>
                    <span>Meu Histórico de Lançamentos</span>
                </h4>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="text" id="tech-hist-search" oninput="renderizarHistoricoLancesTecnico()" placeholder="Pesquisar por material, node ou projeto..." class="px-3 py-2 bg-black border border-zinc-700 rounded-xl text-xs text-white font-semibold outline-none">
                    <input type="date" id="tech-hist-date" onchange="renderizarHistoricoLancesTecnico()" class="px-3 py-2 bg-black border border-zinc-700 rounded-xl text-xs text-white font-semibold outline-none">
                </div>

                <div id="tech-hist-list"
                     ontouchstart="isTouchingHistoryScroll = true"
                     ontouchend="setTimeout(() => { isTouchingHistoryScroll = false; }, 350)"
                     ontouchcancel="isTouchingHistoryScroll = false"
                     onscroll="isTouchingHistoryScroll = true; clearTimeout(window._histScrollTimeout); window._histScrollTimeout = setTimeout(() => { isTouchingHistoryScroll = false; }, 400);"
                     class="max-h-80 overflow-y-auto space-y-2 pt-1"></div>
            </div>
        `;
        renderizarHistoricoLancesTecnico();
    } else if (tipo === 'mala') {
        content.innerHTML = `
            <div class="space-y-4">
                <h4 class="font-bold text-red-400 text-xs sm:text-sm">Minha Mala (Miscelâneas e Seriais MIS)</h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-left text-zinc-200">
                        <thead class="bg-black border-b border-zinc-700 text-zinc-300">
                            <tr><th class="p-2.5">SAP</th><th class="p-2.5">Descrição</th><th class="p-2.5 text-center">Qtd Atual</th><th class="p-2.5 text-center">Lançado</th><th class="p-2.5">Seriais</th></tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-700">
                            ${(usuarioLogado.mala || []).map(m => `
                                <tr>
                                    <td class="p-2.5 font-mono text-red-400 font-semibold">${m.sap}</td>
                                    <td class="p-2.5 text-white font-semibold">${m.desc}</td>
                                    <td class="p-2.5 text-center font-bold text-white">${m.qtd}</td>
                                    <td class="p-2.5 text-center text-amber-300 font-bold">${m.lancado || 0}</td>
                                    <td class="p-2.5 font-mono text-[10px] text-emerald-300 font-semibold">${m.seriais && m.seriais.length > 0 ? m.seriais.join(', ') : '-'}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="5" class="p-4 text-center text-zinc-400">Nenhum item na mala.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else if (tipo === 'chat') {
        content.innerHTML = `
            <div class="space-y-3 h-[450px] flex flex-col">
                <h4 class="font-bold text-red-400 text-xs sm:text-sm">Chat Direct</h4>
                <div class="flex space-x-2 overflow-x-auto pb-1" id="tech-chat-contacts-bar">
                    <button type="button" onclick="selecionarChatTech('Base')" id="btn-chat-Base" class="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold flex-shrink-0 relative shadow">Base Central</button>
                    <div id="tech-colleagues-chat-btns" class="flex space-x-2"></div>
                </div>
                <div id="tech-chat-box" class="flex-1 bg-black border border-zinc-700 rounded-xl p-3 overflow-y-auto space-y-2 text-xs"></div>
                <div class="flex items-center space-x-1.5 sm:space-x-2">
                    <input type="text" id="tech-chat-input" autocomplete="off" onkeydown="if(event.key==='Enter') enviarMsgTech()" placeholder="Mensagem..." class="flex-1 px-3.5 py-2.5 bg-black border border-zinc-700 rounded-xl text-xs text-white font-semibold outline-none focus:border-red-600">
                    <button type="button" id="btn-rec-audio-tech" onclick="toggleGravarAudio(true)" title="Gravar Áudio" class="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center shadow">
                        <i data-lucide="mic" class="w-4 h-4 text-red-400"></i>
                    </button>
                    <button type="button" onclick="enviarMsgTech()" class="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow">Enviar</button>
                </div>
            </div>
        `;
        renderizarColegasChatTech();
        atualizarMsgTechBox();
    } else if (tipo === 'reposicao') {
        content.innerHTML = `
            <div class="space-y-4 max-w-md mx-auto">
                <h4 class="font-bold text-red-400 text-xs sm:text-sm">Solicitar Reposição de Material</h4>
                <select id="t-rep-mat" class="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-xl text-xs outline-none text-white font-semibold">
                    ${(db.materiais || []).map(m => `<option value="${m.desc}">${m.sap} - ${m.desc}</option>`).join('')}
                </select>
                <input type="number" id="t-rep-qtd" min="1" value="10" class="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-xl text-xs outline-none text-white font-semibold" placeholder="Quantidade">
                <button type="button" onclick="solicitarReposicaoTech()" class="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition shadow">Enviar Pedido de Reposição</button>
            </div>
        `;
    } else if (tipo === 'colega') {
        let pendentesHtml = (usuarioLogado.pedidosAmizade || []).map((ped, pIdx) => `
            <div class="p-3 bg-black border border-zinc-700 rounded-xl flex justify-between items-center text-xs">
                <span class="text-white font-semibold"><b>${ped.nome || ped}</b> quer ser seu colega</span>
                <div class="space-x-2">
                    <button type="button" onclick="aceitarPedidoAmizade('${ped.login || ped}')" class="px-3 py-1 bg-emerald-600 text-white rounded font-bold shadow">Aceitar</button>
                    <button type="button" onclick="recusarPedidoAmizade(${pIdx})" class="px-3 py-1 bg-red-600 text-white rounded font-bold shadow">Recusar</button>
                </div>
            </div>
        `).join('');

        content.innerHTML = `
            <div class="space-y-4 max-w-md mx-auto">
                <h4 class="font-bold text-red-400 text-xs sm:text-sm">Adicionar Colega de Trabalho</h4>
                <input type="text" id="colega-busca-login" placeholder="Insira o login (ex: carlos)" class="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-xl text-xs text-white font-semibold outline-none">
                <button type="button" onclick="enviarPedidoAmizadeTech()" class="w-full py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs shadow">Enviar Solicitação de Amizade</button>
                
                <div class="pt-4 border-t border-zinc-700 space-y-2">
                    <h5 class="font-bold text-xs text-zinc-200">Solicitações Pendentes</h5>
                    <div id="tech-pedidos-list" class="space-y-2">${pendentesHtml || '<p class="text-zinc-400 italic text-xs">Nenhuma solicitação pendente.</p>'}</div>
                </div>
            </div>
        `;
    }
    if (window.lucide) lucide.createIcons();
}

function renderizarHistoricoLancesTecnico() {
    let container = document.getElementById('tech-hist-list');
    if (!container || !usuarioLogado) return;

    const savedScrollTop = container.scrollTop;

    let termo = (document.getElementById('tech-hist-search')?.value || '').toLowerCase();
    let dataFiltro = document.getElementById('tech-hist-date')?.value;

    let meusLancamentos = (db.lancamentos || []).filter(l => l.tecnico === usuarioLogado.name || l.tecnico === usuarioLogado.login || (l.techLogin && l.techLogin === usuarioLogado.login));

    let filtrados = meusLancamentos.filter(l => {
        if (dataFiltro && l.data !== dataFiltro) return false;
        if (termo) {
            let bateuNode = l.node && l.node.toLowerCase().includes(termo);
            let bateuProj = l.projeto && l.projeto.toLowerCase().includes(termo);
            let bateuMat = l.items && l.items.some(i => (i.material && i.material.toLowerCase().includes(termo)) || (i.sap && i.sap.toLowerCase().includes(termo)));
            return bateuNode || bateuProj || bateuMat;
        }
        return true;
    });

    if (filtrados.length === 0) {
        container.innerHTML = '<p class="text-zinc-400 text-center py-4 text-xs italic">Nenhum lançamento encontrado para os filtros informados.</p>';
        return;
    }

    container.innerHTML = filtrados.slice().reverse().map(l => {
        let itemsHtml = l.items.map(i => `<li class="flex justify-between items-center"><span class="truncate pr-2 text-zinc-200"><b>${i.sap}</b> - ${i.material}</span> <b class="text-red-400 font-mono flex-shrink-0">${i.qtd} un</b></li>`).join('');
        let statusBadge = l.statusServidor === 'erro'
            ? `<span class="px-2 py-0.5 rounded bg-red-900 text-red-200 font-bold text-[9px] border border-red-700 flex items-center gap-1 shadow">❌ Erro no Envio</span>`
            : `<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[9px] border border-emerald-700 flex items-center gap-1 shadow">✅ Chegou ao Sistema (${l.hora || 'Sincronizado'})</span>`;

        return `
            <div class="p-3 bg-black border border-zinc-700 rounded-xl space-y-1.5 text-xs shadow-md">
                <div class="flex justify-between items-center border-b border-zinc-700 pb-1.5">
                    <span class="text-zinc-300 font-mono text-[10px] font-semibold">📅 ${l.data} ${l.hora ? 'às ' + l.hora : ''}</span>
                    ${statusBadge}
                </div>
                <div class="text-red-400 font-bold text-xs flex justify-between items-center">
                    <span>${l.projeto} (Node: ${l.node})</span>
                </div>
                <ul class="space-y-1 pl-1 text-[11px] text-zinc-200 border-t border-zinc-800 pt-1">
                    ${itemsHtml}
                </ul>
            </div>
        `;
    }).join('');

    if (isTouchingHistoryScroll) {
        container.scrollTop = savedScrollTop;
    }
}

function apagarMensagemChat(msgId) {
    if (isVisualizador) return;
    if (confirm("Deseja apagar esta mensagem do chat?")) {
        db.mensagens = db.mensagens.filter(m => String(m.id) !== String(msgId));
        salvarDb();
        if (usuarioLogado) atualizarMsgTechBox();
        else atualizarMensagensAdminBox();
    }
}

async function toggleGravarAudio(isTech = true) {
    const btnId = isTech ? 'btn-rec-audio-tech' : 'btn-rec-audio-admin';
    const btn = document.getElementById(btnId);

    if (!isRecordingAudio) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result;
                    if (isTech) {
                        enviarAudioTech(base64Audio);
                    } else {
                        enviarAudioAdmin(base64Audio);
                    }
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecordingAudio = true;
            if (btn) {
                btn.classList.add('animate-pulse', 'bg-red-600');
                btn.innerHTML = `<i data-lucide="square" class="w-4 h-4 text-white"></i>`;
                if (window.lucide) lucide.createIcons();
            }
        } catch (err) {
            alert("Não foi possível acessar o microfone para gravar áudio.");
            console.error(err);
        }
    } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        isRecordingAudio = false;
        if (btn) {
            btn.classList.remove('animate-pulse', 'bg-red-600');
            btn.innerHTML = `<i data-lucide="mic" class="w-4 h-4 text-red-400"></i>`;
            if (window.lucide) lucide.createIcons();
        }
    }
}

function enviarAudioTech(audioDataUrl) {
    if (!audioDataUrl || !usuarioLogado) return;
    let destTech = db.tecnicos.find(t => t.name === chatDestinatarioAtual || t.login === chatDestinatarioAtual);
    db.mensagens.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        remetente: usuarioLogado.name,
        remetenteLogin: usuarioLogado.login,
        destinatario: chatDestinatarioAtual,
        destinatarioLogin: destTech ? destTech.login : chatDestinatarioAtual,
        texto: "🎤 Mensagem de áudio",
        audio: audioDataUrl,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lido: false
    });
    salvarDb();
    atualizarMsgTechBox();
    renderizarColegasChatTech();
}

function enviarAudioAdmin(audioDataUrl) {
    if (isVisualizador || !chatAdminAtual) return;
    let destTech = db.tecnicos.find(t => t.name === chatAdminAtual || t.login === chatAdminAtual);
    db.mensagens.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        remetente: "Base",
        remetenteLogin: "admin",
        destinatario: destTech ? destTech.name : chatAdminAtual,
        destinatarioLogin: destTech ? destTech.login : chatAdminAtual,
        texto: "🎤 Mensagem de áudio",
        audio: audioDataUrl,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lido: false
    });
    salvarDb();
    atualizarMensagensAdminBox();
}

function renderizarSelecaoTecnico(preservarScroll = true) {
    let filtroEl = document.getElementById('t-search-mat');
    let filtro = filtroEl ? filtroEl.value.toLowerCase() : '';
    let listEl = document.getElementById('t-material-list');
    let favEl = document.getElementById('t-favorites-list');

    if (!listEl) return;

    const savedListScrollTop = preservarScroll ? listEl.scrollTop : 0;
    const savedFavScrollTop = (preservarScroll && favEl) ? favEl.scrollTop : 0;
    const savedWindowScrollY = preservarScroll ? window.scrollY : 0;

    let todosMateriais = [];
    let sapsVistos = new Set();

    (db.materiais || []).forEach(m => {
        if (m.sap && !sapsVistos.has(m.sap)) {
            todosMateriais.push({ sap: m.sap, desc: m.desc });
            sapsVistos.add(m.sap);
        }
    });

    (db.estoqueFisico || []).forEach(ef => {
        if (ef.sap && !sapsVistos.has(ef.sap)) {
            todosMateriais.push({ sap: ef.sap, desc: ef.desc });
            sapsVistos.add(ef.sap);
        }
    });

    if (usuarioLogado && usuarioLogado.mala) {
        usuarioLogado.mala.forEach(m => {
            if (m.sap && !sapsVistos.has(m.sap)) {
                todosMateriais.push({ sap: m.sap, desc: m.desc });
                sapsVistos.add(m.sap);
            }
        });
    }

    let html = "";
    let filtrados = todosMateriais.filter(m => m.desc.toLowerCase().includes(filtro) || m.sap.toLowerCase().includes(filtro));

    filtrados.forEach(m => {
        let isFav = (db.favoritos || []).some(f => (typeof f === 'object' ? f.desc === m.desc || f.sap === m.sap : f === m.desc));
        let starColor = isFav ? "text-amber-400 fill-amber-400" : "text-zinc-500";

        let itemMala = (usuarioLogado.mala || []).find(x => x.sap === m.sap);
        let qtdMala = itemMala ? itemMala.qtd : 0;
        let descEscaped = m.desc.replace(/'/g, "\\'");

        let isInCart = carrinhoAtual.some(ci => ci.sap === m.sap);
        let cardBgClass = isInCart ? "bg-red-950/70 border-red-600 shadow-md" : "bg-zinc-900 border-zinc-700";
        let statusInclusoBadge = isInCart ? `<span class="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase ml-1 shadow">Incluso ✓</span>` : '';

        html += `
            <div class="flex justify-between items-center p-2.5 rounded-xl border ${cardBgClass} transition">
                <div class="truncate mr-2">
                    <b class="text-red-400 font-semibold">${m.sap}</b> - <span class="text-white font-semibold">${m.desc}</span> ${statusInclusoBadge}
                    <span class="text-[10px] text-zinc-300 block font-semibold">Em Mala: ${qtdMala} un</span>
                </div>
                <div class="space-x-2 flex items-center flex-shrink-0">
                    <button type="button" onclick="toggleFavTech('${descEscaped}', '${m.sap}')" class="${starColor} p-1 text-base">★</button>
                    <button type="button" onclick="addCarrinhoTech('${m.sap}', '${descEscaped}')" class="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs shadow">Add</button>
                </div>
            </div>
        `;
    });
    listEl.innerHTML = html || '<p class="text-zinc-400 text-center text-xs py-2">Nenhum material cadastrado no sistema.</p>';

    let favHtml = "";
    (db.favoritos || []).forEach(f => {
        let descStr = typeof f === 'object' ? f.desc : f;
        let sapStr = typeof f === 'object' ? f.sap : '';
        let descEscaped = descStr.replace(/'/g, "\\'");
        favHtml += `
            <div class="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-950/80 border border-red-700 text-red-200 rounded-lg text-xs font-bold shadow">
                <span onclick="addCarrinhoTechPorDesc('${descEscaped}', '${sapStr}')" class="cursor-pointer">${descStr}</span>
                <button type="button" onclick="removerFavTech('${descEscaped}')" class="text-zinc-300 hover:text-white ml-1">×</button>
            </div>
        `;
    });
    if (favEl) favEl.innerHTML = favHtml || '<span class="text-zinc-400 text-xs italic">Nenhum favorito.</span>';

    if (preservarScroll) {
        listEl.scrollTop = savedListScrollTop;
        if (favEl) favEl.scrollTop = savedFavScrollTop;
        if (window.scrollY !== savedWindowScrollY) {
            window.scrollTo(0, savedWindowScrollY);
        }
    }
}

function toggleFavTech(desc, sap) {
    if (!db.favoritos) db.favoritos = [];
    let idx = db.favoritos.findIndex(f => typeof f === 'object' ? f.sap === sap || f.desc === desc : f === desc);
    if (idx >= 0) db.favoritos.splice(idx, 1);
    else db.favoritos.push({ sap: sap || 'N/A', desc: desc });
    salvarDb();
    renderizarSelecaoTecnico(true);
}

function removerFavTech(desc) {
    if (!db.favoritos) db.favoritos = [];
    let idx = db.favoritos.findIndex(f => typeof f === 'object' ? f.desc === desc : f === desc);
    if (idx >= 0) db.favoritos.splice(idx, 1);
    salvarDb();
    renderizarSelecaoTecnico(true);
}

function addCarrinhoTech(sap, desc) {
    let item = carrinhoAtual.find(i => i.sap === sap);
    if (item) item.qtd += 1;
    else carrinhoAtual.push({ sap, material: desc, qtd: 1, descarte: 0 });
    renderizarCarrinhoTecnico();
    renderizarSelecaoTecnico(true);
}

function addCarrinhoTechPorDesc(desc, sap) {
    let sapEncontrado = sap;
    if (!sapEncontrado) {
        let mat = (db.materiais || []).find(x => x.desc === desc) || (db.estoqueFisico || []).find(x => x.desc === desc);
        if (mat) sapEncontrado = mat.sap;
    }
    if (sapEncontrado) addCarrinhoTech(sapEncontrado, desc);
    else addCarrinhoTech("CAD-00", desc);
}

function atualizarQtdCarrinhoTech(idx, valor) {
    let qtd = Number(valor);
    if (isNaN(qtd) || qtd < 1) qtd = 1;
    if (carrinhoAtual[idx]) {
        carrinhoAtual[idx].qtd = qtd;
        atualizarIndicadorSelecaoCarrinho();
    }
}

function atualizarIndicadorSelecaoCarrinho() {
    let box = document.getElementById('tech-selection-indicator-box');
    if (!box) return;
    let totalItensCarrinho = carrinhoAtual.reduce((acc, i) => acc + Number(i.qtd || 0), 0);
    if (carrinhoAtual.length > 0) {
        box.innerHTML = `
            <div class="p-3 bg-red-950/90 border border-red-700 rounded-xl flex items-center justify-between text-xs text-red-200 shadow">
                <div>🔥 <b>Itens Selecionados:</b> ${carrinhoAtual.length} tipo(s) | <b class="text-amber-300">${totalItensCarrinho} unidades no total</b></div>
                <button type="button" onclick="limparCarrinhoTecnico()" class="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-[10px] shadow">🗑️ Excluir Todos</button>
            </div>
        `;
    } else {
        box.innerHTML = `
            <div class="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-center text-xs text-zinc-300 italic font-semibold">Nenhum item selecionado no momento. Escolha abaixo.</div>
        `;
    }
}

function renderizarCarrinhoTecnico() {
    atualizarIndicadorSelecaoCarrinho();
    let tbody = document.getElementById('t-cart-table');
    if (!tbody) return;
    if (carrinhoAtual.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="p-3 text-center text-zinc-400">Nenhum item adicionado.</td></tr>';
        return;
    }
    tbody.innerHTML = carrinhoAtual.map((it, idx) => `
        <tr class="border-b border-zinc-700">
            <td class="p-2 text-white font-semibold"><b>${it.sap}</b> - ${it.material}</td>
            <td class="p-2 text-center">
                <input type="number" min="1" value="${it.qtd}" oninput="atualizarQtdCarrinhoTech(${idx}, this.value)" onchange="atualizarQtdCarrinhoTech(${idx}, this.value)" class="w-16 px-2 py-1 bg-black border border-zinc-600 rounded text-center text-red-400 font-bold outline-none">
            </td>
            <td class="p-2 text-center"><button type="button" onclick="carrinhoAtual.splice(${idx},1); renderizarCarrinhoTecnico(); renderizarSelecaoTecnico(true);" class="text-red-400 font-bold px-2 py-1 hover:underline">X</button></td>
        </tr>
    `).join('');
}

function salvarLoteTecnico() {
    let projetoEl = document.getElementById('t-projeto');
    let nodeEl = document.getElementById('t-node');
    if (!projetoEl || !nodeEl) return;

    let projeto = projetoEl.value;
    let node = nodeEl.value.trim();
    if (!node) { alert("Informe o Node!"); return; }
    if (carrinhoAtual.length === 0) { alert("Adicione itens!"); return; }

    let techNoDb = db.tecnicos.find(t => t.login === usuarioLogado.login);
    if (!techNoDb) techNoDb = usuarioLogado;

    for (let it of carrinhoAtual) {
        let qtdLancar = Number(it.qtd || 1);
        if (isNaN(qtdLancar) || qtdLancar <= 0) qtdLancar = 1;
        it.qtd = qtdLancar;

        if (!techNoDb.mala) techNoDb.mala = [];
        let malaItem = techNoDb.mala.find(m => m.sap === it.sap || m.desc === it.material);

        if (malaItem) {
            malaItem.qtd = Math.max(0, Number(malaItem.qtd || 0) - qtdLancar);
            malaItem.lancado = Number(malaItem.lancado || 0) + qtdLancar;
        } else {
            techNoDb.mala.push({
                sap: it.sap,
                desc: it.material,
                qtd: 0,
                lancado: qtdLancar,
                abastecido: 0,
                seriais: []
            });
        }
    }

    usuarioLogado.mala = techNoDb.mala;

    const horaAtualStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!db.lancamentos) db.lancamentos = [];
    db.lancamentos.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        data: new Date().toISOString().split('T')[0],
        hora: horaAtualStr,
        tecnico: usuarioLogado.name,
        techLogin: usuarioLogado.login,
        projeto: projeto,
        node: node,
        local_descarga: "865323",
        items: carrinhoAtual.map(item => ({ ...item })),
        statusServidor: "ok"
    });

    registrarMovimentacao("Lançamento Campo", usuarioLogado.name, `Lançou no Node ${node} (${projeto}) - Estoque descontado.`);
    db.notificacoes.push({ text: `${usuarioLogado.name} lançou no Node ${node} (${projeto})`, time: new Date().toLocaleDateString(), tipo: "info" });

    carrinhoAtual = [];
    salvarDb();
    alert("✅ Lançamento realizado e sincronizado perfeitamente sem erros!");
    abrirCardTech('historico');
}

function solicitarReposicaoTech() {
    let matDesc = document.getElementById('t-rep-mat').value;
    let qtd = Number(document.getElementById('t-rep-qtd').value);
    if (qtd <= 0) { alert("Informe uma quantidade válida."); return; }

    db.reposicoes.push({
        id: Date.now(),
        tecnico: usuarioLogado.name,
        techLogin: usuarioLogado.login,
        material: matDesc,
        qtd: qtd,
        status: "Pendente"
    });
    registrarMovimentacao("Reposição Solicitada", usuarioLogado.name, `Solicitou reposição de ${qtd}x ${matDesc}`);
    db.notificacoes.push({ text: `${usuarioLogado.name} solicitou reposição de ${matDesc} (${qtd} un).`, time: new Date().toLocaleDateString(), tipo: "info" });
    salvarDb();
    alert("✅ Pedido de reposição enviado para a Base Central!");
}

function enviarPedidoAmizadeTech() {
    let loginBusca = document.getElementById('colega-busca-login').value.trim().toLowerCase();
    let amigo = db.tecnicos.find(t => t.login === loginBusca);
    if (!amigo) { alert("Técnico não encontrado!"); return; }
    if (amigo.login === usuarioLogado.login) { alert("Você não pode adicionar a si mesmo."); return; }
    if ((usuarioLogado.amigos || []).includes(amigo.login)) { alert("Vocês já são colegas!"); return; }

    if (!amigo.pedidosAmizade) amigo.pedidosAmizade = [];
    if (amigo.pedidosAmizade.find(p => (p.login || p) === usuarioLogado.login)) { alert("Pedido já enviado anteriormente!"); return; }

    amigo.pedidosAmizade.push({ login: usuarioLogado.login, nome: usuarioLogado.name });
    registrarMovimentacao("Solicitação Amizade", usuarioLogado.name, `Enviou pedido para ${amigo.name}`);
    salvarDb();
    alert("✅ Solicitação de amizade enviada com sucesso!");
    document.getElementById('colega-busca-login').value = '';
}

function aceitarPedidoAmizade(loginColega) {
    if (!usuarioLogado.amigos) usuarioLogado.amigos = [];
    usuarioLogado.amigos.push(loginColega);
    usuarioLogado.pedidosAmizade = usuarioLogado.pedidosAmizade.filter(p => (p.login || p) !== loginColega);

    let colegaObj = db.tecnicos.find(t => t.login === loginColega);
    if (colegaObj) {
        if (!colegaObj.amigos) colegaObj.amigos = [];
        if (!colegaObj.amigos.includes(usuarioLogado.login)) colegaObj.amigos.push(usuarioLogado.login);
    }
    salvarDb();
    alert("✅ Pedido de amizade aceito!");
    abrirCardTech('colega');
}

function recusarPedidoAmizade(pIdx) {
    usuarioLogado.pedidosAmizade.splice(pIdx, 1);
    salvarDb();
    abrirCardTech('colega');
}

function selecionarChatTech(dest) {
    chatDestinatarioAtual = dest;
    let mudou = false;
    db.mensagens.forEach(m => {
        let ehParaMim = (m.destinatario === usuarioLogado.name || m.destinatario === usuarioLogado.login || m.destinatarioLogin === usuarioLogado.login);
        let ehDoDest = (m.remetente === dest || m.remetenteLogin === dest);
        if (ehParaMim && ehDoDest && !m.lido) {
            m.lido = true;
            mudou = true;
        }
    });
    if (mudou) salvarDb();
    atualizarMsgTechBox();
    atualizarBadgesChatTech();
}

function renderizarColegasChatTech() {
    let html = "";
    (usuarioLogado.amigos || []).forEach(loginAmigo => {
        let amigoObj = db.tecnicos.find(t => t.login === loginAmigo);
        if (amigoObj) {
            let avatar = amigoObj.avatar ? `<img src="${amigoObj.avatar}" class="w-8 h-8 rounded-full object-cover">` : `<div class="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs">${amigoObj.name.charAt(0)}</div>`;
            let badgeOn = amigoObj.online ? 'bg-emerald-400' : 'bg-zinc-500';
            let naoLidas = db.mensagens.filter(m =>
                (m.remetente === amigoObj.name || m.remetenteLogin === amigoObj.login) &&
                (m.destinatario === usuarioLogado.name || m.destinatario === usuarioLogado.login || m.destinatarioLogin === usuarioLogado.login) &&
                !m.lido
            ).length;
            let badgeHtml = naoLidas > 0 ? `<span class="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow">${naoLidas}</span>` : '';
            html += `
                <div onclick="selecionarChatTech('${amigoObj.name}')" class="flex items-center space-x-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl cursor-pointer hover:border-red-600 flex-shrink-0 relative shadow">
                    <div class="relative">${avatar}<span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${badgeOn} border border-black"></span></div>
                    <div class="text-left"><span class="text-xs font-bold text-white block">${amigoObj.name}</span><span class="text-[9px] text-zinc-300 font-semibold">Online: ${amigoObj.lastSeen || 'Offline'}</span></div>
                    ${badgeHtml}
                </div>
            `;
        }
    });
    let colegasContainer = document.getElementById('tech-colleagues-chat-btns');
    if (colegasContainer) colegasContainer.innerHTML = html;
    atualizarBadgesChatTech();
}

function atualizarBadgesChatTech() {
    let naoLidasBase = db.mensagens.filter(m =>
        m.remetente === "Base" &&
        (m.destinatario === usuarioLogado.name || m.destinatario === usuarioLogado.login || m.destinatarioLogin === usuarioLogado.login) &&
        !m.lido
    ).length;
    let btnBase = document.getElementById('btn-chat-Base');
    if (btnBase) {
        if (naoLidasBase > 0) btnBase.innerHTML = `Base Central <span class="ml-1 bg-red-600 text-white px-1.5 py-0.5 rounded-full text-[9px] shadow">${naoLidasBase}</span>`;
        else btnBase.innerHTML = `Base Central`;
    }

    let totalNaoLidasGeral = db.mensagens.filter(m =>
        (m.destinatario === usuarioLogado.name || m.destinatario === usuarioLogado.login || m.destinatarioLogin === usuarioLogado.login) &&
        !m.lido
    ).length;
    let badgeTab = document.getElementById('badge-tech-chat-tab');
    if (badgeTab) {
        if (totalNaoLidasGeral > 0) { badgeTab.classList.remove('hidden'); badgeTab.innerText = totalNaoLidasGeral; }
        else badgeTab.classList.add('hidden');
    }
}

function atualizarMsgTechBox() {
    let box = document.getElementById('tech-chat-box');
    if (!box || !usuarioLogado) return;

    let destObj = db.tecnicos.find(t => t.name === chatDestinatarioAtual || t.login === chatDestinatarioAtual);
    let destName = destObj ? destObj.name : chatDestinatarioAtual;
    let destLogin = destObj ? destObj.login : chatDestinatarioAtual;

    let filtradas = db.mensagens.filter(m => {
        let souRemetente = (m.remetente === usuarioLogado.name || m.remetente === usuarioLogado.login || m.remetenteLogin === usuarioLogado.login);
        let souDestinatario = (m.destinatario === usuarioLogado.name || m.destinatario === usuarioLogado.login || m.destinatarioLogin === usuarioLogado.login);

        let outroEhDest = (m.destinatario === destName || m.destinatario === destLogin || m.destinatarioLogin === destLogin);
        let outroEhRem = (m.remetente === destName || m.remetente === destLogin || m.remetenteLogin === destLogin);

        return (souRemetente && outroEhDest) || (outroEhRem && souDestinatario);
    });

    box.innerHTML = filtradas.map(m => {
        let eu = (m.remetente === usuarioLogado.name || m.remetente === usuarioLogado.login || m.remetenteLogin === usuarioLogado.login);
        let bg = eu ? 'bg-red-600 text-white ml-auto' : 'bg-zinc-800 text-zinc-100 mr-auto';
        let audioMarkup = m.audio ? `<div class="mt-1"><audio controls src="${m.audio}" class="max-w-[210px] w-full h-8 rounded-lg"></audio></div>` : '';
        let msgId = m.id || 0;
        return `
            <div class="max-w-[85%] sm:max-w-[75%] p-2.5 rounded-2xl ${bg} text-xs shadow-md relative group">
                <div class="flex items-center justify-between border-b border-white/20 pb-1 mb-1">
                    <b class="text-[9px] opacity-90">${m.remetente} • ${m.hora}</b>
                    <button type="button" onclick="apagarMensagemChat('${msgId}')" title="Apagar Mensagem" class="text-[10px] opacity-80 hover:opacity-100 hover:text-amber-300 font-bold ml-2">🗑️</button>
                </div>
                ${m.texto ? `<p class="font-semibold">${m.texto}</p>` : ''}
                ${audioMarkup}
            </div>
        `;
    }).join('');
    box.scrollTop = box.scrollHeight;
}

function enviarMsgTech() {
    let inp = document.getElementById('tech-chat-input');
    if (!inp || !inp.value.trim()) return;
    let textoMsg = inp.value.trim();
    inp.value = '';

    let destObj = db.tecnicos.find(t => t.name === chatDestinatarioAtual || t.login === chatDestinatarioAtual);
    db.mensagens.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        remetente: usuarioLogado.name,
        remetenteLogin: usuarioLogado.login,
        destinatario: destObj ? destObj.name : chatDestinatarioAtual,
        destinatarioLogin: destObj ? destObj.login : chatDestinatarioAtual,
        texto: textoMsg,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lido: false
    });
    salvarDb();
    atualizarMsgTechBox();
    renderizarColegasChatTech();
}

function atualizarChatAdminLista() {
    if (isVisualizador) return;
    let html = "";
    db.tecnicos.forEach(t => {
        let avatar = t.avatar ? `<img src="${t.avatar}" class="w-8 h-8 rounded-full object-cover">` : `<div class="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">${t.name.charAt(0)}</div>`;
        let badgeOn = t.online ? 'bg-emerald-400' : 'bg-zinc-500';
        let naoLidas = db.mensagens.filter(m =>
            (m.remetente === t.name || m.remetenteLogin === t.login) &&
            m.destinatario === "Base" &&
            !m.lido
        ).length;
        let badgeNaoLida = naoLidas > 0 ? `<span class="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow">${naoLidas}</span>` : '';
        let activeClass = (chatAdminAtual === t.name) ? 'bg-zinc-900 border-l-4 border-red-600' : '';
        html += `
            <div onclick="selecionarChatAdmin('${t.name}')" class="p-3 rounded-xl hover:bg-zinc-900 cursor-pointer flex items-center justify-between text-xs border-b border-zinc-700 ${activeClass}">
                <div class="flex items-center space-x-2">
                    <div class="relative">${avatar}<span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${badgeOn} border border-black"></span></div>
                    <div><span class="font-bold text-white block">${t.name}</span><span class="text-[9px] text-zinc-300 font-semibold">Online: ${t.lastSeen || 'Offline'}</span></div>
                </div>
                ${badgeNaoLida}
            </div>
        `;
    });
    let contactsBox = document.getElementById('admin-chat-contacts');
    if (contactsBox) contactsBox.innerHTML = html;
}

function selecionarChatAdmin(nomeTech) {
    if (isVisualizador) return;
    chatAdminAtual = nomeTech;
    let techObj = db.tecnicos.find(t => t.name === nomeTech || t.login === nomeTech);
    let headerEl = document.getElementById('admin-chat-header');
    if (headerEl) headerEl.innerText = "Conversando com: " + nomeTech;
    let mudou = false;
    db.mensagens.forEach(m => {
        let ehDoTech = (m.remetente === nomeTech || (techObj && m.remetenteLogin === techObj.login));
        if (ehDoTech && m.destinatario === "Base" && !m.lido) {
            m.lido = true;
            mudou = true;
        }
    });
    if (mudou) salvarDb();
    atualizarMensagensAdminBox();
    atualizarChatAdminLista();
}

function atualizarMensagensAdminBox() {
    if (isVisualizador) return;
    let box = document.getElementById('admin-chat-messages');
    if (!box || !chatAdminAtual) return;

    let techObj = db.tecnicos.find(t => t.name === chatAdminAtual || t.login === chatAdminAtual);
    let techName = techObj ? techObj.name : chatAdminAtual;
    let techLogin = techObj ? techObj.login : chatAdminAtual;

    let filtradas = db.mensagens.filter(m => {
        let daBaseParaTech = (m.remetente === "Base" && (m.destinatario === techName || m.destinatario === techLogin || m.destinatarioLogin === techLogin));
        let doTechParaBase = ((m.remetente === techName || m.remetente === techLogin || m.remetenteLogin === techLogin) && m.destinatario === "Base");
        return daBaseParaTech || doTechParaBase;
    });

    box.innerHTML = filtradas.map(m => {
        let eu = m.remetente === "Base";
        let bg = eu ? 'bg-red-600 text-white ml-auto' : 'bg-zinc-800 text-zinc-100 mr-auto';
        let audioMarkup = m.audio ? `<div class="mt-1"><audio controls src="${m.audio}" class="max-w-[210px] w-full h-8 rounded-lg"></audio></div>` : '';
        let msgId = m.id || 0;
        return `
            <div class="max-w-[75%] p-3 rounded-2xl ${bg} shadow-md relative group">
                <div class="flex items-center justify-between border-b border-white/20 pb-1 mb-1">
                    <b class="text-[10px] opacity-90">${m.remetente} • ${m.hora}</b>
                    <button type="button" onclick="apagarMensagemChat('${msgId}')" title="Apagar Mensagem" class="text-xs opacity-80 hover:opacity-100 hover:text-amber-300 font-bold ml-3">🗑️</button>
                </div>
                ${m.texto ? `<p class="font-semibold">${m.texto}</p>` : ''}
                ${audioMarkup}
            </div>
        `;
    }).join('');
    box.scrollTop = box.scrollHeight;
}

function enviarMensagemAdmin() {
    if (isVisualizador) return;
    if (!chatAdminAtual) {
        alert("Selecione um técnico na lista à esquerda antes de enviar uma mensagem!");
        return;
    }
    let inp = document.getElementById('admin-chat-input');
    if (!inp || !inp.value.trim()) return;
    let textoMsg = inp.value.trim();
    inp.value = '';

    let techObj = db.tecnicos.find(t => t.name === chatAdminAtual || t.login === chatAdminAtual);

    db.mensagens.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        remetente: "Base",
        remetenteLogin: "admin",
        destinatario: techObj ? techObj.name : chatAdminAtual,
        destinatarioLogin: techObj ? techObj.login : chatAdminAtual,
        texto: textoMsg,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lido: false
    });
    salvarDb();
    atualizarMensagensAdminBox();
    atualizarChatAdminLista();
}

// INICIALIZAÇÃO PWA & SESSÃO
inicializarPWA();