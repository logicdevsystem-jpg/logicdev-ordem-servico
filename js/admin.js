/* ============================================================
   LogicDev SYSTEM — AOS
   admin.js — telas do administrador
   ============================================================ */


/* ============================================================
   PROTEÇÃO DO ADMIN
   ============================================================ */

function exigirLoginAdmin(aoConfirmar){

  AUTH.onAuthStateChanged(async function(user){

    if(!DB.usuarioEhAdmin(user)){
      window.location.href = 'index.html';
      return;
    }

    const perfil = await DB.obterPerfilAdmin();

    const elNome = document.getElementById('nome-admin');
    const elCpf = document.getElementById('cpf-admin');

    if(elNome){ elNome.textContent = perfil.nome; }
    if(elCpf){ elCpf.textContent = perfil.cpf; }

    const botaoSair = document.getElementById('btn-sair');

    if(botaoSair){

      botaoSair.addEventListener('click', async function(e){

        e.preventDefault();
        await DB.sairAdmin();
        window.location.href = 'index.html';

      });

    }

    if(typeof aoConfirmar === 'function'){
      aoConfirmar();
    }

  });

}


/* ============================================================
   MODELOS DE ETAPAS POR TIPO DE PROJETO
   ============================================================ */

const MODELOS_ETAPAS = {

  institucional: [
    'Estrutura inicial do site',
    'Página inicial (banner e apresentação)',
    'Sobre a empresa',
    'Serviços oferecidos',
    'Depoimentos ou diferenciais',
    'Contato e localização',
    'Ajuste para celular e tablet',
    'Revisão final com o cliente',
    'Publicação no ar'
  ],

  landing: [
    'Estrutura da página',
    'Título principal e chamada de ação',
    'Benefícios do produto/serviço',
    'Prova social (depoimentos, números, selos)',
    'Formulário ou botão de contato/compra',
    'Perguntas frequentes',
    'Ajuste para celular e tablet',
    'Revisão final com o cliente',
    'Publicação no ar'
  ],

  onepage: [
    'Estrutura inicial da página',
    'Banner principal',
    'Seção sobre',
    'Seção de serviços/produtos',
    'Seção de contato',
    'Ajuste para celular e tablet',
    'Revisão final com o cliente',
    'Publicação no ar'
  ],

  catalogo: [
    'Estrutura inicial do site',
    'Página inicial',
    'Categorias de produtos',
    'Cadastro dos produtos (fotos e descrições)',
    'Contato/pedido via WhatsApp',
    'Ajuste para celular e tablet',
    'Revisão final com o cliente',
    'Publicação no ar'
  ],

  ecommerce: [
    'Estrutura inicial da loja',
    'Cadastro das categorias',
    'Cadastro dos produtos (fotos, preços, descrições)',
    'Carrinho de compras',
    'Formas de pagamento',
    'Cálculo de frete/entrega',
    'Painel para gerenciar pedidos',
    'Ajuste para celular e tablet',
    'Testes de compra',
    'Revisão final com o cliente',
    'Publicação no ar'
  ]

};

const MODELOS_TIPO_LABEL = {
  institucional: 'Site Institucional',
  landing: 'Landing Page',
  onepage: 'One Page',
  catalogo: 'Site Catálogo',
  ecommerce: 'E-commerce / Loja Virtual'
};


/* ============================================================
   INICIAIS
   ============================================================ */

function iniciais(nome){

  return (nome || '')
    .split(' ')
    .filter(Boolean)
    .slice(0,2)
    .map(p => p[0])
    .join('')
    .toUpperCase();

}


/* ============================================================
   MENSAGEM DE CONCLUSÃO — DISPARO DIRETO DA LISTAGEM
   ============================================================ */

async function enviarMensagemConclusaoDashboard(clienteId){

  const cliente = await DB.buscarClientePorId(clienteId);

  if(!cliente){
    DB.mostrarAviso('Cliente não encontrado. Atualize a página.');
    return;
  }

  const { saldo } =
    DB.calcularSinalESaldo(cliente.valorTotal, cliente.percentualEntrada);

  const mensagem =
    `Olá, ${cliente.nome.split(' ')[0]}! Seu projeto foi concluído 100%. 🎉\n\n` +
    `Projeto: ${cliente.projeto || '—'}\n\n` +
    `Todas as etapas previstas foram finalizadas e o relatório de entrega já está disponível para acompanhamento.\n\n` +
    `Para finalizarmos, falta a quitação do saldo restante:\n` +
    `Saldo a pagar: ${DB.formatarMoeda(saldo)}\n\n` +
    `Assim que o pagamento for confirmado, enviaremos o contrato para assinatura digital e liberaremos o acesso completo ao seu projeto.\n\n` +
    `Qualquer dúvida, estamos à disposição!\nLogicDev System`;

  window.open(DB.linkWhatsApp(cliente.whatsapp, mensagem), '_blank');

}


/* ============================================================
   PRÉ-CADASTROS PENDENTES
   ============================================================ */

let PRECADASTRO_EM_CONCLUSAO = null;


