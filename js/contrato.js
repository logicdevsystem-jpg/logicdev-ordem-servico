/* ============================================================
   LogicDev SYSTEM — AOS
   contrato.js — contrato preenchido automaticamente + assinatura
   ============================================================ */


/* ============================================================
   DADOS FIXOS DA PRESTADORA

   Ajuste esses valores uma vez com os dados reais da sua
   empresa/CNPJ — eles entram automaticamente em todo contrato
   gerado.
   ============================================================ */

const DADOS_PRESTADORA = {

  nome: 'LOGIC DEV SYSTEM',
  cnpjCpf: 'A PREENCHER',
  endereco: 'A PREENCHER',
  responsavel: 'A PREENCHER',

  qtdRevisoes: 3,
  diasGarantia: 30,
  diasDesconformidade: 7

};


async function renderizarContrato(){

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const veioDoAdmin = params.get('from') === 'admin';

  const area = document.getElementById('area-contrato');

  if(!id){
    area.innerHTML = '<div class="cartao"><p>Link inválido.</p></div>';
    return;
  }

  try{

  if(!AUTH.currentUser){
    await AUTH.signInAnonymously();
  }

  const cliente = await DB.buscarClientePorId(id);

  if(!cliente){
    area.innerHTML = '<div class="cartao"><p>Contrato não encontrado. Fale com a LogicDev.</p></div>';
    return;
  }

  const jaAssinado = !!cliente.assinaturaContrato;

  /*
    Quem decide se mostra o painel de admin (quadro de
    assinatura da prestadora) é a URL (&from=admin), não a
    sessão do Firebase — a sessão pode "escorregar" pra
    anônima se você testar como cliente na mesma aba, então
    não é confiável pra essa decisão. A segurança de verdade
    continua sendo a Regra do Firestore: mesmo que alguém
    force ?from=admin na URL, só quem estiver realmente
    logado como admin consegue SALVAR a assinatura — a regra
    do configuracoes barra qualquer outro.
  */

  const souAdmin = veioDoAdmin;

  /*
    Isso aqui é a checagem de segurança real: mesmo vindo do
    link do admin (?from=admin), só libera o quadro de assinar
    se a sessão do Firebase realmente estiver logada como
    admin nesse exato momento. Se não estiver (sessão caiu
    pra anônima, ou nunca foi feito login), mostra um aviso
    claro em vez de um quadro que ia falhar ao salvar.
  */

  const sessaoAdminValida =
    veioDoAdmin && AUTH.currentUser && !AUTH.currentUser.isAnonymous;


  /*
    Ajusta o link "Voltar" conforme quem está vendo —
    admin volta pro dashboard do admin, cliente pro dele.
  */

  const linkVoltar = document.getElementById('link-voltar');

  if(linkVoltar){
    linkVoltar.href = veioDoAdmin ? '../admin/dashboard.html' : 'dashboard.html';
  }


  const assinaturaPrestadora =
    await DB.buscarAssinaturaPrestadora();

  const { sinal, saldo } =
    DB.calcularSinalESaldo(cliente.valorTotal, cliente.percentualEntrada);

  const hoje = DB.formatarData(DB.hojeISO());


  area.innerHTML = `

    <div class="cartao" id="documento-contrato">

      <h2 style="text-align:center;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DESENVOLVIMENTO DIGITAL</h2>
      <p style="text-align:center; font-weight:600;">${DADOS_PRESTADORA.nome}</p>

      <h3>1. IDENTIFICAÇÃO DAS PARTES</h3>

      <p>
        <strong>PRESTADORA:</strong> ${DADOS_PRESTADORA.nome}, inscrita sob CNPJ/CPF nº ${DADOS_PRESTADORA.cnpjCpf},
        com endereço em ${DADOS_PRESTADORA.endereco}, neste ato representada por ${DADOS_PRESTADORA.responsavel}.
      </p>

      <p>
        <strong>CONTRATANTE:</strong> ${cliente.nome}, CPF/CNPJ nº ${cliente.cpfCnpj},
        telefone/WhatsApp ${cliente.whatsapp || '—'}, e-mail ${cliente.email || '—'}.
      </p>

      <h3>2. OBJETO DO CONTRATO</h3>

      <p>
        O presente contrato tem por objeto a prestação, pela ${DADOS_PRESTADORA.nome}, de serviços de
        desenvolvimento digital do tipo <strong>${cliente.tipo || 'a definir'}</strong>, projeto
        <strong>"${cliente.projeto || 'a definir'}"</strong>, conforme escopo aprovado abaixo. Somente os itens
        expressamente descritos no escopo fazem parte do preço contratado.
      </p>

      <h3>3. ESCOPO DO PROJETO</h3>

      <p>${cliente.escopo || 'Escopo conforme combinado com o cliente.'}</p>

      <p><strong>Ordem de Serviço:</strong> ${cliente.os}</p>
      <p><strong>Data de início:</strong> ${DB.formatarData(cliente.dataInicio)}</p>
      <p><strong>Prazo estimado:</strong> ${DB.formatarData(cliente.prazo)}</p>

      <h3>4. REVISÕES E ALTERAÇÕES</h3>

      <p>
        O projeto terá direito a até ${DADOS_PRESTADORA.qtdRevisoes} rodadas de revisão, limitadas aos itens e
        conceito previstos no escopo aprovado. Alterações que ultrapassem o escopo ou modifiquem substancialmente
        o conceito do projeto serão tratadas como serviço adicional, orçado separadamente.
      </p>

      <h3>5. VALOR E FORMA DE PAGAMENTO</h3>

      <p><strong>Valor total do projeto:</strong> ${DB.formatarMoeda(cliente.valorTotal)}</p>
      <p><strong>Entrada (${cliente.percentualEntrada || 0}%):</strong> ${DB.formatarMoeda(sinal)}</p>
      <p><strong>Saldo restante (quitado nesta assinatura):</strong> ${DB.formatarMoeda(saldo)}</p>

      <h3>6. GARANTIA</h3>

      <p>
        Após a entrega, correções de erros diretamente atribuíveis ao código desenvolvido poderão ser realizadas
        durante o período de garantia de ${DADOS_PRESTADORA.diasGarantia} dias, desde que o problema esteja
        relacionado ao escopo entregue. O CONTRATANTE terá ${DADOS_PRESTADORA.diasDesconformidade} dias corridos
        após a entrega final para comunicar desconformidades objetivas em relação ao escopo contratado.
      </p>

      <h3>7. PROPRIEDADE INTELECTUAL</h3>

      <p>
        Após a quitação integral do valor contratado, o CONTRATANTE terá os direitos de uso do material final
        desenvolvido especificamente para seu projeto. Bibliotecas, frameworks e recursos de uso geral não se
        tornam propriedade exclusiva do CONTRATANTE.
      </p>

      <h3>8. DISPOSIÇÕES GERAIS</h3>

      <p>
        Este contrato representa o entendimento entre as partes sobre o serviço contratado, complementado pelo
        escopo acima. As partes elegem o foro competente conforme a legislação aplicável, respeitados os direitos
        do consumidor quando aplicável.
      </p>

      <p style="margin-top:20px;">
        Documento gerado eletronicamente em ${hoje}.
      </p>

      <h3>ASSINATURAS</h3>

      <div class="linha-campos">

        <div style="text-align:center;">

          ${assinaturaPrestadora ? `
            <img
              src="${assinaturaPrestadora}"
              alt="Assinatura da prestadora"
              style="max-width:220px; max-height:110px; margin-bottom:6px;"
            >
          ` : `
            <p style="font-size:.8rem; color:var(--tinta-suave); padding:30px 0;">
              (aguardando assinatura)
            </p>
          `}

          <p style="border-top:1px solid var(--linha); padding-top:6px; font-size:.8rem;">
            <strong>${DADOS_PRESTADORA.nome}</strong><br>
            PRESTADORA
          </p>

        </div>

        <div style="text-align:center;">

          ${jaAssinado ? `
            <img
              src="${cliente.assinaturaContrato}"
              alt="Assinatura do cliente"
              style="max-width:220px; max-height:110px; margin-bottom:6px;"
            >
          ` : `
            <p style="font-size:.8rem; color:var(--tinta-suave); padding:30px 0;">
              (aguardando assinatura)
            </p>
          `}

          <p style="border-top:1px solid var(--linha); padding-top:6px; font-size:.8rem;">
            <strong>${cliente.nome}</strong><br>
            CONTRATANTE
          </p>

        </div>

      </div>

    </div>


    ${souAdmin ? `

      <!-- ================= PAINEL DO ADMIN ================= -->

      ${!sessaoAdminValida ? `

        <div class="cartao" style="text-align:center;">

          <span class="selo selo-andamento">Sessão expirada</span>

          <h2 style="margin-top:10px;">Faça login de novo como administrador</h2>

          <p style="color:var(--tinta-suave); font-size:.88rem;">
            Sua sessão de admin não está mais ativa nesse navegador
            (geralmente porque a tela de cliente foi acessada nessa mesma
            aba). Faça login de novo para poder assinar como Prestadora.
          </p>

          <a href="../admin/index.html" class="botao botao-primario" style="margin-top:10px;">
            Ir para o login do admin
          </a>

        </div>

      ` : `

      <div class="cartao">

        <h2 style="font-size:1rem;">Sua assinatura (Prestadora)</h2>

        <p style="font-size:.85rem; color:var(--tinta-suave);">
          ${assinaturaPrestadora
            ? 'Já existe uma assinatura salva. Assine de novo abaixo se quiser substituí-la.'
            : 'Assine uma vez aqui — essa assinatura passa a valer para todos os contratos automaticamente.'}
        </p>

        <canvas
          id="canvas-assinatura-prestadora"
          width="600"
          height="220"
          style="
            border:1px solid var(--linha);
            border-radius:8px;
            width:100%;
            max-width:600px;
            touch-action:none;
            background:#fff;
            display:block;
          "
        ></canvas>

        <div style="display:flex; gap:10px; margin-top:12px;">

          <button type="button" class="botao botao-secundario" id="btn-limpar-assinatura-prestadora">
            Limpar
          </button>

          <button type="button" class="botao botao-primario" id="btn-salvar-assinatura-prestadora">
            ${assinaturaPrestadora ? 'Atualizar Assinatura' : 'Salvar Assinatura'}
          </button>

        </div>

      </div>

      `}


      <div class="cartao" style="text-align:center;">

        ${jaAssinado ? `
          <span class="selo selo-concluido">Assinado</span>
          <h2 style="margin-top:10px;">Contrato assinado pelo cliente</h2>
          <p style="color:var(--tinta-suave); font-size:.88rem;">
            Em ${DB.formatarData(cliente.dataAssinaturaContrato)}
          </p>
          <button class="botao botao-secundario nao-imprime" onclick="window.print()">
            Imprimir / Salvar PDF
          </button>
        ` : `
          <span class="selo selo-andamento">Pendente</span>
          <h2 style="margin-top:10px;">Aguardando assinatura do cliente</h2>
          <p style="color:var(--tinta-suave); font-size:.88rem;">
            Esse é um preview — a assinatura do cliente só pode ser feita por ele,
            pelo link enviado.
          </p>
        `}

      </div>

    ` : jaAssinado ? `

      <div class="cartao" style="text-align:center;">

        <h2>Contrato assinado</h2>

        <p style="color:var(--tinta-suave); font-size:.88rem;">
          Assinado digitalmente em ${DB.formatarData(cliente.dataAssinaturaContrato)}
        </p>

        <button class="botao botao-secundario nao-imprime" onclick="window.print()">
          Imprimir / Salvar PDF
        </button>

      </div>

    ` : `

      <div class="cartao">

        <h2 style="font-size:1rem;">Assinatura digital — parte do CONTRATANTE</h2>

        <p style="font-size:.85rem; color:var(--tinta-suave);">
          Assine com o dedo (celular/tablet) ou com o mouse, no quadro abaixo.
        </p>

        <canvas
          id="canvas-assinatura"
          width="600"
          height="220"
          style="
            border:1px solid var(--linha);
            border-radius:8px;
            width:100%;
            max-width:600px;
            touch-action:none;
            background:#fff;
            display:block;
          "
        ></canvas>

        <div style="display:flex; gap:10px; margin-top:12px;">

          <button type="button" class="botao botao-secundario" id="btn-limpar-assinatura">
            Limpar
          </button>

          <button type="button" class="botao botao-primario" id="btn-confirmar-assinatura">
            Confirmar Assinatura
          </button>

        </div>

      </div>

    `}

  `;


  if(souAdmin){
    configurarAssinaturaPrestadora();
  }

  else if(!jaAssinado){
    configurarAssinatura(cliente.id);
  }

  }

  catch(erro){

    console.error('Erro ao carregar contrato:', erro);

    area.innerHTML = `
      <div class="cartao">
        <p><strong>Não foi possível carregar o contrato.</strong></p>
        <p style="font-size:.85rem; color:var(--tinta-suave);">
          Código do erro: ${erro.code || erro.message || 'desconhecido'}
        </p>
      </div>
    `;

  }

}


