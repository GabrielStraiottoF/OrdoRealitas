const TODAS_PERICIAS = [
    ['acrobacia','Acrobacia','AGI'],['adestramento','Adestramento','PRE'],['artes','Artes','PRE'],['atletismo','Atletismo','FOR'],['atualidades','Atualidades','INT'],['ciencias','Ciências','INT'],['crime','Crime','AGI'],['diplomacia','Diplomacia','PRE'],['enganacao','Enganação','PRE'],['fortitude','Fortitude','VIG'],['furtividade','Furtividade','AGI'],['iniciativa','Iniciativa','AGI'],['intimidacao','Intimidação','PRE'],['intuicao','Intuição','PRE'],['investigacao','Investigação','INT'],['luta','Luta','FOR'],['medicina','Medicina','INT'],['ocultismo','Ocultismo','INT'],['percepcao','Percepção','PRE'],['pilotagem','Pilotagem','AGI'],['pontaria','Pontaria','AGI'],['profissao','Profissão','INT'],['reflexos','Reflexos','AGI'],['religiao','Religião','PRE'],['sobrevivencia','Sobrevivência','INT'],['tatica','Tática','INT'],['tecnologia','Tecnologia','INT'],['vontade','Vontade','PRE']
].map(([id,nome,attr]) => ({id,nome,attr}));

function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function el(id) { return document.getElementById(id); }
function val(id, fallback='') { return el(id)?.value ?? fallback; }
function setVal(id, value) { const node=el(id); if(node && value !== undefined && value !== null) node.value=value; }
function mostrarNotificacao(mensagem, erro=false) {
    const toast=el('toast-notificacao'); if(!toast) return;
    toast.textContent=mensagem; toast.classList.toggle('error', !!erro); toast.classList.add('show');
    clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>toast.classList.remove('show'),3500);
}

function aplicarClasse(classe) {
    document.body.className=document.body.className.replace(/\b(combatante|especialista|ocultista)\b/g,'').trim();
    if(classe) document.body.classList.add(classe);
}
function inicializarTrocaDeCores() {
    const seletor=el('classe') || el('classe-display'); if(!seletor) return;
    aplicarClasse(seletor.value); seletor.addEventListener('change',()=>aplicarClasse(seletor.value));
}

function recalcularStatus() {
    const classe=val('classe-display'); const nex=Math.max(5,parseInt(val('nex',5),10)||5);
    const vig=parseInt(val('attr-vig',1),10)||1; const pre=parseInt(val('attr-pre',1),10)||1;
    const nivel=Math.max(1,Math.floor(nex/5)); const mult=nivel-1;
    let pv=0,pe=0,san=0;
    if(classe==='combatante'){pv=20+vig+mult*(4+vig);pe=2+pre+mult*(2+pre);san=12+mult*3;}
    else if(classe==='especialista'){pv=16+vig+mult*(3+vig);pe=3+pre+mult*(3+pre);san=16+mult*4;}
    else if(classe==='ocultista'){pv=12+vig+mult*(2+vig);pe=4+pre+mult*(4+pre);san=20+mult*5;}
    if(pv){setVal('pv-total',pv);setVal('pe-total',pe);setVal('san-total',san);}
    if(el('pe-limite')) el('pe-limite').textContent=nivel;
}

function configurarCalculoAutomatico() {
    ['classe-display','nex','attr-agi','attr-vig','attr-pre'].forEach(id=>{
        const node=el(id); if(!node) return;
        ['change','input'].forEach(evt=>node.addEventListener(evt,()=>{recalcularStatus();recalcularDefesas();recalcularPeso();}));
    });
}