async function renderizarPreCadastros(){

  const lista = document.getElementById('lista-precadastros');

  if(!lista){ return; }

  lista.innerHTML =
    '<div class="vazio">Carregando pré-cadastros...</div>';

  const precadastros = await DB.listarPreCadastros();

  const total = document.getElementById('total-precadastros');

  if(total){
    total.textContent = `Total: ${precadastros.length}`;
  }

  if(precadastros.length === 0){

    lista.innerHTML =
      '<div class="vazio">Nenhum pré-cadastro pendente.</div>';

  }

  else{

    lista.innerHTML =
      precadastros.map(p => `

        <div class="item-cliente">

          <div class="avatar">${iniciais(p.nome)}</div>

          <div class="info">
            <strong>${p.nome}</strong>
            <span>CPF/CNPJ: ${p.cpfCnpj}</span>
            <small>WhatsApp: ${p.whatsapp || '—'} · E-mail: ${p.email || '—'}</small>
          </div>

          <button
            type="button"
            class="botao botao-primario"
            onclick="abrirConclusaoPreCadastro('${p.id}')"
          >
            Concluir Cadastro
          </button>

        </div>

      `).join('');

  }

}


async function abrirConclusaoPreCadastro(id){

  const pre = await DB.buscarPreCadastroPorId(id);

  if(!pre){
    DB.mostrarAviso('Pré-cadastro não encontrado. Atualize a página.');
    return;
  }

  PRECADASTRO_EM_CONCLUSAO = pre.id;

  document.getElementById('n-nome').value = pre.nome || '';
  document.getElementById('n-doc').value = pre.cpfCnpj || '';
  document.getElementById('n-whatsapp').value = pre.whatsapp || '';
  document.getElementById('n-email').value = pre.email || '';

  const inicio = document.getElementById('n-inicio');

  if(inicio){
    inicio.value = DB.hojeISO();
  }

  document.getElementById('modal-novo').style.display = 'flex';

}


/* ============================================================
   PAINEL ADMIN
   ============================================================ */

async function renderizarPainelAdmin(){

  const lista = document.getElementById('lista-clientes');

  lista.innerHTML =
    '<div class="vazio">Carregando clientes...</div>';

  const clientes = await DB.listarClientes();

  const total = document.getElementById('total-clientes');

  if(total){
    total.textContent = `Total de clientes: ${clientes.length}`;
  }

  if(clientes.length === 0){

    lista.innerHTML =
      '<div class="vazio">Nenhum cliente cadastrado ainda. Clique em "+ Novo Cliente" para começar.</div>';

  }

  else{

    lista.innerHTML =
      clientes.map(c => {

        const progresso = DB.calcularProgresso(c.etapas);

        return `

          <a class="item-cliente" href="cliente.html?id=${c.id}" style="flex-wrap:wrap;">

            <div class="avatar">${iniciais(c.nome)}</div>

            <div class="info">
              <strong>${c.nome}</strong>
              <span>${c.os} · ${c.projeto}</span>
              <small>CPF/CNPJ: ${c.cpfCnpj}</small>
            </div>

            <div class="barra-mini">
              <div class="barra"><div style="width:${progresso}%"></div></div>
            </div>

            <div class="pct">${progresso}%</div>

            ${(progresso === 100 && c.valorTotal && c.statusPagamento !== 'QUITADO') ? `
              <button
                type="button"
                class="botao botao-secundario"
                style="font-size:.72rem; padding:6px 10px; width:100%; margin-top:8px;"
                onclick="event.preventDefault(); event.stopPropagation(); enviarMensagemConclusaoDashboard('${c.id}')"
              >
                🔔 Projeto 100% — Enviar mensagem de conclusão
              </button>
            ` : ''}

          </a>

        `;

      }).join('');

  }

  configurarModalNovoCliente();

}


/* ============================================================
   CADASTRO CLIENTE + PROJETO
   ============================================================ */

