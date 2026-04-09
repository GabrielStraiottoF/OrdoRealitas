// LISTA OFICIAL DE PERÍCIAS RPG ORDEM PARANORMAL
const TODAS_PERICIAS = [
    { id: 'acrobacia', nome: 'Acrobacia', attr: 'AGI' },
    { id: 'adestramento', nome: 'Adestramento', attr: 'PRE' },
    { id: 'artes', nome: 'Artes', attr: 'PRE' },
    { id: 'atletismo', nome: 'Atletismo', attr: 'FOR' },
    { id: 'atualidades', nome: 'Atualidades', attr: 'INT' },
    { id: 'ciencias', nome: 'Ciências', attr: 'INT' },
    { id: 'crime', nome: 'Crime', attr: 'AGI' },
    { id: 'diplomacia', nome: 'Diplomacia', attr: 'PRE' },
    { id: 'enganacao', nome: 'Enganação', attr: 'PRE' },
    { id: 'fortitude', nome: 'Fortitude', attr: 'VIG' },
    { id: 'furtividade', nome: 'Furtividade', attr: 'AGI' },
    { id: 'iniciativa', nome: 'Iniciativa', attr: 'AGI' },
    { id: 'intimidacao', nome: 'Intimidação', attr: 'PRE' },
    { id: 'intuicao', nome: 'Intuição', attr: 'PRE' },
    { id: 'investigacao', nome: 'Investigação', attr: 'INT' },
    { id: 'luta', nome: 'Luta', attr: 'FOR' },
    { id: 'medicina', nome: 'Medicina', attr: 'INT' },
    { id: 'ocultismo', nome: 'Ocultismo', attr: 'INT' },
    { id: 'percepcao', nome: 'Percepção', attr: 'PRE' },
    { id: 'pilotagem', nome: 'Pilotagem', attr: 'AGI' },
    { id: 'pontaria', nome: 'Pontaria', attr: 'AGI' },
    { id: 'profissao', nome: 'Profissão', attr: 'INT' },
    { id: 'reflexos', nome: 'Reflexos', attr: 'AGI' },
    { id: 'religiao', nome: 'Religião', attr: 'PRE' },
    { id: 'sobrevivencia', nome: 'Sobrevivência', attr: 'INT' },
    { id: 'tatica', nome: 'Tática', attr: 'INT' },
    { id: 'tecnologia', nome: 'Tecnologia', attr: 'INT' },
    { id: 'vontade', nome: 'Vontade', attr: 'PRE' },
];

document.addEventListener("DOMContentLoaded", () => {
    inicializarTrocaDeCores();
    gerarHTMLPericias();
    inicializarDashboard();
    configurarLogout();
    configurarCalculoAutomatico();
    initRituais();
    initInventarioPoderes();
    initCondicoesE_Defesas();
});

// Calculo automatico das fichas de Status
function configurarCalculoAutomatico() {
    const inputsGatilho = ['classe-display', 'nex', 'attr-vig', 'attr-pre'];
    
    inputsGatilho.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('change', () => { recalcularStatus(); recalcularDefesas(); });
            if (id === 'nex' || id === 'attr-vig' || id === 'attr-pre' || id === 'attr-agi') {
                 el.addEventListener('input', () => { recalcularStatus(); recalcularDefesas(); });
            }
        }
    });

    const btn = document.getElementById('btn-recalcular'); // If we have one, but we use event triggers mostly
}

function recalcularStatus() {
    const classe = document.getElementById('classe-display')?.value;
    const nex = parseInt(document.getElementById('nex')?.value) || 5;
    const vig = parseInt(document.getElementById('attr-vig')?.value) || 1;
    const pre = parseInt(document.getElementById('attr-pre')?.value) || 1;

    if (!classe) return;

    let nv = Math.max(1, Math.floor(nex / 5));
    let multiplicador = nv - 1;

    let maxPv = 0, maxPe = 0, maxSan = 0;

    if (classe === "combatante") {
        maxPv = (20 + vig) + (multiplicador * (4 + vig));
        maxPe = (2 + pre) + (multiplicador * (2 + pre));
        maxSan = 12 + (multiplicador * 3);
    } else if (classe === "especialista") {
        maxPv = (16 + vig) + (multiplicador * (3 + vig));
        maxPe = (3 + pre) + (multiplicador * (3 + pre));
        maxSan = 16 + (multiplicador * 4);
    } else if (classe === "ocultista") {
        maxPv = (12 + vig) + (multiplicador * (2 + vig));
        maxPe = (4 + pre) + (multiplicador * (4 + pre));
        maxSan = 20 + (multiplicador * 5);
    }

    if (maxPv > 0) document.getElementById('pv-total').value = maxPv;
    if (maxPe > 0) document.getElementById('pe-total').value = maxPe;
    if (maxSan > 0) document.getElementById('san-total').value = maxSan;

    const peLim = document.getElementById('pe-limite');
    if (peLim) peLim.textContent = nv;
}

