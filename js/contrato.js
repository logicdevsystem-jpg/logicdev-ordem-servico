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

  const area = document.getElementById('area-contrato');

  if(!id){
    area.innerHTML = '<div class="cartao"><p>Link inválido.</p></div>';
    return;
  }

  if(!AUTH.currentUser){
    await AUTH.signInAnonymously();
  }

  const cliente = await DB.buscarClientePorId(id);

  if(!cliente){
    area.innerHTML = '<div class="cartao"><p>Contrato não encontrado. Fale com a LogicDev.</p></div>';
    return;
  }

  const jaAssinado = !!cliente.assinaturaContrato;

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

    </div>


    ${jaAssinado ? `

      <div class="cartao" style="text-align:center;">

        <h2>Contrato assinado</h2>

        <p style="color:var(--tinta-suave); font-size:.88rem;">
          Assinado digitalmente em ${DB.formatarData(cliente.dataAssinaturaContrato)}
        </p>

        <img
          src="${cliente.assinaturaContrato}"
          alt="Assinatura do cliente"
          style="max-width:280px; border:1px solid var(--linha); border-radius:8px; margin:10px 0;"
        >

        <br>

        <button class="botao botao-secundario nao-imprime" onclick="window.print()">
          Imprimir / Salvar PDF
        </button>

      </div>

    ` : `

      <div class="cartao">

        <h2 style="font-size:1rem;">Assinatura digital</h2>

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


  if(!jaAssinado){
    configurarAssinatura(cliente.id);
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