function configurarModalNovoCliente(){

  const modal = document.getElementById('modal-novo');
  const btnNovo = document.getElementById('btn-novo-cliente');
  const btnCancelar = document.getElementById('btn-cancelar-novo');

  const inputDoc = document.getElementById('n-doc');

  if(inputDoc){

    inputDoc.setAttribute('maxlength', '18');

    inputDoc.addEventListener('input', function(e){

      let value = e.target.value.replace(/\D/g, '');
      value = value.slice(0, 14);

      if(value.length <= 11){
        value = value
          .replace(/^(\d{3})(\d)/, '$1.$2')
          .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
      } else {
        value = value
          .replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})\.(\d{3})(\d)/, '.$1.$2/$3')
          .replace(/\/(\d{4})(\d{1,2})$/, '/$1-$2');
      }

      e.target.value = value;

    });

  }

  const inputWhats = document.getElementById('n-whatsapp');

  if(inputWhats){

    inputWhats.setAttribute('maxlength', '16');

    inputWhats.addEventListener('input', function(e){

      let value = e.target.value.replace(/\D/g, '');
      value = value.slice(0, 11);

      if(value.length <= 10){
        value = value
          .replace(/^(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
      } else {
        value = value
          .replace(/^(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
      }

      e.target.value = value;

    });

  }

  const formulario = document.getElementById('form-novo-cliente');

  const btnPreencherModelo = document.getElementById('btn-preencher-modelo');

  if(btnPreencherModelo && !btnPreencherModelo.dataset.configurado){

    btnPreencherModelo.dataset.configurado = 'true';

    btnPreencherModelo.addEventListener('click', function(){

      const select = document.getElementById('n-modelo-etapas');
      const chave = select.value;

      if(!chave){
        DB.mostrarAviso('Selecione um modelo de projeto antes de preencher.');
        return;
      }

      document.getElementById('n-etapas').value =
        MODELOS_ETAPAS[chave].join('\n');

      const campoTipo = document.getElementById('n-tipo');

      if(campoTipo && !campoTipo.value.trim()){
        campoTipo.value = MODELOS_TIPO_LABEL[chave];
      }

    });

  }

  if(btnNovo && !btnNovo.dataset.configurado){

    btnNovo.dataset.configurado = 'true';

    btnNovo.addEventListener('click', () => {

      PRECADASTRO_EM_CONCLUSAO = null;

      const inicio = document.getElementById('n-inicio');

      if(inicio){
        inicio.value = DB.hojeISO();
      }

      modal.style.display = 'flex';

    });

  }

  if(btnCancelar && !btnCancelar.dataset.configurado){

    btnCancelar.dataset.configurado = 'true';

    btnCancelar.addEventListener('click', () => {
      PRECADASTRO_EM_CONCLUSAO = null;
      modal.style.display = 'none';
    });

  }

  if(formulario && !formulario.dataset.configurado){

    formulario.dataset.configurado = 'true';

    formulario.addEventListener('submit', async function(e){

      e.preventDefault();

      const etapasTexto =
        document.getElementById('n-etapas').value
          .split('\n').map(l => l.trim()).filter(Boolean);

      if(etapasTexto.length === 0){
        DB.mostrarAviso('Cadastre ao menos uma etapa para o projeto.');
        return;
      }

      const tecnologiasTexto =
        document.getElementById('n-tecnologias').value
          .split(',').map(t => t.trim()).filter(Boolean);

      const botaoSalvar = this.querySelector('button[type=submit]');

      botaoSalvar.disabled = true;
      botaoSalvar.textContent = 'Salvando...';

      const novoCliente = {

        nome: document.getElementById('n-nome').value.trim(),
        cpfCnpj: document.getElementById('n-doc').value.trim(),
        whatsapp: document.getElementById('n-whatsapp').value.trim(),
        email: document.getElementById('n-email').value.trim(),
        tipo: document.getElementById('n-tipo').value.trim(),
        projeto: document.getElementById('n-projeto').value.trim(),
        dataInicio: document.getElementById('n-inicio').value,
        prazo: document.getElementById('n-prazo').value,

        etapas: etapasTexto.map(nome => ({ nome: nome, concluida: false })),

        entrega: {
          tecnologias: tecnologiasTexto,
          dominio: document.getElementById('n-dominio').value.trim(),
          hospedagem: document.getElementById('n-hospedagem').value.trim()
        }

      };

      try{

        await DB.criarCliente(novoCliente);

        if(PRECADASTRO_EM_CONCLUSAO){

          await DB.concluirPreCadastro(PRECADASTRO_EM_CONCLUSAO);
          PRECADASTRO_EM_CONCLUSAO = null;
          await renderizarPreCadastros();

        }

        modal.style.display = 'none';
        this.reset();

        await renderizarPainelAdmin();

      }

      catch(erro){

        console.error('Erro ao cadastrar:', erro);
        DB.mostrarAviso('Não foi possível salvar o cliente. Veja o console para detalhes.');

      }

      finally{

        botaoSalvar.disabled = false;
        botaoSalvar.textContent = 'Cadastrar Cliente';

      }

    });

  }

}


/* ============================================================
   RÓTULOS DO STATUS DE PAGAMENTO
   ============================================================ */

function rotuloStatusPagamento(status){

  const mapa = {

    'AGUARDANDO_CONFIRMACAO_ADMIN':
      'Cliente informou pagamento — aguardando você confirmar',

    'EM_ANDAMENTO':
      'Sinal confirmado — projeto liberado para o cliente',

    'QUITADO':
      'Saldo final quitado — relatório liberado'

  };

  return mapa[status] || 'Proposta ainda não enviada / aceita';

}


/* ============================================================
   FICHA DO CLIENTE
   ============================================================ */

async function renderizarFichaCliente(){

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const area = document.getElementById('area-cliente');

  area.innerHTML = '<div class="cartao"><p>Carregando...</p></div>';

  const cliente = await DB.buscarClientePorId(id);

  if(!cliente){
    area.innerHTML = '<div class="cartao"><p>Cliente não encontrado.</p></div>';
    return;
  }

  const progresso = DB.calcularProgresso(cliente.etapas);

  const selo =
    cliente.status === 'concluido'
      ? '<span class="selo selo-concluido">Concluído</span>'
      : '<span class="selo selo-andamento">Em andamento</span>';

  const entrega = cliente.entrega || {};

  const escopoDefault =
    cliente.escopo ||
    `Desenvolvimento de ${cliente.tipo || '[tipo de projeto]'} com [quantidade] seções/páginas, incluindo [principais funcionalidades combinadas]. O valor cobre design, desenvolvimento, ajuste para celular/tablet e publicação. Não inclui: domínio, hospedagem paga e alterações de escopo fora do combinado.`;


  area.innerHTML = `

    <div class="cabecalho-secao">
      <div>
        <h2>${cliente.nome}</h2>
        <p>CPF/CNPJ: ${cliente.cpfCnpj} · ${cliente.os} · ${cliente.projeto}</p>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        ${selo}
        <button type="button" class="botao botao-secundario nao-imprime" id="btn-editar-cliente">
          Editar Cliente
        </button>
      </div>
    </div>


    <!-- ================= EDITAR CLIENTE (oculto por padrão) ================= -->

    <div class="cartao" id="cartao-editar-cliente" style="display:none;">

      <div class="cabecalho-secao">
        <h2 style="font-size:1rem;">Editar dados do cliente e projeto</h2>
      </div>

      <div class="linha-campos">

        <div>
          <label for="ed-nome">Nome completo / Razão Social</label>
          <input type="text" id="ed-nome" value="${cliente.nome || ''}">
        </div>

        <div>
          <label for="ed-doc">CPF / CNPJ</label>
          <input type="text" id="ed-doc" value="${cliente.cpfCnpj || ''}">
        </div>

      </div>

      <div class="linha-campos">

        <div>
          <label for="ed-whatsapp">WhatsApp</label>
          <input type="text" id="ed-whatsapp" value="${cliente.whatsapp || ''}">
        </div>

        <div>
          <label for="ed-email">E-mail</label>
          <input type="email" id="ed-email" value="${cliente.email || ''}">
        </div>

      </div>

      <div class="linha-campos">

        <div>
          <label for="ed-projeto">Nome do projeto</label>
          <input type="text" id="ed-projeto" value="${cliente.projeto || ''}">
        </div>

        <div>
          <label for="ed-tipo">Tipo de projeto</label>
          <input type="text" id="ed-tipo" value="${cliente.tipo || ''}">
        </div>

      </div>

      <label for="ed-tecnologias">Tecnologias</label>
      <input type="text" id="ed-tecnologias" value="${entrega.tecnologias && entrega.tecnologias.length ? entrega.tecnologias.join(', ') : ''}">

      <div class="linha-campos">

        <div>
          <label for="ed-dominio">Domínio</label>
          <input type="text" id="ed-dominio" value="${entrega.dominio || ''}">
        </div>

        <div>
          <label for="ed-hospedagem">Hospedagem</label>
          <input type="text" id="ed-hospedagem" value="${entrega.hospedagem || ''}">
        </div>

      </div>

      <div class="linha-campos">

        <div>
          <label for="ed-inicio">Data de início</label>
          <input type="date" id="ed-inicio" value="${cliente.dataInicio || ''}">
        </div>

        <div>
          <label for="ed-prazo">Prazo de entrega</label>
          <input type="date" id="ed-prazo" value="${cliente.prazo || ''}">
        </div>

      </div>

      <div style="display:flex; gap:10px; margin-top:16px;">

        <button type="button" class="botao botao-secundario botao-bloco" id="btn-cancelar-edicao">
          Cancelar
        </button>

        <button type="button" class="botao botao-primario botao-bloco" id="btn-salvar-edicao">
          Salvar Alterações
        </button>

      </div>

    </div>


    <div class="grade-2">

      <!-- PROGRESSO -->
      <div class="cartao">

        <div class="cabecalho-secao">
          <h2 style="font-size:1rem;">Progresso: ${progresso}%</h2>
        </div>

        <div class="barra" style="margin-bottom:18px;">
          <div style="width:${progresso}%"></div>
        </div>

        <form id="form-etapas">

          <div class="checklist" id="checklist-etapas">

            ${cliente.etapas.map((et, i) => `

              <div class="etapa ${et.concluida ? 'concluida' : ''}">

                <input
                  type="checkbox"
                  id="etapa-${i}"
                  data-indice="${i}"
                  ${et.concluida ? 'checked' : ''}
                >

                <label for="etapa-${i}">${et.nome}</label>

              </div>

            `).join('')}

          </div>

          <button
            type="submit"
            class="botao botao-primario botao-bloco"
            style="margin-top:18px;"
          >
            Atualizar
          </button>

        </form>

      </div>


      <!-- DADOS -->
      <div class="cartao">

        <h2 style="font-size:1rem; margin-bottom:14px;">Dados do projeto</h2>

        <p style="font-size:.88rem; color:var(--tinta-suave); margin:0 0 10px;">

          <strong style="color:var(--tinta);">Cliente:</strong> ${cliente.nome}<br>
          <strong style="color:var(--tinta);">CPF/CNPJ:</strong> ${cliente.cpfCnpj}<br>
          <strong style="color:var(--tinta);">WhatsApp:</strong> ${cliente.whatsapp || '—'}<br>
          <strong style="color:var(--tinta);">E-mail:</strong> ${cliente.email || '—'}<br>
          <strong style="color:var(--tinta);">OS:</strong> ${cliente.os}<br>
          <strong style="color:var(--tinta);">Tipo:</strong> ${cliente.tipo}<br>
          <strong style="color:var(--tinta);">Início:</strong> ${DB.formatarData(cliente.dataInicio)}<br>
          <strong style="color:var(--tinta);">Prazo:</strong> ${DB.formatarData(cliente.prazo)}<br>
          <strong style="color:var(--tinta);">Tecnologias:</strong> ${entrega.tecnologias && entrega.tecnologias.length ? entrega.tecnologias.join(', ') : '—'}<br>
          <strong style="color:var(--tinta);">Domínio:</strong> ${entrega.dominio || '—'}<br>
          <strong style="color:var(--tinta);">Hospedagem:</strong> ${entrega.hospedagem || '—'}

        </p>

        <h2 style="font-size:1rem; margin:18px 0 10px;">Histórico interno</h2>

        <div class="linha-tempo">

          ${(!cliente.historico || cliente.historico.length === 0)
            ? '<p style="font-size:.85rem; color:var(--tinta-suave);">Nenhuma atualização registrada ainda.</p>'
            : cliente.historico.slice().reverse().map(h => `

              <div class="evento">
                <div class="data">${DB.formatarData(h.data)}</div>
                <div class="responsavel">${h.responsavel}</div>
                <ul>${h.itens.map(i => `<li>${i} concluída</li>`).join('')}</ul>
              </div>

            `).join('')
          }

        </div>

      </div>

    </div>


    <!-- ================= FINANCEIRO / PROPOSTA ================= -->

    <div class="cartao" id="cartao-financeiro">

      <div class="cabecalho-secao">
        <div>
          <h2 style="font-size:1rem;">Financeiro e Proposta</h2>
          <p id="fin-status-label">${rotuloStatusPagamento(cliente.statusPagamento)}</p>
        </div>
      </div>

      <div class="linha-campos">

        <div>
          <label for="fin-valor-total">Valor Total (R$)</label>
          <input type="text" id="fin-valor-total" inputmode="decimal" placeholder="R$ 0,00" value="${cliente.valorTotal ? DB.formatarMoeda(cliente.valorTotal) : ''}">
        </div>

        <div>
          <label for="fin-percentual">Porcentagem de Entrada (%)</label>
          <input type="text" id="fin-percentual" inputmode="numeric" placeholder="50" value="${cliente.percentualEntrada || 50}">
        </div>

      </div>

      <label for="fin-pix">Chave PIX</label>
      <input type="text" id="fin-pix" value="${cliente.chavePix || ''}" placeholder="CPF, e-mail, telefone ou chave aleatória">

      <label for="fin-escopo">Escopo / Descrição do Serviço</label>
      <textarea id="fin-escopo" rows="4" placeholder="Descreva o que está incluso no projeto...">${escopoDefault}</textarea>

      <div class="linha-campos" style="margin-top:14px;">

        <div>
          <label style="margin-top:0;">Valor do sinal</label>
          <p id="fin-sinal" style="font-weight:700; font-size:1.05rem; color:var(--primaria); margin:0;">
            ${DB.formatarMoeda(cliente.valorSinal)}
          </p>
        </div>

        <div>
          <label style="margin-top:0;">Saldo restante</label>
          <p id="fin-saldo" style="font-weight:700; font-size:1.05rem; margin:0;">
            ${DB.formatarMoeda(cliente.saldoRestante)}
          </p>
        </div>

      </div>

      <div style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap;">

        <button type="button" class="botao botao-secundario" id="btn-salvar-financeiro">
          Salvar Dados Financeiros
        </button>

        <button type="button" class="botao botao-secundario" id="btn-gerar-link">
          Gerar Link da Proposta
        </button>

        <button type="button" class="botao botao-primario" id="btn-enviar-whatsapp" style="display:none;">
          Enviar por WhatsApp
        </button>

        ${(cliente.valorTotal && cliente.statusPagamento !== 'EM_ANDAMENTO' && cliente.statusPagamento !== 'QUITADO') ? `
          <button type="button" class="botao botao-primario" id="btn-confirmar-sinal">
            Confirmar Recebimento da Entrada
          </button>
        ` : ''}

        ${cliente.statusPagamento === 'EM_ANDAMENTO' ? `
          <button type="button" class="botao botao-primario" id="btn-confirmar-final">
            Confirmar Pagamento Final (Saldo)
          </button>
        ` : ''}

        ${(cliente.valorTotal && progresso === 100 && cliente.statusPagamento !== 'QUITADO') ? `
          <button type="button" class="botao botao-secundario" id="btn-msg-conclusao">
            Enviar Mensagem de Conclusão (100%)
          </button>
        ` : ''}

      </div>

      <div id="fin-link-gerado" style="margin-top:14px; display:none;">

        <label style="margin-top:0;">Link da proposta</label>

        <div style="display:flex; gap:8px;">
          <input type="text" id="fin-link-input" readonly style="flex:1;">
          <button type="button" class="botao botao-secundario" id="btn-copiar-link">Copiar</button>
        </div>

      </div>

    </div>


    ${cliente.valorTotal ? `

      <div class="cartao">

        <div class="cabecalho-secao">

          <div>
            <h2 style="font-size:1rem;">Contrato</h2>
            <p>
              ${cliente.assinaturaContrato
                ? `Assinado digitalmente em ${DB.formatarData(cliente.dataAssinaturaContrato)}`
                : 'O cliente ainda não assinou o contrato'
              }
            </p>
          </div>

          ${cliente.assinaturaContrato
            ? '<span class="selo selo-concluido">Assinado</span>'
            : '<span class="selo selo-andamento">Pendente</span>'
          }

        </div>

        <a
          href="../cliente/contrato.html?id=${cliente.id}"
          target="_blank"
          class="botao botao-secundario"
        >
          Ver Contrato
        </a>

      </div>

    ` : ''}

  `;


  /* ATUALIZAÇÃO DAS ETAPAS */

  document.getElementById('form-etapas').addEventListener('submit', async function(e){

    e.preventDefault();

    const botao = this.querySelector('button[type=submit]');

    botao.disabled = true;
    botao.textContent = 'Salvando...';

    const checkboxes =
      document.querySelectorAll('#checklist-etapas input[type=checkbox]');

    const novasEtapas =
      cliente.etapas.map((et, i) => ({
        nome: et.nome,
        concluida: checkboxes[i].checked
      }));

    const perfil = await DB.obterPerfilAdmin();

    await DB.atualizarEtapas(cliente.id, novasEtapas, perfil.nome);

    await renderizarFichaCliente();

  });


  /* FINANCEIRO — cálculo ao vivo e ações */

  configurarFinanceiro(cliente);
  configurarEdicaoCliente(cliente);

}


function configurarFinanceiro(cliente){

  const inputTotal = document.getElementById('fin-valor-total');
  const inputPercentual = document.getElementById('fin-percentual');
  const elSinal = document.getElementById('fin-sinal');
  const elSaldo = document.getElementById('fin-saldo');


  /*
    MÁSCARA DE MOEDA

    Funciona baseado em centavos: cada dígito digitado
    empurra os anteriores, igual um caixa eletrônico.
  */

  inputTotal.addEventListener('input', function(e){

    let digitos = e.target.value.replace(/\D/g, '');

    if(!digitos){
      digitos = '0';
    }

    const valorEmReais = parseInt(digitos, 10) / 100;

    e.target.value = DB.formatarMoeda(valorEmReais);

    recalcular();

  });


  function recalcular(){

    const total = DB.paraNumeroMoeda(inputTotal.value);
    const percentual = parseInt(inputPercentual.value, 10) || 0;

    const { sinal, saldo } =
      DB.calcularSinalESaldo(total, percentual);

    elSinal.textContent = DB.formatarMoeda(sinal);
    elSaldo.textContent = DB.formatarMoeda(saldo);

  }


  /*
    Campo livre — digita o número direto, sem setinha
    de incrementar/decrementar travando o digitado.
    Só limita para não passar de 100.
  */

  inputPercentual.addEventListener('input', function(e){

    let digitos = e.target.value.replace(/\D/g, '');

    if(digitos !== ''){

      let n = parseInt(digitos, 10);

      if(n > 100){ n = 100; }

      digitos = String(n);

    }

    e.target.value = digitos;

    recalcular();

  });


  document.getElementById('btn-salvar-financeiro')
    .addEventListener('click', async function(){

      this.disabled = true;
      this.textContent = 'Salvando...';

      try{

        await DB.salvarDadosFinanceiros(cliente.id, {

          valorTotal: DB.paraNumeroMoeda(inputTotal.value),
          percentualEntrada: inputPercentual.value,
          chavePix: document.getElementById('fin-pix').value.trim(),
          escopo: document.getElementById('fin-escopo').value.trim()

        });

        DB.mostrarAviso('Dados financeiros salvos.');

        await renderizarFichaCliente();

      }

      catch(erro){

        console.error('Erro ao salvar dados financeiros:', erro);
        DB.mostrarAviso('Não foi possível salvar. Veja o console.');

        this.disabled = false;
        this.textContent = 'Salvar Dados Financeiros';

      }

    });


  document.getElementById('btn-gerar-link')
    .addEventListener('click', async function(){

      this.disabled = true;
      this.textContent = 'Gerando...';

      try{

        await DB.salvarDadosFinanceiros(cliente.id, {

          valorTotal: DB.paraNumeroMoeda(inputTotal.value),
          percentualEntrada: inputPercentual.value,
          chavePix: document.getElementById('fin-pix').value.trim(),
          escopo: document.getElementById('fin-escopo').value.trim()

        });

        const link =
          `${window.location.origin}${window.location.pathname.replace('admin/cliente.html','cliente/proposta.html')}?id=${cliente.id}`;

        const area = document.getElementById('fin-link-gerado');
        const campo = document.getElementById('fin-link-input');

        campo.value = link;
        area.style.display = 'block';


        const { sinal } =
          DB.calcularSinalESaldo(inputTotal.value, inputPercentual.value);

        const mensagem =
          `Olá, ${cliente.nome.split(' ')[0]}! Aqui está o resumo da sua proposta com a LogicDev:\n\n` +
          `Serviço: ${cliente.tipo || '—'}\n` +
          `Projeto: ${cliente.projeto || '—'}\n` +
          `Valor total: ${DB.formatarMoeda(DB.paraNumeroMoeda(inputTotal.value))}\n` +
          `Valor da entrada (sinal): ${DB.formatarMoeda(sinal)}\n\n` +
          `Chave PIX: ${document.getElementById('fin-pix').value.trim() || 'a informar'}\n\n` +
          `Após realizar o pagamento da entrada, envie o comprovante aqui pelo WhatsApp ` +
          `para liberarmos o acompanhamento do seu projeto.\n\n` +
          `Qualquer dúvida, estamos à disposição!\nLogicDev System`;

        const btnWhats = document.getElementById('btn-enviar-whatsapp');

        btnWhats.style.display = 'inline-flex';

        btnWhats.onclick = function(){
          window.open(DB.linkWhatsApp(cliente.whatsapp, mensagem), '_blank');
        };

      }

      catch(erro){

        console.error('Erro ao gerar link:', erro);
        DB.mostrarAviso('Não foi possível gerar o link. Veja o console.');

      }

      finally{

        this.disabled = false;
        this.textContent = 'Gerar Link da Proposta';

      }

    });


  const btnCopiar = document.getElementById('btn-copiar-link');

  if(btnCopiar){

    btnCopiar.addEventListener('click', function(){

      const campo = document.getElementById('fin-link-input');

      campo.select();

      navigator.clipboard.writeText(campo.value)
        .then(() => { DB.mostrarAviso('Link copiado!'); })
        .catch(() => { DB.mostrarAviso('Não foi possível copiar automaticamente. Copie manualmente.'); });

    });

  }


  const btnConfirmarSinal = document.getElementById('btn-confirmar-sinal');

  if(btnConfirmarSinal){

    btnConfirmarSinal.addEventListener('click', async function(){

      if(!confirm('Confirmar que o sinal foi recebido? Isso libera o acompanhamento para o cliente.')){
        return;
      }

      this.disabled = true;
      this.textContent = 'Confirmando...';

      try{

        await DB.confirmarPagamentoSinal(cliente.id);
        await renderizarFichaCliente();

      }

      catch(erro){

        console.error('Erro ao confirmar sinal:', erro);
        DB.mostrarAviso('Não foi possível confirmar. Veja o console.');

        this.disabled = false;
        this.textContent = 'Confirmar Recebimento da Entrada';

      }

    });

  }


  const btnConfirmarFinal = document.getElementById('btn-confirmar-final');

  if(btnConfirmarFinal){

    btnConfirmarFinal.addEventListener('click', async function(){

      if(!confirm('O cliente já pagou o restante desse projeto?')){
        return;
      }

      this.disabled = true;
      this.textContent = 'Confirmando...';

      try{

        await DB.confirmarPagamentoFinal(cliente.id);

        const linkContrato =
          `${window.location.origin}${window.location.pathname.replace('admin/cliente.html','cliente/contrato.html')}?id=${cliente.id}`;

        const mensagem =
          `Olá, ${cliente.nome.split(' ')[0]}! Recebemos a confirmação do pagamento final do seu projeto. ✅\n\n` +
          `Projeto: ${cliente.projeto || '—'}\n\n` +
          `Para concluir, acesse o link abaixo e assine o contrato digitalmente pelo celular ou tablet:\n${linkContrato}\n\n` +
          `Após a assinatura, seu projeto estará totalmente finalizado.\n\n` +
          `Qualquer dúvida, estamos à disposição!\nLogicDev System`;

        window.open(DB.linkWhatsApp(cliente.whatsapp, mensagem), '_blank');

        await renderizarFichaCliente();

      }

      catch(erro){

        console.error('Erro ao confirmar pagamento final:', erro);
        DB.mostrarAviso('Não foi possível confirmar. Veja o console.');

        this.disabled = false;
        this.textContent = 'Confirmar Pagamento Final (Saldo)';

      }

    });

  }


  const btnMsgConclusao = document.getElementById('btn-msg-conclusao');

  if(btnMsgConclusao){

    btnMsgConclusao.addEventListener('click', function(){

      const { saldo } =
        DB.calcularSinalESaldo(cliente.valorTotal, cliente.percentualEntrada);

      const mensagem =
        `Olá, ${cliente.nome.split(' ')[0]}! Seu projeto foi concluído 100%. 🎉\n\n` +
        `Projeto: ${cliente.projeto || '—'}\n\n` +
        `Todas as etapas previstas foram finalizadas e o relatório de entrega já está disponível para acompanhamento.\n\n` +
        `Para finalizarmos, falta a quitação do saldo restante:\n` +
        `Saldo a pagar: ${DB.formatarMoeda(saldo)}\n\n` +
        `Assim que o pagamento for confirmado, enviaremos o contrato para assinatura digital e liberaremos o acesso completo ao seu projeto.\n\n` +
        `Qualquer dúvida, estamos à disposição!\nLogicDev System`;

      window.open(DB.linkWhatsApp(cliente.whatsapp, mensagem), '_blank');

    });

  }

}


/* ============================================================
   EDITAR CLIENTE
   ============================================================ */

function configurarEdicaoCliente(cliente){

  const btnEditar = document.getElementById('btn-editar-cliente');
  const cartao = document.getElementById('cartao-editar-cliente');
  const btnCancelar = document.getElementById('btn-cancelar-edicao');
  const btnSalvar = document.getElementById('btn-salvar-edicao');

  btnEditar.addEventListener('click', function(){
    cartao.style.display = cartao.style.display === 'none' ? 'block' : 'none';
    cartao.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  btnCancelar.addEventListener('click', function(){
    cartao.style.display = 'none';
  });

  btnSalvar.addEventListener('click', async function(){

    this.disabled = true;
    this.textContent = 'Salvando...';

    try{

      const tecnologiasTexto =
        document.getElementById('ed-tecnologias').value
          .split(',').map(t => t.trim()).filter(Boolean);

      await DB.atualizarCliente(cliente.id, {

        nome: document.getElementById('ed-nome').value.trim(),
        cpfCnpj: document.getElementById('ed-doc').value.trim(),
        whatsapp: document.getElementById('ed-whatsapp').value.trim(),
        email: document.getElementById('ed-email').value.trim(),
        projeto: document.getElementById('ed-projeto').value.trim(),
        tipo: document.getElementById('ed-tipo').value.trim(),
        dataInicio: document.getElementById('ed-inicio').value,
        prazo: document.getElementById('ed-prazo').value,
        tecnologias: tecnologiasTexto,
        dominio: document.getElementById('ed-dominio').value.trim(),
        hospedagem: document.getElementById('ed-hospedagem').value.trim()

      });

      DB.mostrarAviso('Dados do cliente atualizados.');

      await renderizarFichaCliente();

    }

    catch(erro){

      console.error('Erro ao editar cliente:', erro);
      DB.mostrarAviso('Não foi possível salvar as alterações. Veja o console.');

      this.disabled = false;
      this.textContent = 'Salvar Alterações';

    }

  });

}


/* ============================================================
   RELATÓRIO
   ============================================================ */

let CLIENTES_EM_MEMORIA_RELATORIO = [];


async function inicializarRelatorio(){

  CLIENTES_EM_MEMORIA_RELATORIO = await DB.listarClientes();

  const campoBusca = document.getElementById('busca');

  campoBusca.addEventListener('input', function(){

    const termo = this.value.trim();
    const termoNorm = DB.normalizarNome(termo);
    const termoDoc = DB.soNumeros(termo);

    const resultadosDiv = document.getElementById('resultados-busca');

    if(termo.length < 2){
      resultadosDiv.innerHTML = '';
      return;
    }

    const encontrados =
      CLIENTES_EM_MEMORIA_RELATORIO.filter(c =>
        DB.normalizarNome(c.nome).includes(termoNorm) ||
        (termoDoc && DB.soNumeros(c.cpfCnpj).includes(termoDoc))
      );

    if(encontrados.length === 0){
      resultadosDiv.innerHTML =
        '<p style="font-size:.85rem; color:var(--tinta-suave);">Nenhum cliente encontrado.</p>';
      return;
    }

    resultadosDiv.innerHTML =
      encontrados.map(c => `

        <div class="item-cliente" style="cursor:pointer;" onclick="mostrarRelatorioCliente('${c.id}')">

          <div class="avatar">${iniciais(c.nome)}</div>

          <div class="info">
            <strong>${c.nome}</strong>
            <span>CPF/CNPJ: ${c.cpfCnpj}</span>
            <span>${c.os} · ${c.projeto}</span>
          </div>

        </div>

      `).join('');

  });

}


/* ============================================================
   MOSTRAR RELATÓRIO
   ============================================================ */

async function mostrarRelatorioCliente(id){

  const cliente = await DB.buscarClientePorId(id);

  if(!cliente){ return; }

  const perfil = await DB.obterPerfilAdmin();

  const progresso = DB.calcularProgresso(cliente.etapas);

  const area = document.getElementById('area-relatorio');

  area.innerHTML = `

    <div class="cartao">

      <div class="cabecalho-secao">
        <div>
          <h2>${cliente.nome}</h2>
          <p>CPF/CNPJ: ${cliente.cpfCnpj}</p>
        </div>
        <button class="botao botao-secundario nao-imprime" onclick="window.print()">
          Imprimir / Salvar PDF
        </button>
      </div>

      <p><strong>Cliente:</strong> ${cliente.nome}</p>
      <p><strong>CPF/CNPJ:</strong> ${cliente.cpfCnpj}</p>
      <p><strong>Ordem de Serviço:</strong> ${cliente.os}</p>
      <p><strong>Projeto:</strong> ${cliente.projeto}</p>
      <p><strong>Tipo:</strong> ${cliente.tipo}</p>
      <p><strong>Início:</strong> ${DB.formatarData(cliente.dataInicio)}</p>
      <p><strong>Prazo:</strong> ${DB.formatarData(cliente.prazo)}</p>
      <p><strong>Responsável:</strong> ${perfil.nome}</p>


      ${cliente.valorTotal ? `

        <h2 style="font-size:1rem; margin-top:20px;">Financeiro</h2>

        <div class="linha-campos" style="margin-bottom:6px;">

          <p style="font-size:.85rem; margin:4px 0;">
            <strong>Valor total:</strong> ${DB.formatarMoeda(cliente.valorTotal)}
          </p>

          <p style="font-size:.85rem; margin:4px 0;">
            <strong>Entrada (${cliente.percentualEntrada || 0}%):</strong> ${DB.formatarMoeda(cliente.valorSinal)}
          </p>

        </div>

        <div class="linha-campos">

          <p style="font-size:.85rem; margin:4px 0;">
            <strong>Valor pago:</strong> ${DB.formatarMoeda(
              cliente.statusPagamento === 'QUITADO'
                ? cliente.valorTotal
                : (cliente.statusPagamento === 'EM_ANDAMENTO' ? cliente.valorSinal : 0)
            )}
          </p>

          <p style="font-size:.85rem; margin:4px 0;">
            <strong>Falta pagar:</strong> ${DB.formatarMoeda(
              (cliente.valorTotal || 0) - (
                cliente.statusPagamento === 'QUITADO'
                  ? cliente.valorTotal
                  : (cliente.statusPagamento === 'EM_ANDAMENTO' ? cliente.valorSinal : 0)
              )
            )}
          </p>

        </div>

      ` : ''}

      <h2 style="font-size:1rem; margin-top:20px;">Progresso: ${progresso}%</h2>

      <div class="barra" style="margin-bottom:20px;">
        <div style="width:${progresso}%"></div>
      </div>

      <h2 style="font-size:1rem; margin-bottom:8px;">Etapas</h2>

      <div class="checklist" style="margin-bottom:18px;">

        ${cliente.etapas.map(et => `

          <div class="etapa ${et.concluida ? 'concluida' : ''}">
            <span class="numero">${et.concluida ? '✓' : ''}</span>
            <label>${et.nome}</label>
          </div>

        `).join('')}

      </div>

      <h2 style="font-size:1rem; margin-bottom:8px;">Histórico de execução</h2>

      <div class="linha-tempo">

        ${(!cliente.historico || cliente.historico.length === 0)
          ? '<p style="font-size:.85rem; color:var(--tinta-suave);">Nenhuma atualização registrada.</p>'
          : cliente.historico.map(h => `

            <div class="evento">
              <div class="data">${DB.formatarData(h.data)} — ${h.responsavel}</div>
              <ul>${h.itens.map(i => `<li>${i} concluída</li>`).join('')}</ul>
            </div>

          `).join('')
        }

      </div>

      <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--linha);">

        <span class="selo ${cliente.status === 'concluido' ? 'selo-concluido' : 'selo-andamento'}">
          ${cliente.status === 'concluido' ? 'STATUS: CONCLUÍDO' : 'STATUS: EM ANDAMENTO'}
        </span>

        ${cliente.dataConclusao ? `
          <p style="font-size:.85rem; margin-top:8px;">
            Projeto finalizado em: ${DB.formatarData(cliente.dataConclusao)}
          </p>
        ` : ''}

      </div>

    </div>

  `;

}