// Toast / Alertas Bonitos
function mostrarNotificacao(mensagem, erro = false) {
    const toast = document.getElementById('toast-notificacao');
    if (!toast) return;
    toast.textContent = mensagem;
    if (erro) toast.classList.add('error');
    else toast.classList.remove('error');
    
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3500);
}

function inicializarTrocaDeCores() {
    const seletor = document.getElementById("classe") || document.getElementById("classe-display");
    if (seletor) {
        if (seletor.value) document.body.className = `${document.body.className.replace(/combatante|especialista|ocultista/g, '').trim()} ${seletor.value}`;
        seletor.addEventListener("change", () => {
             document.body.className = `${document.body.className.replace(/combatante|especialista|ocultista/g, '').trim()} ${seletor.value}`;
        });
    }
}

function gerarHTMLPericias() {
    const container = document.getElementById('lista-pericias');
    if (!container) return;

    let html = '';
    TODAS_PERICIAS.forEach(p => {
        html += `
        <div class="pericia-linha">
            <label>${p.nome} <span>(${p.attr})</span></label>
            <select class="treino-select" id="treino-${p.id}" data-id="${p.id}">
                <option value="0">Destreinado</option>
                <option value="5">Treinado (+5)</option>
                <option value="10">Veterano (+10)</option>
                <option value="15">Expert (+15)</option>
            </select>
            <input type="number" class="extra" id="extra-${p.id}" value="0" data-id="${p.id}">
            <input type="text" class="pericia-total" id="total-${p.id}" value="+0" readonly>
        </div>`;
    });
    container.innerHTML = html;

    // Adiciona lógicas de atualização de calculo total
    const updateCalculo = (id) => {
        const treino = parseInt(document.getElementById(`treino-${id}`).value) || 0;
        const extra = parseInt(document.getElementById(`extra-${id}`).value) || 0;
        const total = treino + extra;
        document.getElementById(`total-${id}`).value = total >= 0 ? `+${total}` : total;
        if(typeof recalcularDefesas === 'function') recalcularDefesas();
    };

    TODAS_PERICIAS.forEach(p => {
        document.getElementById(`treino-${p.id}`).addEventListener('change', () => updateCalculo(p.id));
        document.getElementById(`extra-${p.id}`).addEventListener('input', () => updateCalculo(p.id));
    });
}

// Lógica de Login
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
                localStorage.setItem('auth_token', res.token);
                window.location.href = "/dashboard";
            } else {
                alert(res.mensagem);
            }
        } catch (erro) {
            console.error("Erro no login:", erro);
        }
    });
}

// Lógica de Cadastro
const formCadastro = document.getElementById('formCadastro');
if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dados = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
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
            if (resposta.ok) {
                alert(res.mensagem);
                window.location.href = "/";
            } else {
                alert(res.mensagem);
            }
        } catch (erro) {
            console.error("Erro no cadastro:", erro);
        }
    });
}