function gerarHTMLPericias() {
    const container=el('lista-pericias'); if(!container) return;
    container.innerHTML=TODAS_PERICIAS.map(p=>`<div class="pericia-linha">
        <label>${escaparHTML(p.nome)} <span>(${escaparHTML(p.attr)})</span></label>
        <select class="treino-select" id="treino-${p.id}" data-id="${p.id}"><option value="0">Destreinado</option><option value="5">Treinado (+5)</option><option value="10">Veterano (+10)</option><option value="15">Expert (+15)</option></select>
        <input type="number" class="extra" id="extra-${p.id}" value="0" data-id="${p.id}">
        <input type="text" class="pericia-total" id="total-${p.id}" value="+0" readonly>
    </div>`).join('');
    TODAS_PERICIAS.forEach(p=>{
        const update=()=>{const total=(parseInt(val(`treino-${p.id}`,0),10)||0)+(parseInt(val(`extra-${p.id}`,0),10)||0);setVal(`total-${p.id}`,total>=0?`+${total}`:String(total));recalcularDefesas();};
        el(`treino-${p.id}`)?.addEventListener('change',update); el(`extra-${p.id}`)?.addEventListener('input',update);
    });
}
function getBonusCalculado(nome) { const id=nome.toLowerCase(); return (parseInt(val(`treino-${id}`,0),10)||0)+(parseInt(val(`extra-${id}`,0),10)||0); }
function recalcularDefesas() {
    const agi=parseInt(val('attr-agi',1),10)||1, equip=parseInt(val('def-equip',0),10)||0;
    const passiva=10+Math.max(0,agi)+equip; setVal('def-passiva',passiva);
    setVal('def-esquiva',passiva+getBonusCalculado('reflexos'));
    setVal('def-bloqueio',passiva+Math.max(getBonusCalculado('luta'),getBonusCalculado('fortitude')));
}

