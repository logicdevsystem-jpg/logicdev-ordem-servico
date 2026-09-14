/* ============================================================
   LogicDev SYSTEM — AOS
   proposta.js — tela de proposta e PIX para o cliente
   ============================================================ */


async function renderizarProposta(){

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const area = document.getElementById('area-proposta');

  if(!id){
    area.innerHTML =
      '<div class="cartao"><p>Link inválido. Fale com a LogicDev para receber um novo link.</p></div>';
    return;
  }

  /*
    Precisa de uma sessão autenticada (mesmo anônima) para
    ler o documento, já que as regras exigem request.auth != null
    para leitura de clientes.
  */

  if(!AUTH.currentUser){
    await AUTH.signInAnonymously();
  }

  const cliente = await DB.buscarClientePorId(id);

  if(!cliente){
    area.innerHTML =
      '<div class="cartao"><p>Proposta não encontrada. Fale com a LogicDev.</p></div>';
    return;
  }


  /* Já aceitou antes — mostra status em vez do formulário de aceite */

  if(cliente.statusPagamento === 'AGUARDANDO_CONFIRMACAO_ADMIN'){

    area.innerHTML = `

      <div class="cartao" style="text-align:center;">

        <h2>Aguardando confirmação</h2>

        <p style="color:var(--tinta-suave); font-size:.9rem;">
          Recebemos sua confirmação de pagamento do sinal.
          Assim que o administrador confirmar o recebimento,
          você poderá acompanhar o andamento do seu projeto normalmente.
        </p>

      </div>

    `;

    return;

  }

  if(
    cliente.statusPagamento === 'EM_ANDAMENTO' ||
    cliente.statusPagamento === 'QUITADO'
  ){

    area.innerHTML = `

      <div class="cartao" style="text-align:center;">

        <h2>Proposta já confirmada</h2>

        <p style="color:var(--tinta-suave); font-size:.9rem;">
          Sua proposta já foi aceita e o pagamento do sinal confirmado.
        </p>

        <a href="index.html" class="botao botao-primario" style="margin-top:14px;">
          Acessar meu painel
        </a>

      </div>

    `;

    return;

  }


  /* PROPOSTA PENDENTE — mostra formulário de aceite */

  const valorTotal = cliente.valorTotal || 0;
  const percentual = cliente.percentualEntrada || 0;

  const { sinal, saldo } =
    DB.calcularSinalESaldo(valorTotal, percentual);

  area.innerHTML = `

    <div class="cartao">

      <h2>Proposta de Serviço</h2>

      <p style="color:var(--tinta-suave); font-size:.9rem; margin-top:0;">
        ${cliente.nome} · CPF/CNPJ: ${cliente.cpfCnpj}
      </p>

      <h3 style="font-size:.95rem; margin:18px 0 6px;">Escopo do serviço</h3>

      <p style="font-size:.88rem; color:var(--tinta-suave);">
        ${cliente.escopo || cliente.projeto || 'A definir com o administrador.'}
      </p>

      <hr style="border:none; border-top:1px solid var(--linha); margin:18px 0;">

      <div class="linha-campos">

        <div>
          <label style="margin-top:0;">Valor total</label>
          <p style="font-weight:700; font-size:1.1rem; margin:0;">
            ${DB.formatarMoeda(valorTotal)}
          </p>
        </div>

        <div>
          <label style="margin-top:0;">Entrada (${percentual}%)</label>
          <p style="font-weight:700; font-size:1.1rem; color:var(--primaria); margin:0;">
            ${DB.formatarMoeda(sinal)}
          </p>
        </div>

      </div>

      <label style="margin-top:14px;">Saldo restante (na entrega)</label>
      <p style="font-weight:600; margin:0;">${DB.formatarMoeda(saldo)}</p>

      <hr style="border:none; border-top:1px solid var(--linha); margin:18px 0;">

      <label style="margin-top:0;">Pagar com PIX (${DB.formatarMoeda(sinal)})</label>

      <p style="font-size:.8rem; color:var(--tinta-suave); margin-top:0;">
        Escaneie o QR Code no app do seu banco, ou copie o código abaixo
        e cole na opção "Pix Copia e Cola".
      </p>

      ${cliente.chavePix ? `
        <div style="display:flex; justify-content:center; margin:14px 0;">
          <img src="${DB.linkQrCodePix(DB.gerarPayloadPix({ chave: cliente.chavePix, nome: 'LogicDev System', cidade: 'Aracaju', valor: sinal, txid: cliente.os }))}" alt="QR Code PIX" style="border:1px solid var(--linha); border-radius:var(--raio); padding:8px;">
        </div>

        <div style="display:flex; gap:8px;">
          <input type="text" id="campo-pix" value="${DB.gerarPayloadPix({ chave: cliente.chavePix, nome: 'LogicDev System', cidade: 'Aracaju', valor: sinal, txid: cliente.os })}" readonly style="flex:1; font-size:.75rem;">
          <button type="button" class="botao botao-secundario" id="btn-copiar-pix">Copiar</button>
        </div>
      ` : `
        <p style="font-size:.85rem; color:var(--tinta-suave);">
          A chave PIX ainda não foi configurada. Fale com a LogicDev.
        </p>
      `}

      <div
        style="
          margin-top:18px;
          padding:14px;
          background:var(--fundo);
          border-radius:var(--raio);
          font-size:.8rem;
          color:var(--tinta-suave);
        "
      >

        <strong style="color:var(--tinta); display:block; margin-bottom:6px;">
          Condições
        </strong>

        O início do desenvolvimento ocorre após a confirmação do pagamento
        da entrada. O saldo restante é quitado na entrega do projeto.
        Alterações de escopo fora do combinado podem gerar custo adicional.
        Prazos seguem o que foi definido no cadastro do projeto.

      </div>

      <button
        type="button"
        class="botao botao-primario botao-bloco"
        id="btn-confirmar-aceite"
        style="margin-top:20px;"
      >
        Já fiz o pagamento — Confirmar Aceite
      </button>

    </div>

  `;


  const btnCopiarPix = document.getElementById('btn-copiar-pix');

  if(btnCopiarPix){

    btnCopiarPix.addEventListener('click', function(){

      const campo = document.getElementById('campo-pix');

      campo.select();

      navigator.clipboard.writeText(campo.value)
        .then(() => { DB.mostrarAviso('Código PIX copiado! Cole no app do seu banco.'); })
        .catch(() => { DB.mostrarAviso('Não foi possível copiar automaticamente. Copie manualmente.'); });

    });

  }


  const btnConfirmar = document.getElementById('btn-confirmar-aceite');

  btnConfirmar.addEventListener('click', async function(){

    if(!confirm('Confirma que já realizou o pagamento do sinal via PIX?')){
      return;
    }

    this.disabled = true;
    this.textContent = 'Enviando...';

    try{

      await DB.confirmarAceiteProposta(cliente.id);

      await renderizarProposta();

    }

    catch(erro){

      console.error('Erro ao confirmar aceite:', erro);

      DB.mostrarAviso('Não foi possível confirmar. Tente novamente.');

      this.disabled = false;
      this.textContent = 'Já fiz o pagamento — Confirmar Aceite';

    }

  });

}