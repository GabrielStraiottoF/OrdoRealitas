// --- INICIALIZAÇÃO GERAL ---
document.addEventListener("DOMContentLoaded", () => {
    inicializarTrocaDeCores();
    inicializarDashboard();
    configurarLogout();
    configurarMudancaDeClasse();
    inicializarPericias(); // Ativa a lógica de bônus automático
});

// --- CORES DO LOGIN/CADASTRO ---
function inicializarTrocaDeCores() {
    const seletor = document.getElementById("classe");
    if (seletor) {
        if (seletor.value) document.body.className = seletor.value;
        
        seletor.addEventListener("change", () => {
            document.body.className = seletor.value;
        });
    }
}

// --- FORMULÁRIO DE LOGIN ---
const formLogin = document.getElementById('formLogin');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dados = { email: formLogin.email.value, senha: formLogin.senha.value };
        try {
            const resposta = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const res = await resposta.json();
            if (resposta.ok) {
                localStorage.setItem('agente', JSON.stringify(res.agente));
                window.location.href = "/dashboard";
            } else {
                alert(res.mensagem);
            }
        } catch (erro) {
            console.error("Erro no login:", erro);
        }
    });
}

// --- FORMULÁRIO DE CADASTRO ---
const formCadastro = document.getElementById('formCadastro');
if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dados = {
            nome: document.getElementById('nome').value,
            gmail: document.getElementById('email').value,
            senha: document.getElementById('senha').value,
            classe: document.getElementById('classe').value
        };
        try {
            const resposta = await fetch('/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const res = await resposta.json();
            alert(res.mensagem);
            if (resposta.ok) window.location.href = "/";
        } catch (erro) {
            console.error("Erro no cadastro:", erro);
        }
    });
}

// --- LÓGICA DO ESQUECI A SENHA (MODAL) ---
document.addEventListener('click', (e) => {
    if (e.target.id === 'link-esqueci') {
        e.preventDefault();
        const modal = document.getElementById('modal-foto');
        if (modal) modal.style.display = 'block';
    }
    if (e.target.id === 'btn-fechar-modal') {
        const modal = document.getElementById('modal-foto');
        if (modal) modal.style.display = 'none';
    }
});

// --- LÓGICA DO DASHBOARD (CARREGAR DADOS) ---
function inicializarDashboard() {
    if (window.location.pathname.includes('dashboard')) {
        const dadosSalvos = localStorage.getItem('agente');
        if (!dadosSalvos) {
            window.location.href = "/";
            return;
        }

        const agente = JSON.parse(dadosSalvos);
        
        // 1. Preenche identidade básica
        if (document.getElementById('nome-personagem')) document.getElementById('nome-personagem').value = agente.nome || "";
        if (document.getElementById('classe-display')) {
            document.getElementById('classe-display').value = agente.classe;
            document.body.className = agente.classe;
        }

        // 2. Preenche dados extras salvos
        if (agente.dados_salvos) {
            const d = agente.dados_salvos;
            if(d.nome_player && document.getElementById('nome-player')) document.getElementById('nome-player').value = d.nome_player;
            if(d.origem && document.getElementById('origem')) document.getElementById('origem').value = d.origem;
            if(d.nex && document.getElementById('nex')) document.getElementById('nex').value = d.nex;

            // Atributos
            if(d.atributos) {
                document.getElementById('attr-agi').value = d.atributos.agi || 0;
                document.getElementById('attr-for').value = d.atributos.for || 0;
                document.getElementById('attr-int').value = d.atributos.int || 0;
                document.getElementById('attr-pre').value = d.atributos.pre || 0;
                document.getElementById('attr-vig').value = d.atributos.vig || 0;
            }

            // Status Vitais
            if(d.status) {
                if(document.getElementById('pv-atual')) document.getElementById('pv-atual').value = d.status.pv_atual || 0;
                if(document.getElementById('pv-total')) document.getElementById('pv-total').value = d.status.pv_total || 0;
                if(document.getElementById('pe-atual')) document.getElementById('pe-atual').value = d.status.pe_atual || 0;
                if(document.getElementById('pe-total')) document.getElementById('pe-total').value = d.status.pe_total || 0;
                if(document.getElementById('san-atual')) document.getElementById('san-atual').value = d.status.san_atual || 0;
                if(document.getElementById('san-total')) document.getElementById('san-total').value = d.status.san_total || 0;
            }
        }
    }
}