function recalcularPeso() {
    const forca=parseInt(val('attr-for',0),10)||0; const max=Math.max(2,5+forca*5); if(el('peso-max'))el('peso-max').textContent=max;
    let atual=0; document.querySelectorAll('.inp-peso,.inp-peso-arma').forEach(n=>atual+=parseFloat(n.value)||0);
    const node=el('peso-atual'); if(node){node.textContent=atual;node.style.color=atual>max?'#ff1a1a':'white';node.style.textShadow=atual>max?'0 0 10px #ff1a1a':'none';}
}
function criarLinhaArma(d={}) {
    const c=el('container-armas');if(!c)return;const n=document.createElement('div');n.className='arma-linha';
    n.innerHTML=`<input type="text" class="nome" placeholder="Nome da Arma" value="${escaparHTML(d.nome)}"><input type="text" class="teste" placeholder="Teste (Ex: 2d20+5)" value="${escaparHTML(d.teste)}"><input type="text" class="dano" placeholder="Dano" value="${escaparHTML(d.dano)}"><input type="text" class="critico" placeholder="Crítico/Alcance" value="${escaparHTML(d.critico)}"><input type="number" class="inp-peso-arma" placeholder="Peso" value="${escaparHTML(d.peso ?? 1)}"><button type="button" class="btn-remover">X</button>`;
    n.querySelector('.inp-peso-arma').addEventListener('input',recalcularPeso);n.querySelector('.btn-remover').addEventListener('click',()=>{n.remove();recalcularPeso();});c.appendChild(n);recalcularPeso();
}
function criarLinhaItem(d={}) {
    const c=el('container-itens');if(!c)return;const n=document.createElement('div');n.className='item-linha';
    n.innerHTML=`<input type="text" class="nome" placeholder="Aparelho ou Recurso" value="${escaparHTML(d.nome)}"><select class="categoria"><option value="0">0</option><option value="I">I</option><option value="II">II</option><option value="III">III</option><option value="IV">IV</option></select><input type="number" class="inp-peso" value="${escaparHTML(d.peso ?? 1)}"><button type="button" class="btn-remover">X</button>`;
    const s=n.querySelector('.categoria');if(d.categoria)s.value=d.categoria;n.querySelector('.inp-peso').addEventListener('input',recalcularPeso);n.querySelector('.btn-remover').addEventListener('click',()=>{n.remove();recalcularPeso();});c.appendChild(n);recalcularPeso();
}
function criarCardPoder(d={}) {
    const c=el('container-poderes');if(!c)return;const n=document.createElement('div');n.className='poder-card';
    n.innerHTML=`<input type="text" class="titulo" placeholder="Nome da Habilidade" value="${escaparHTML(d.nome)}"><button type="button" class="btn-remover btn-remover-abs">X</button><input type="text" class="custo" placeholder="Custo (Ex: 2 PE)" value="${escaparHTML(d.custo)}"><textarea class="desc" placeholder="Descrição completa...">${escaparHTML(d.desc)}</textarea>`;
    n.querySelector('.btn-remover').addEventListener('click',()=>n.remove());c.appendChild(n);
}
function criarCardRitual(d={}) {
    const c=el('container-rituais');if(!c)return;const n=document.createElement('div');n.className='ritual-card';n.dataset.elemento=d.elemento||'';
    n.innerHTML=`<input type="text" class="titulo-ritual" placeholder="Nome do Ritual" value="${escaparHTML(d.nome)}"><button type="button" class="btn-remover-ritual">×</button><div class="ritual-header"><select class="sel-elemento"><option value="" disabled>Elemento</option><option value="sangue">Sangue</option><option value="morte">Morte</option><option value="conhecimento">Conhecimento</option><option value="energia">Energia</option><option value="medo">Medo</option></select><select class="sel-circulo"><option value="1">1º Círculo</option><option value="2">2º Círculo</option><option value="3">3º Círculo</option><option value="4">4º Círculo</option></select><input type="text" class="inp-custo-pe" placeholder="Custo PE" value="${escaparHTML(d.custo_pe)}"></div><div class="ritual-body"><input type="text" class="inp-exec" placeholder="Execução" value="${escaparHTML(d.execucao)}"><input type="text" class="inp-alcance" placeholder="Alcance" value="${escaparHTML(d.alcance)}"><input type="text" class="inp-alvo" placeholder="Alvo/Área" value="${escaparHTML(d.alvo)}"><input type="text" class="inp-duracao" placeholder="Duração" value="${escaparHTML(d.duracao)}"></div><textarea class="ritual-desc" rows="3" placeholder="Descrição / Dano...">${escaparHTML(d.desc)}</textarea>`;
    n.querySelector('.sel-elemento').value=d.elemento||'';n.querySelector('.sel-circulo').value=d.circulo||'1';n.querySelector('.sel-elemento').addEventListener('change',e=>n.dataset.elemento=e.target.value);n.querySelector('.btn-remover-ritual').addEventListener('click',()=>n.remove());c.appendChild(n);
}

function initRituais(){el('btn-add-ritual')?.addEventListener('click',()=>criarCardRitual());}
function initInventarioPoderes(){el('btn-add-arma')?.addEventListener('click',()=>criarLinhaArma());el('btn-add-item')?.addEventListener('click',()=>criarLinhaItem());el('btn-add-poder')?.addEventListener('click',()=>criarCardPoder());}
function initCondicoesE_Defesas(){document.querySelectorAll('.btn-condicao').forEach(b=>b.addEventListener('click',()=>b.dataset.active=String(b.dataset.active!=='true')));}