/* ============================================================
   QUADRO DE ASSINATURA
   ============================================================ */

function configurarAssinatura(clienteId){

  const canvas = document.getElementById('canvas-assinatura');
  const ctx = canvas.getContext('2d');

  let desenhando = false;

  ctx.strokeStyle = '#1e1b2e';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';


  function posicao(e){

    const rect = canvas.getBoundingClientRect();

    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * escalaX,
      y: (clientY - rect.top) * escalaY
    };

  }


  function iniciar(e){
    desenhando = true;
    const p = posicao(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function desenhar(e){

    if(!desenhando){ return; }

    e.preventDefault();

    const p = posicao(e);

    ctx.lineTo(p.x, p.y);
    ctx.stroke();

  }

  function parar(){
    desenhando = false;
  }


  canvas.addEventListener('mousedown', iniciar);
  canvas.addEventListener('mousemove', desenhar);
  canvas.addEventListener('mouseup', parar);
  canvas.addEventListener('mouseleave', parar);

  canvas.addEventListener('touchstart', iniciar);
  canvas.addEventListener('touchmove', desenhar);
  canvas.addEventListener('touchend', parar);


  document.getElementById('btn-limpar-assinatura')
    .addEventListener('click', function(){
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });


  document.getElementById('btn-confirmar-assinatura')
    .addEventListener('click', async function(){

      if(canvasVazio(canvas)){
        DB.mostrarAviso('Faça sua assinatura no quadro antes de confirmar.');
        return;
      }

      if(!confirm('Confirma que esta é sua assinatura e que você concorda com os termos do contrato acima?')){
        return;
      }

      this.disabled = true;
      this.textContent = 'Enviando...';

      try{

        const imagemBase64 = canvas.toDataURL('image/png');

        await DB.salvarAssinaturaContrato(clienteId, imagemBase64);

        await renderizarContrato();

      }

      catch(erro){

        console.error('Erro ao salvar assinatura:', erro);
        DB.mostrarAviso('Não foi possível salvar a assinatura. Tente novamente.');

        this.disabled = false;
        this.textContent = 'Confirmar Assinatura';

      }

    });

}


/* ============================================================
   QUADRO DE ASSINATURA — PRESTADORA (admin)
   ============================================================ */

function configurarAssinaturaPrestadora(){

  const canvas = document.getElementById('canvas-assinatura-prestadora');
  const ctx = canvas.getContext('2d');

  let desenhando = false;

  ctx.strokeStyle = '#1e1b2e';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';


  function posicao(e){

    const rect = canvas.getBoundingClientRect();

    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * escalaX,
      y: (clientY - rect.top) * escalaY
    };

  }


  function iniciar(e){
    desenhando = true;
    const p = posicao(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function desenhar(e){

    if(!desenhando){ return; }

    e.preventDefault();

    const p = posicao(e);

    ctx.lineTo(p.x, p.y);
    ctx.stroke();

  }

  function parar(){
    desenhando = false;
  }


  canvas.addEventListener('mousedown', iniciar);
  canvas.addEventListener('mousemove', desenhar);
  canvas.addEventListener('mouseup', parar);
  canvas.addEventListener('mouseleave', parar);

  canvas.addEventListener('touchstart', iniciar);
  canvas.addEventListener('touchmove', desenhar);
  canvas.addEventListener('touchend', parar);


  document.getElementById('btn-limpar-assinatura-prestadora')
    .addEventListener('click', function(){
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });


  document.getElementById('btn-salvar-assinatura-prestadora')
    .addEventListener('click', async function(){

      if(canvasVazio(canvas)){
        DB.mostrarAviso('Desenhe sua assinatura no quadro antes de salvar.');
        return;
      }

      /*
        Confere a sessão de novo, na hora do clique — pode ter
        mudado desde que a página carregou (ex: testou a tela
        de cliente em outra aba nesse meio tempo).
      */

      if(!AUTH.currentUser || AUTH.currentUser.isAnonymous){

        DB.mostrarAviso(
          'Sua sessão de admin caiu. Feche essa aba, faça login de novo em ' +
          '../admin/index.html e abra o contrato novamente pelo botão "Ver Contrato".'
        );

        return;

      }

      this.disabled = true;
      this.textContent = 'Salvando...';

      try{

        const imagemBase64 = canvas.toDataURL('image/png');

        await DB.salvarAssinaturaPrestadora(imagemBase64);

        DB.mostrarAviso('Assinatura da prestadora salva. Vale para todos os contratos.');

        await renderizarContrato();

      }

      catch(erro){

        console.error('Erro ao salvar assinatura da prestadora:', erro);

        DB.mostrarAviso(
          'Não foi possível salvar. Código do erro: ' +
          (erro.code || erro.message || 'desconhecido')
        );

        this.disabled = false;
        this.textContent = 'Salvar Assinatura';

      }

    });

}


function canvasVazio(canvas){

  const ctx = canvas.getContext('2d');
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  for(let i = 3; i < pixels.length; i += 4){
    if(pixels[i] !== 0){
      return false;
    }
  }

  return true;

}