// --- MUDANÇA DE CLASSE NO DASHBOARD ---
function configurarMudancaDeClasse() {
    const seletorClasse = document.getElementById('classe-display');
    if (seletorClasse) {
        seletorClasse.addEventListener('change', function() {
            document.body.className = this.value;
        });
    }
}

// --- PERÍCIAS ---
function inicializarPericias() {
    const seletores = document.querySelectorAll('.treino-select');
    seletores.forEach(select => {
        select.addEventListener('change', (e) => {
            const pericia = e.target.getAttribute('data-pericia');
            const valor = e.target.value;
            const inputBonus = document.getElementById(`bonus-${pericia}`);
            if (inputBonus) {
                inputBonus.value = valor;
            }
        });
    });
}

// --- FUNÇÃO PARA SALVAR A FICHA ---
async function enviarDadosParaServidor() {
    const agenteLogado = JSON.parse(localStorage.getItem('agente'));
    if (!agenteLogado) {
        alert("Sessão expirada!");
        return;
    }

    const fichaCompleta = {
        email_dono: agenteLogado.email || agenteLogado.gmail,
        nome_personagem: document.getElementById('nome-personagem').value,
        nome_player: document.getElementById('nome-player').value,
        origem: document.getElementById('origem').value,
        classe: document.getElementById('classe-display').value,
        nex: document.getElementById('nex').value,
        atributos: {
            agi: document.getElementById('attr-agi').value,
            for: document.getElementById('attr-for').value,
            int: document.getElementById('attr-int').value,
            pre: document.getElementById('attr-pre').value,
            vig: document.getElementById('attr-vig').value
        },
        status: {
            pv_atual: document.getElementById('pv-atual')?.value || 0,
            pv_total: document.getElementById('pv-total')?.value || 0,
            pe_atual: document.getElementById('pe-atual')?.value || 0,
            pe_total: document.getElementById('pe-total')?.value || 0,
            san_atual: document.getElementById('san-atual')?.value || 0,
            san_total: document.getElementById('san-total')?.value || 0
        }
    };

    try {
        const resposta = await fetch('/salvar_ficha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fichaCompleta)
        });

        const res = await resposta.json();
        if (resposta.ok) {
            agenteLogado.dados_salvos = fichaCompleta;
            localStorage.setItem('agente', JSON.stringify(agenteLogado));
            alert("Ficha salva com sucesso!");
        } else {
            alert("Erro ao salvar: " + res.mensagem);
        }
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
    }
}

// Evento do botão de salvar
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'btn-salvar-ficha') {
        enviarDadosParaServidor();
    }
});

// --- FUNCIONALIDADE DE LOGOUT ---
function configurarLogout() {
    const btnSair = document.getElementById('btn-logout');
    if (btnSair) {
        btnSair.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('agente');
            window.location.href = "/";
        });
    }
}

// --- TROCA DE ABAS ---
function abrirAba(evt, nomeAba) {
    const conteudos = document.getElementsByClassName("tab-content");
    for (let i = 0; i < conteudos.length; i++) {
        conteudos[i].classList.remove("active");
        conteudos[i].style.display = "none";
    }

    const botoes = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < botoes.length; i++) {
        botoes[i].classList.remove("active");
    }

    const abaAlvo = document.getElementById(nomeAba);
    if (abaAlvo) {
        abaAlvo.classList.add("active");
        abaAlvo.style.display = "block";
    }
    evt.currentTarget.classList.add("active");
}