function atualizarEstadosSaude(){const atual=parseInt(val('pv-atual',0),10)||0,total=parseInt(val('pv-total',0),10)||0,label=el('pv-status-label');if(label){label.textContent=atual<=0?'MORRENDO':atual<total/2?'MACHUCADO':'ESTÁVEL';}}
function atualizarTokenHTML(){const url=val('url-token'),img=el('token-img'),placeholder=el('token-placeholder');if(!img||!placeholder)return;if(url.trim()){img.src=url.trim();img.style.display='block';placeholder.style.display='none';img.onerror=()=>{img.style.display='none';placeholder.style.display='block';mostrarNotificacao('Não foi possível carregar a imagem do token.',true);};}else{img.removeAttribute('src');img.style.display='none';placeholder.style.display='block';}}
window.atualizarTokenHTML=atualizarTokenHTML;
window.atualizarTransformacaoToken=function(){const x=val('token-x',0),y=val('token-y',0),z=val('token-zoom',1);if(el('val-x'))el('val-x').textContent=x;if(el('val-y'))el('val-y').textContent=y;if(el('val-zoom'))el('val-zoom').textContent=Number(z).toFixed(1);if(el('token-img'))el('token-img').style.transform=`translate(${x}px, ${y}px) scale(${z})`;};

function abrirAba(evt,nome){document.querySelectorAll('.tab-content').forEach(c=>{c.classList.remove('active');c.style.display='none';});document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));const alvo=el(nome);if(alvo){alvo.classList.add('active');alvo.style.display='block';}if(evt?.currentTarget)evt.currentTarget.classList.add('active');}
window.abrirAba=abrirAba;

function mostrarResultadoDadoHTML(total,historico,crit=false,falha=false){const area=el('tab-dice-result-area');if(!area)return;area.innerHTML='';const t=document.createElement('div');t.className='dice-final-huge';t.textContent=total;if(crit)t.classList.add('crit-success');if(falha)t.classList.add('crit-fail');const h=document.createElement('div');h.className='dice-line-history';h.textContent=historico;area.append(t,h);}
function rolarTesteOrdemTab(){let qtd=parseInt(val('tab-dice-qtd',1),10);const bonus=parseInt(val('tab-dice-bonus',0),10)||0;let desvantagem=qtd<=0;if(desvantagem)qtd=2;qtd=Math.max(1,qtd);const rolagens=Array.from({length:qtd},()=>Math.floor(Math.random()*20)+1);const escolhido=desvantagem?Math.min(...rolagens):Math.max(...rolagens);mostrarResultadoDadoHTML(escolhido+bonus,`[ ${rolagens.join(' , ')} ] d20 + Bônus(${bonus})`,escolhido===20&&!desvantagem,escolhido===1);}
function rolarDadoGenericoTab(){let qtd=Math.max(1,parseInt(val('gen-dice-qtd',1),10)||1),faces=Math.max(2,parseInt(val('gen-dice-faces',6),10)||6),bonus=parseInt(val('gen-dice-bonus',0),10)||0;const r=Array.from({length:qtd},()=>Math.floor(Math.random()*faces)+1),total=r.reduce((a,b)=>a+b,0)+bonus;mostrarResultadoDadoHTML(total,`[ ${r.join(' + ')} ] d${faces} + Bônus(${bonus})`);}
window.rolarTesteOrdemTab=rolarTesteOrdemTab;window.rolarDadoGenericoTab=rolarDadoGenericoTab;