// Preencher Dashboard com as informações Salvas
function inicializarDashboard() {
    if (!window.location.pathname.includes('dashboard')) return;

    const dadosSalvos = localStorage.getItem('agente');
    if (!dadosSalvos) {
        window.location.href = "/";
        return;
    }

    const agente = JSON.parse(dadosSalvos);
    const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val; };
    
    // Default Agent Name/Class
    setVal('nome-personagem', agente.nome || "");
    if (document.getElementById('classe-display')) {
        document.getElementById('classe-display').value = agente.classe;
        document.body.className = `${document.body.className.replace(/combatante|especialista|ocultista/g, '').trim()} ${agente.classe}`;
    }

    // Load from JSON
    if (agente.dados_salvos) {
        const d = agente.dados_salvos;
        
        // Identity
        setVal('nome-personagem', d.nome_personagem || agente.nome);
        setVal('nome-player', d.nome_player || "");
        setVal('origem', d.origem || "");
        setVal('trilha', d.trilha || "");
        setVal('classe-display', d.classe || agente.classe);
        setVal('nex', d.nex || 5);
        setVal('nivel-gastos', d.nivel_gastos || "baixo");

        // Attrs
        if(d.atributos) {
            setVal('attr-agi', d.atributos.agi || 1);
            setVal('attr-for', d.atributos.for || 1);
            setVal('attr-int', d.atributos.int || 1);
            setVal('attr-pre', d.atributos.pre || 1);
            setVal('attr-vig', d.atributos.vig || 1);
        }

        // Status
        if(d.status) {
            setVal('pv-atual', d.status.pv_atual || 10); setVal('pv-total', d.status.pv_total || 10);
            setVal('pe-atual', d.status.pe_atual || 5);  setVal('pe-total', d.status.pe_total || 5);
            setVal('san-atual', d.status.san_atual || 20); setVal('san-total', d.status.san_total || 20);
        }

        // Pericias
        if(d.pericias) {
            TODAS_PERICIAS.forEach(p => {
                if (d.pericias[p.id]) {
                    setVal(`treino-${p.id}`, d.pericias[p.id].treino || 0);
                    setVal(`extra-${p.id}`, d.pericias[p.id].extra || 0);
                    // trigger event to compute total
                    document.getElementById(`treino-${p.id}`).dispatchEvent(new Event('change'));
                }
            });
        }

        // Inventario Dinamico
        if(d.armas) {
            document.getElementById('container-armas').innerHTML = "";
            d.armas.forEach(a => criarLinhaArma(a));
        }
        if(d.itens) {
            document.getElementById('container-itens').innerHTML = "";
            d.itens.forEach(i => criarLinhaItem(i));
        }
        if(d.itens_diversos) setVal('itens-diversos', d.itens_diversos);

        // Defesas e Resistencias
        if(d.defesas) {
            setVal('res-fisica', d.defesas.res_fisica || "");
            setVal('res-balistica', d.defesas.res_balistica || "");
            setVal('res-sangue', d.defesas.res_sangue || "");
            setVal('res-morte', d.defesas.res_morte || "");
            setVal('res-energia', d.defesas.res_energia || "");
            setVal('res-conhecimento', d.defesas.res_conhecimento || "");
            setVal('def-equip', d.defesas.def_equip || "0");
            setVal('rd-geral', d.defesas.rd_geral || "0");
        }
        
        if(d.deslocamento) setVal('deslocamento', d.deslocamento);

        // Condicoes
        if(d.condicoes) {
            d.condicoes.forEach(c => {
                let btn = Array.from(document.querySelectorAll('.btn-condicao')).find(b => b.textContent === c.nome);
                if(btn) btn.setAttribute('data-active', c.ativo);
            });
        }

        // Poderes
        if(d.poderes) {
            document.getElementById('container-poderes').innerHTML = "";
            d.poderes.forEach(p => criarCardPoder(p));
        }
        
        recalcularPeso();
        recalcularDefesas();

        // Rituais
        if(d.rituais) {
            const container = document.getElementById('container-rituais');
            if (container) {
                container.innerHTML = "";
                d.rituais.forEach(r => criarCardRitual(r));
            }
        }
        
        atualizarEstadosSaude();
        mostrarNotificacao("Ficha Carregada!");
    }
}