function inicializarDashboard(){
    if(!location.pathname.includes('dashboard'))return;
    let raw=localStorage.getItem('agente');if(!raw){location.assign('/');return;}let agente;try{agente=JSON.parse(raw);}catch{localStorage.removeItem('agente');localStorage.removeItem('auth_token');location.assign('/');return;}
    setVal('nome-personagem',agente.nome||'');setVal('classe-display',agente.classe||'combatante');aplicarClasse(agente.classe||'combatante');
    const d=agente.dados_salvos||{};
    ['nome_personagem','nome_player','origem','trilha','classe','nex','nivel_gastos','url_token'].forEach(k=>{const map={nome_personagem:'nome-personagem',nome_player:'nome-player',nivel_gastos:'nivel-gastos'};if(d[k]!==undefined)setVal(map[k]||k,d[k]);});
    if(d.token_params){setVal('token-x',d.token_params.x??0);setVal('token-y',d.token_params.y??0);setVal('token-zoom',d.token_params.zoom??1);}
    if(d.atributos)Object.entries({agi:'attr-agi',for:'attr-for',int:'attr-int',pre:'attr-pre',vig:'attr-vig'}).forEach(([k,id])=>setVal(id,d.atributos[k]??1));
    if(d.status)Object.entries({pv_atual:'pv-atual',pv_total:'pv-total',pe_atual:'pe-atual',pe_total:'pe-total',san_atual:'san-atual',san_total:'san-total'}).forEach(([k,id])=>setVal(id,d.status[k]??0));
    if(d.defesas)Object.entries({passiva:'def-passiva',esquiva:'def-esquiva',bloqueio:'def-bloqueio',res_fisica:'res-fisica',res_balistica:'res-balistica',res_sangue:'res-sangue',res_morte:'res-morte',res_energia:'res-energia',res_conhecimento:'res-conhecimento',def_equip:'def-equip',rd_geral:'rd-geral'}).forEach(([k,id])=>setVal(id,d.defesas[k]??0));
    setVal('deslocamento',d.deslocamento??9);setVal('itens-diversos',d.itens_diversos??'');
    if(d.pericias)TODAS_PERICIAS.forEach(p=>{const x=d.pericias[p.id];if(x){setVal(`treino-${p.id}`,x.treino??0);setVal(`extra-${p.id}`,x.extra??0);el(`treino-${p.id}`)?.dispatchEvent(new Event('change'));}});
    if(Array.isArray(d.armas)){el('container-armas').innerHTML='';d.armas.forEach(criarLinhaArma);}if(Array.isArray(d.itens)){el('container-itens').innerHTML='';d.itens.forEach(criarLinhaItem);}if(Array.isArray(d.poderes)){el('container-poderes').innerHTML='';d.poderes.forEach(criarCardPoder);}if(Array.isArray(d.rituais)){el('container-rituais').innerHTML='';d.rituais.forEach(criarCardRitual);}if(Array.isArray(d.condicoes))d.condicoes.forEach(c=>{const b=[...document.querySelectorAll('.btn-condicao')].find(x=>x.textContent.trim()===String(c.nome).trim());if(b)b.dataset.active=String(!!c.ativo);});
    atualizarTokenHTML();window.atualizarTransformacaoToken();recalcularStatus();recalcularDefesas();recalcularPeso();atualizarEstadosSaude();
}