// Salvar Ficha Completa
async function enviarDadosParaServidor() {
    const agenteLogado = JSON.parse(localStorage.getItem('agente'));
    if (!agenteLogado) {
        mostrarNotificacao("Sessão expirada. Faça login novamente.", true);
        return;
    }

    const val = (id) => document.getElementById(id)?.value || "";
    
    // Coleta Pericias
    let periciasSalvas = {};
    TODAS_PERICIAS.forEach(p => {
        periciasSalvas[p.id] = {
            treino: document.getElementById(`treino-${p.id}`).value,
            extra: document.getElementById(`extra-${p.id}`).value
        };
    });

    const fichaCompleta = {
        email_dono: agenteLogado.email,
        nome_personagem: val('nome-personagem'),
        nome_player: val('nome-player'),
        origem: val('origem'),
        trilha: val('trilha'),
        nivel_gastos: val('nivel-gastos'),
        classe: val('classe-display'),
        nex: val('nex'),
        atributos: {
            agi: val('attr-agi'), for: val('attr-for'), int: val('attr-int'), pre: val('attr-pre'), vig: val('attr-vig')
        },
        defesas: {
            passiva: val('def-passiva'),
            esquiva: val('def-esquiva'),
            bloqueio: val('def-bloqueio'),
            res_fisica: val('res-fisica'),
            res_balistica: val('res-balistica'),
            res_sangue: val('res-sangue'),
            res_morte: val('res-morte'),
            res_energia: val('res-energia'),
            res_conhecimento: val('res-conhecimento'),
            def_equip: val('def-equip'),
            rd_geral: val('rd-geral')
        },
        deslocamento: val('deslocamento'),
        condicoes: Array.from(document.querySelectorAll('.btn-condicao')).map(btn => ({
            nome: btn.textContent,
            ativo: btn.getAttribute('data-active') === 'true'
        })),
        status: {
            pv_atual: val('pv-atual'), pv_total: val('pv-total'),
            pe_atual: val('pe-atual'), pe_total: val('pe-total'),
            san_atual: val('san-atual'), san_total: val('san-total')
        },
        pericias: periciasSalvas,
        armas: Array.from(document.querySelectorAll('#container-armas .arma-linha')).map(el => ({
            nome: el.querySelector('.nome').value,
            teste: el.querySelector('.teste').value,
            dano: el.querySelector('.dano').value,
            critico: el.querySelector('.critico').value,
            peso: el.querySelector('.inp-peso-arma').value
        })),
        itens: Array.from(document.querySelectorAll('#container-itens .item-linha')).map(el => ({
            nome: el.querySelector('.nome').value,
            categoria: el.querySelector('.categoria').value,
            peso: el.querySelector('.inp-peso').value
        })),
        itens_diversos: val('itens-diversos'),
        poderes: Array.from(document.querySelectorAll('#container-poderes .poder-card')).map(card => ({
            nome: card.querySelector('.titulo').value,
            custo: card.querySelector('.custo').value,
            desc: card.querySelector('.desc').value
        })),
        rituais: Array.from(document.querySelectorAll('#container-rituais .ritual-card')).map(card => ({
            nome: card.querySelector('.titulo-ritual').value,
            elemento: card.querySelector('.sel-elemento').value,
            circulo: card.querySelector('.sel-circulo').value,
            execucao: card.querySelector('.inp-exec').value,
            alcance: card.querySelector('.inp-alcance').value,
            alvo: card.querySelector('.inp-alvo').value,
            duracao: card.querySelector('.inp-duracao').value,
            custo_pe: card.querySelector('.inp-custo-pe').value,
            desc: card.querySelector('.ritual-desc').value
        }))
    };

    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            mostrarNotificacao("Sessão inválida. Por favor, faça login novamente.", true);
            return;
        }

        const btn = document.getElementById('btn-salvar-ficha');
        btn.textContent = "SALVANDO...";
        
        const resposta = await fetch('/salvar_ficha', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(fichaCompleta)
        });

        const res = await resposta.json();
        btn.textContent = "SALVAR FICHA";
        
        if (resposta.ok) {
            agenteLogado.dados_salvos = fichaCompleta;
            agenteLogado.nome = val('nome-personagem');
            agenteLogado.classe = val('classe-display');
            localStorage.setItem('agente', JSON.stringify(agenteLogado));
            mostrarNotificacao("Ficha atualizada com sucesso!");
        } else {
            mostrarNotificacao(res.mensagem || "Erro ao salvar", true);
        }
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
        mostrarNotificacao("Erro de conexão.", true);
    }
}

document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'btn-salvar-ficha') {
        enviarDadosParaServidor();
    }
});

function configurarLogout() {
    const btnSair = document.getElementById('btn-logout');
    if (btnSair) {
        btnSair.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('agente');
            localStorage.removeItem('auth_token');
            window.location.href = "/";
        });
    }
}