async function enviarDadosParaServidor(){
    const raw=localStorage.getItem('agente'),token=localStorage.getItem('auth_token');if(!raw||!token){mostrarNotificacao('Sessão inválida. Faça login novamente.',true);return;}let agente;try{agente=JSON.parse(raw);}catch{return;}
    const pericias={};TODAS_PERICIAS.forEach(p=>pericias[p.id]={treino:val(`treino-${p.id}`),extra:val(`extra-${p.id}`)});
    const ficha={nome_personagem:val('nome-personagem'),nome_player:val('nome-player'),origem:val('origem'),trilha:val('trilha'),url_token:val('url-token'),token_params:{x:val('token-x'),y:val('token-y'),zoom:val('token-zoom')},nivel_gastos:val('nivel-gastos'),classe:val('classe-display'),nex:val('nex'),atributos:{agi:val('attr-agi'),for:val('attr-for'),int:val('attr-int'),pre:val('attr-pre'),vig:val('attr-vig')},defesas:{passiva:val('def-passiva'),esquiva:val('def-esquiva'),bloqueio:val('def-bloqueio'),res_fisica:val('res-fisica'),res_balistica:val('res-balistica'),res_sangue:val('res-sangue'),res_morte:val('res-morte'),res_energia:val('res-energia'),res_conhecimento:val('res-conhecimento'),def_equip:val('def-equip'),rd_geral:val('rd-geral')},deslocamento:val('deslocamento'),condicoes:[...document.querySelectorAll('.btn-condicao')].map(b=>({nome:b.textContent.trim(),ativo:b.dataset.active==='true'})),status:{pv_atual:val('pv-atual'),pv_total:val('pv-total'),pe_atual:val('pe-atual'),pe_total:val('pe-total'),san_atual:val('san-atual'),san_total:val('san-total')},pericias,armas:[...document.querySelectorAll('#container-armas .arma-linha')].map(n=>({nome:n.querySelector('.nome')?.value||'',teste:n.querySelector('.teste')?.value||'',dano:n.querySelector('.dano')?.value||'',critico:n.querySelector('.critico')?.value||'',peso:n.querySelector('.inp-peso-arma')?.value||'0'})),itens:[...document.querySelectorAll('#container-itens .item-linha')].map(n=>({nome:n.querySelector('.nome')?.value||'',categoria:n.querySelector('.categoria')?.value||'0',peso:n.querySelector('.inp-peso')?.value||'0'})),itens_diversos:val('itens-diversos'),poderes:[...document.querySelectorAll('#container-poderes .poder-card')].map(n=>({nome:n.querySelector('.titulo')?.value||'',custo:n.querySelector('.custo')?.value||'',desc:n.querySelector('.desc')?.value||''})),rituais:[...document.querySelectorAll('#container-rituais .ritual-card')].map(n=>({nome:n.querySelector('.titulo-ritual')?.value||'',elemento:n.querySelector('.sel-elemento')?.value||'',circulo:n.querySelector('.sel-circulo')?.value||'1',execucao:n.querySelector('.inp-exec')?.value||'',alcance:n.querySelector('.inp-alcance')?.value||'',alvo:n.querySelector('.inp-alvo')?.value||'',duracao:n.querySelector('.inp-duracao')?.value||'',custo_pe:n.querySelector('.inp-custo-pe')?.value||'',desc:n.querySelector('.ritual-desc')?.value||''}))};
    const btn=el('btn-salvar-ficha');if(btn)btn.disabled=true;try{const r=await fetch('/salvar_ficha',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify(ficha)});const text=await r.text();let data={};try{data=JSON.parse(text);}catch{}if(r.status===401){localStorage.removeItem('auth_token');localStorage.removeItem('agente');mostrarNotificacao('Sessão expirada. Faça login novamente.',true);setTimeout(()=>location.assign('/'),600);return;}if(!r.ok)throw new Error(data.mensagem||`Falha ao salvar (HTTP ${r.status}).`);agente.dados_salvos=ficha;agente.nome=ficha.nome_personagem||agente.nome;agente.classe=ficha.classe||agente.classe;localStorage.setItem('agente',JSON.stringify(agente));mostrarNotificacao('Ficha atualizada com sucesso!');}catch(e){console.error(e);mostrarNotificacao(e.message||'Erro de conexão.',true);}finally{if(btn)btn.disabled=false;}
}

function configurarLogout(){el('btn-logout')?.addEventListener('click',e=>{e.preventDefault();localStorage.removeItem('agente');localStorage.removeItem('auth_token');location.assign('/');});el('btn-salvar-ficha')?.addEventListener('click',enviarDadosParaServidor);}
function configurarCadastro(){const form=el('formCadastro');if(!form)return;form.addEventListener('submit',async e=>{e.preventDefault();const dados={nome:val('nome'),email:val('email').trim().toLowerCase(),senha:val('senha'),classe:val('classe')};try{const r=await fetch('/registrar',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(dados)});const t=await r.text();let d={};try{d=JSON.parse(t);}catch{}if(!r.ok)throw new Error(d.mensagem||`Falha no cadastro (HTTP ${r.status}).`);alert(d.mensagem||'Cadastro realizado!');location.assign('/');}catch(e){alert(e.message||'Erro de conexão.');}});}

window.addEventListener('DOMContentLoaded',()=>{inicializarTrocaDeCores();gerarHTMLPericias();configurarCadastro();inicializarDashboard();configurarLogout();configurarCalculoAutomatico();initRituais();initInventarioPoderes();initCondicoesE_Defesas();});