// Trocar abas
window.abrirAba = function(evt, nomeAba) {
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

// Rituais UI Builder
function initRituais() {
    const btnAdd = document.getElementById('btn-add-ritual');
    if (btnAdd) btnAdd.addEventListener('click', () => criarCardRitual());
}

function criarCardRitual(dados = {}) {
    const container = document.getElementById('container-rituais');
    if(!container) return;

    const div = document.createElement('div');
    div.className = 'ritual-card';
    div.dataset.elemento = dados.elemento || '';
    
    div.innerHTML = `
        <input type="text" class="titulo-ritual" placeholder="Nome do Ritual" value="${dados.nome || ''}">
        <button type="button" class="btn-remover-ritual" onclick="this.parentElement.remove()">×</button>
        <div class="ritual-header">
            <select class="sel-elemento" onchange="this.parentElement.parentElement.dataset.elemento = this.value">
                <option value="" disabled ${!dados.elemento ? 'selected' : ''}>Elemento</option>
                <option value="sangue" ${dados.elemento === 'sangue' ? 'selected' : ''}>Sangue</option>
                <option value="morte" ${dados.elemento === 'morte' ? 'selected' : ''}>Morte</option>
                <option value="conhecimento" ${dados.elemento === 'conhecimento' ? 'selected' : ''}>Conhecimento</option>
                <option value="energia" ${dados.elemento === 'energia' ? 'selected' : ''}>Energia</option>
                <option value="medo" ${dados.elemento === 'medo' ? 'selected' : ''}>Medo</option>
            </select>
            <select class="sel-circulo">
                <option value="1" ${dados.circulo === '1' ? 'selected' : ''}>1º Círculo</option>
                <option value="2" ${dados.circulo === '2' ? 'selected' : ''}>2º Círculo</option>
                <option value="3" ${dados.circulo === '3' ? 'selected' : ''}>3º Círculo</option>
                <option value="4" ${dados.circulo === '4' ? 'selected' : ''}>4º Círculo</option>
            </select>
            <input type="text" class="inp-custo-pe" placeholder="Custo PE" value="${dados.custo_pe || ''}">
        </div>
        <div class="ritual-body">
            <input type="text" class="inp-exec" placeholder="Execução" value="${dados.execucao || ''}">
            <input type="text" class="inp-alcance" placeholder="Alcance" value="${dados.alcance || ''}">
            <input type="text" class="inp-alvo" placeholder="Alvo/Área" value="${dados.alvo || ''}">
            <input type="text" class="inp-duracao" placeholder="Duração" value="${dados.duracao || ''}">
        </div>
        <textarea class="ritual-desc" rows="3" placeholder="Descrição / Dano...">${dados.desc || ''}</textarea>
    `;
    container.appendChild(div);
}

// INVENTARIO E PODERES UI BUILDERS
function initInventarioPoderes() {
    const btnAddArma = document.getElementById('btn-add-arma');
    if(btnAddArma) btnAddArma.addEventListener('click', () => criarLinhaArma());

    const btnAddItem = document.getElementById('btn-add-item');
    if(btnAddItem) btnAddItem.addEventListener('click', () => criarLinhaItem());

    const btnAddPoder = document.getElementById('btn-add-poder');
    if(btnAddPoder) btnAddPoder.addEventListener('click', () => criarCardPoder());

    document.getElementById('attr-for')?.addEventListener('input', recalcularPeso);
    document.getElementById('attr-for')?.addEventListener('change', recalcularPeso);
}

function recalcularPeso() {
    let forca = parseInt(document.getElementById('attr-for')?.value) || 0;
    // Pela regra de Ordem Paranormal: Inicialmente 5 espaços. +5 por ponto de FOR.
    let maxPeso = 5 + (forca * 5);
    if (forca < 0) maxPeso = 2; // Penalidade extrema

    const pesoMaxEl = document.getElementById('peso-max');
    if(pesoMaxEl) pesoMaxEl.textContent = maxPeso;

    let pesoAtual = 0;
    document.querySelectorAll('.inp-peso').forEach(inp => {
        pesoAtual += parseFloat(inp.value) || 0;
    });
    document.querySelectorAll('.inp-peso-arma').forEach(inp => {
        pesoAtual += parseFloat(inp.value) || 0;
    });

    const pesoAtualEl = document.getElementById('peso-atual');
    if(pesoAtualEl) {
        pesoAtualEl.textContent = pesoAtual;
        if(pesoAtual > maxPeso) {
            pesoAtualEl.style.color = '#ff1a1a'; 
            pesoAtualEl.style.textShadow = '0 0 10px #ff1a1a';
        } else {
            pesoAtualEl.style.color = 'white';
            pesoAtualEl.style.textShadow = 'none';
        }
    }
}

function criarLinhaArma(dados = {}) {
    const container = document.getElementById('container-armas');
    if(!container) return;
    const div = document.createElement('div');
    div.className = 'arma-linha';
    div.innerHTML = `
        <input type="text" class="nome" placeholder="Nome da Arma" value="${dados.nome || ''}">
        <input type="text" class="teste" placeholder="Teste (Ex: 2d20+5)" value="${dados.teste || ''}">
        <input type="text" class="dano" placeholder="Dano" value="${dados.dano || ''}">
        <input type="text" class="critico" placeholder="Crítico/Alcance" value="${dados.critico || ''}">
        <input type="number" class="inp-peso-arma" placeholder="Peso" value="${dados.peso || 1}" oninput="recalcularPeso()" style="text-align: center;">
        <button type="button" class="btn-remover" onclick="this.parentElement.remove(); recalcularPeso();">X</button>
    `;
    container.appendChild(div);
    recalcularPeso();
}

function criarLinhaItem(dados = {}) {
    const container = document.getElementById('container-itens');
    if(!container) return;
    const div = document.createElement('div');
    div.className = 'item-linha';
    div.innerHTML = `
        <input type="text" class="nome" placeholder="Aparelho ou Recurso" value="${dados.nome || ''}">
        <select class="categoria">
            <option value="0" ${dados.categoria === '0' ? 'selected' : ''}>0</option>
            <option value="I" ${dados.categoria === 'I' ? 'selected' : ''}>I</option>
            <option value="II" ${dados.categoria === 'II' ? 'selected' : ''}>II</option>
            <option value="III" ${dados.categoria === 'III' ? 'selected' : ''}>III</option>
            <option value="IV" ${dados.categoria === 'IV' ? 'selected' : ''}>IV</option>
        </select>
        <input type="number" class="inp-peso" value="${dados.peso || 1}" oninput="recalcularPeso()">
        <button type="button" class="btn-remover" onclick="this.parentElement.remove(); recalcularPeso();">X</button>
    `;
    container.appendChild(div);
    recalcularPeso();
}

function criarCardPoder(dados = {}) {
    const container = document.getElementById('container-poderes');
    if(!container) return;
    const div = document.createElement('div');
    div.className = 'poder-card';
    div.innerHTML = `
        <input type="text" class="titulo" placeholder="Nome da Habilidade" value="${dados.nome || ''}">
        <button type="button" class="btn-remover btn-remover-abs" onclick="this.parentElement.remove()">X</button>
        <input type="text" class="custo" placeholder="Custo (Ex: 2 PE)" value="${dados.custo || ''}">
        <textarea class="desc" placeholder="Descrição completa...">${dados.desc || ''}</textarea>
    `;
    container.appendChild(div);
}

// DEFESAS E CONDICOES
function initCondicoesE_Defesas() {
    document.querySelectorAll('.btn-condicao').forEach(btn => {
        btn.addEventListener('click', function() {
            let ativo = this.getAttribute('data-active') === 'true';
            this.setAttribute('data-active', !ativo);
        });
    });

    document.querySelectorAll('.pericia-extra').forEach(inp => {
        inp.addEventListener('input', recalcularDefesas);
    });
}

function getBonusCalculado(nomePericia) {
    let id = nomePericia.toLowerCase();
    const treino = parseInt(document.getElementById(`treino-${id}`)?.value) || 0;
    const extra = parseInt(document.getElementById(`extra-${id}`)?.value) || 0;
    return treino + extra;
}

function recalcularDefesas() {
    let agi = parseInt(document.getElementById('attr-agi')?.value) || 1;
    let equip = parseInt(document.getElementById('def-equip')?.value) || 0;
    
    let passiva = 10 + Math.max(0, agi) + equip;
    
    const passivaEl = document.getElementById('def-passiva');
    if(passivaEl) passivaEl.value = passiva;
    
    let reflexos = getBonusCalculado('reflexos');
    const esquivaEl = document.getElementById('def-esquiva');
    if(esquivaEl) esquivaEl.value = passiva + reflexos;
    
    let luta = getBonusCalculado('luta');
    let fortitude = getBonusCalculado('fortitude');
    const bloqueioEl = document.getElementById('def-bloqueio');
    if(bloqueioEl) bloqueioEl.value = passiva + Math.max(luta, fortitude);
}

function atualizarEstadosSaude() {
    const atual = parseInt(document.getElementById('pv-atual').value) || 0;
    const total = parseInt(document.getElementById('pv-total').value) || 0;
    const label = document.getElementById('pv-status-label');
    if(!label) return;

    if (atual <= 0) {
        label.textContent = "MORRENDO";
        label.style.color = "#ff0000";
        label.style.textShadow = "0 0 10px red";
    } else if (atual < total / 2) {
        label.textContent = "MACHUCADO";
        label.style.color = "#ffaa00";
        label.style.textShadow = "0 0 5px orange";
    } else {
        label.textContent = "ESTÁVEL";
        label.style.color = "#888";
        label.style.textShadow = "none";
    }

    // SANIDADE
    const sanAtual = parseInt(document.getElementById('san-atual').value);
    const sanTotal = parseInt(document.getElementById('san-total').value);
    if (sanAtual <= 0) {
        mostrarNotificacao("Você está ENLOUQUECENDO! O mestre assume o controle.", true);
    }
}

// ====== ROLAGEM DE DADOS (ABA DADOS) ======
function mostrarResultadoDadoHTML(total, rolagensStr, isCritSuccess = false, isCritFail = false) {
    const area = document.getElementById('tab-dice-result-area');
    if(!area) return;

    let totalEl = document.createElement('div');
    totalEl.className = 'dice-final-huge';
    totalEl.textContent = total;

    if (isCritSuccess) totalEl.classList.add('crit-success');
    if (isCritFail) totalEl.classList.add('crit-fail');

    let histEl = document.createElement('div');
    histEl.className = 'dice-line-history';
    histEl.textContent = rolagensStr;

    area.innerHTML = '';
    area.appendChild(totalEl);
    area.appendChild(histEl);
}

function rolarTesteOrdemTab() {
    let qtd = parseInt(document.getElementById('tab-dice-qtd')?.value) || 0;
    let bonus = parseInt(document.getElementById('tab-dice-bonus')?.value) || 0;
    
    let rolagens = [];
    let isDesvantagem = false;

    let dadosARolar = qtd > 0 ? qtd : 2;
    if (qtd <= 0) isDesvantagem = true;

    for(let i=0; i<dadosARolar; i++) {
        rolagens.push(Math.floor(Math.random() * 20) + 1);
    }

    let dadoEscolhido = isDesvantagem ? Math.min(...rolagens) : Math.max(...rolagens);
    let total = dadoEscolhido + bonus;

    let str = `[ ${rolagens.join(' , ')} ] d20  +  Bônus(${bonus})`;
    mostrarResultadoDadoHTML(total, str, (dadoEscolhido === 20 && !isDesvantagem), (dadoEscolhido === 1));
}

function rolarDadoGenericoTab() {
    let qtd = parseInt(document.getElementById('gen-dice-qtd')?.value) || 1;
    let faces = parseInt(document.getElementById('gen-dice-faces')?.value) || 6;
    let bonus = parseInt(document.getElementById('gen-dice-bonus')?.value) || 0;
    if(qtd < 1) qtd = 1;
    
    let rolagens = [];
    let soma = 0;
    for(let i=0; i<qtd; i++) {
        let r = Math.floor(Math.random() * faces) + 1;
        rolagens.push(r);
        soma += r;
    }
    
    let total = soma + bonus;
    let str = `[ ${rolagens.join(' + ')} ] d${faces}  +  Bônus(${bonus})`;
    
    mostrarResultadoDadoHTML(total, str, false, false);
}