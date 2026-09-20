/* ============================================================
   LogicDev SYSTEM — AOS

   db.js — camada de dados usando Firebase
   Firestore + Auth

   ============================================================ */

const DB = {


  /* ==========================================================
     UTILIDADES
     ========================================================== */

  soNumeros(txt){
    return (txt || '').replace(/\D/g, '');
  },


  normalizarNome(txt){
    return (txt || '').trim().toLowerCase();
  },


  formatarData(dataISO){

    if(!dataISO) return '—';

    const partes = dataISO.split('-');

    if(partes.length !== 3){
      return dataISO;
    }

    const [ano, mes, dia] = partes;

    return `${dia}/${mes}/${ano}`;

  },


  hojeISO(){
    return new Date().toISOString().slice(0,10);
  },


  formatarMoeda(valor){

    const n = Number(valor) || 0;

    return n.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  },


  paraNumeroMoeda(texto){

    const limpo =
      (texto || '')
        .replace(/[^\d,]/g, '')
        .replace(',', '.');

    return parseFloat(limpo) || 0;

  },


  calcularProgresso(etapas){

    if(!etapas || etapas.length === 0){
      return 0;
    }

    const feitas =
      etapas.filter(e => e.concluida).length;

    return Math.round((feitas / etapas.length) * 100);

  },


  /* ==========================================================
     ADMIN
     ========================================================== */

  emailDoAdmin(cpf){
    return DB.soNumeros(cpf) + '@logicdev.app';
  },


  async autenticarAdmin(nome, cpf){

    try{

      const email = DB.emailDoAdmin(cpf);
      const senhaUsandoCpf = DB.soNumeros(cpf);

      await AUTH.signInWithEmailAndPassword(email, senhaUsandoCpf);

      return true;

    }

    catch(erro){
      console.warn('Falha no login do admin:', erro.code);
      return false;
    }

  },


  async obterPerfilAdmin(){

    const user = AUTH.currentUser;

    if(!user){
      return { nome: 'Administrador', cpf: '—' };
    }

    const doc =
      await FIRESTORE.collection('admins').doc(user.uid).get();

    return doc.exists
      ? doc.data()
      : { nome: 'Administrador', cpf: '—' };

  },


  async sairAdmin(){
    await AUTH.signOut();
  },


  usuarioEhAdmin(user){
    return !!user && !user.isAnonymous;
  },


  /* ==========================================================
     CLIENTES
     ========================================================== */

  async listarClientes(){

    const snap =
      await FIRESTORE
        .collection('clientes')
        .orderBy('criadoEm', 'desc')
        .get();

    return snap.docs.map(d => ({ id: d.id, ...d.data() }));

  },


  async buscarClientePorId(id){

    const doc =
      await FIRESTORE.collection('clientes').doc(id).get();

    return doc.exists
      ? { id: doc.id, ...doc.data() }
      : null;

  },


  /* ==========================================================
     LOGIN CLIENTE
     ========================================================== */

  async buscarClienteParaLogin(nome, cpfCnpj){

    if(!AUTH.currentUser){
      await AUTH.signInAnonymously();
    }

    const cpfBusca = DB.soNumeros(cpfCnpj);

    /*
      Login por CPF exato + nome parcial.

      O CPF continua sendo obrigatório e exato (é o
      identificador confiável). O nome pode ser digitado
      incompleto — só precisa "bater" como parte do nome
      completo cadastrado, pra facilitar pro cliente sem
      abrir mão de identificação segura via CPF.
    */

    const snap =
      await FIRESTORE
        .collection('clientes')
        .where('cpfBusca', '==', cpfBusca)
        .limit(1)
        .get();

    if(snap.empty){
      return null;
    }

    const doc = snap.docs[0];
    const dados = doc.data();

    const nomeDigitado = DB.normalizarNome(nome);

    const nomeConfere =
      nomeDigitado.length > 0 &&
      dados.nomeBusca &&
      dados.nomeBusca.includes(nomeDigitado);

    if(!nomeConfere){
      return null;
    }

    return { id: doc.id, ...dados };

  },


  /* ==========================================================
     PRÓXIMA ORDEM DE SERVIÇO
     ========================================================== */

  async proximoOS(){

    const clientes = await DB.listarClientes();

    const numeros =
      clientes.map(c =>
        parseInt((c.os || '').replace(/\D/g,''), 10) || 0
      );

    const max = numeros.length ? Math.max(...numeros) : 0;

    return 'OS-' + String(max + 1).padStart(4,'0');

  },


  /* ==========================================================
     CRIAR CLIENTE + PROJETO
     ========================================================== */

  async criarCliente(cliente){

    const os = await DB.proximoOS();

    const documento = {

      nome: cliente.nome || '',
      cpfCnpj: cliente.cpfCnpj || '',
      whatsapp: cliente.whatsapp || '',
      email: cliente.email || '',

      tipo: cliente.tipo || '',
      projeto: cliente.projeto || '',
      dataInicio: cliente.dataInicio || '',
      prazo: cliente.prazo || '',
      etapas: cliente.etapas || [],

      entrega: {
        tecnologias: (cliente.entrega && cliente.entrega.tecnologias) || [],
        dominio: (cliente.entrega && cliente.entrega.dominio) || '',
        hospedagem: (cliente.entrega && cliente.entrega.hospedagem) || ''
      },

      os: os,
      nomeBusca: DB.normalizarNome(cliente.nome),
      cpfBusca: DB.soNumeros(cliente.cpfCnpj),
      historico: [],
      status: 'em_andamento',
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()

    };

    const ref =
      await FIRESTORE.collection('clientes').add(documento);

    return { id: ref.id, ...documento };

  },


  async atualizarCliente(clienteId, dados){

    const atualizacao = {

      nome: dados.nome || '',
      cpfCnpj: dados.cpfCnpj || '',
      whatsapp: dados.whatsapp || '',
      email: dados.email || '',
      tipo: dados.tipo || '',
      projeto: dados.projeto || '',
      dataInicio: dados.dataInicio || '',
      prazo: dados.prazo || '',

      nomeBusca: DB.normalizarNome(dados.nome),
      cpfBusca: DB.soNumeros(dados.cpfCnpj),

      entrega: {
        tecnologias: dados.tecnologias || [],
        dominio: dados.dominio || '',
        hospedagem: dados.hospedagem || ''
      }

    };

    await FIRESTORE
      .collection('clientes')
      .doc(clienteId)
      .update(atualizacao);

    return atualizacao;

  },


  /* ==========================================================
     ATUALIZAR ETAPAS
     ========================================================== */

  async atualizarEtapas(clienteId, novasEtapas, responsavel){

    const ref =
      FIRESTORE.collection('clientes').doc(clienteId);

    const doc = await ref.get();

    if(!doc.exists){
      return null;
    }

    const cliente = doc.data();

    const concluidasAgora = [];

    novasEtapas.forEach((novaEtapa, i) => {

      const antes = cliente.etapas && cliente.etapas[i];

      if(novaEtapa.concluida && (!antes || !antes.concluida)){
        concluidasAgora.push(novaEtapa.nome);
      }

    });

    const historico = cliente.historico || [];

    if(concluidasAgora.length > 0){

      historico.push({
        data: DB.hojeISO(),
        responsavel: responsavel || 'Administrador',
        itens: concluidasAgora
      });

    }

    const progresso = DB.calcularProgresso(novasEtapas);

    const atualizacao = {
      etapas: novasEtapas,
      historico: historico,
      status: progresso === 100 ? 'concluido' : 'em_andamento'
    };

    if(progresso === 100 && !cliente.dataConclusao){
      atualizacao.dataConclusao = DB.hojeISO();
    }

    await ref.update(atualizacao);

    return { id: clienteId, ...cliente, ...atualizacao };

  },


  /* ==========================================================
     PRÉ-CADASTRO (formulário público)
     ========================================================== */

  async salvarPreCadastro(dados){

    if(!AUTH.currentUser){
      await AUTH.signInAnonymously();
    }

    const documento = {

      nome: dados.nome || '',
      cpfCnpj: dados.doc || '',
      whatsapp: dados.whatsapp || '',
      email: dados.email || '',
      nomeBusca: DB.normalizarNome(dados.nome),
      cpfBusca: DB.soNumeros(dados.doc),
      status: 'pendente',
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()

    };

    const ref =
      await FIRESTORE.collection('precadastros').add(documento);

    return { id: ref.id, ...documento };

  },


  async listarPreCadastros(){

    const snap =
      await FIRESTORE
        .collection('precadastros')
        .where('status', '==', 'pendente')
        .orderBy('criadoEm', 'desc')
        .get();

    return snap.docs.map(d => ({ id: d.id, ...d.data() }));

  },


  async buscarPreCadastroPorId(id){

    const doc =
      await FIRESTORE.collection('precadastros').doc(id).get();

    return doc.exists
      ? { id: doc.id, ...doc.data() }
      : null;

  },


  async concluirPreCadastro(id){

    await FIRESTORE
      .collection('precadastros')
      .doc(id)
      .update({ status: 'concluido' });

  },


  /* ==========================================================
     PROPOSTA / FINANCEIRO
     ========================================================== */

  calcularSinalESaldo(valorTotal, percentualEntrada){

    const total = Number(valorTotal) || 0;
    const percentual = Number(percentualEntrada) || 0;

    const sinal = (total * percentual) / 100;
    const saldo = total - sinal;

    return { sinal, saldo };

  },


  async salvarDadosFinanceiros(clienteId, dados){

    const { sinal, saldo } =
      DB.calcularSinalESaldo(
        dados.valorTotal,
        dados.percentualEntrada
      );

    const atualizacao = {

      valorTotal: Number(dados.valorTotal) || 0,
      percentualEntrada: Number(dados.percentualEntrada) || 0,
      chavePix: dados.chavePix || '',
      escopo: dados.escopo || '',
      valorSinal: sinal,
      saldoRestante: saldo

    };

    await FIRESTORE
      .collection('clientes')
      .doc(clienteId)
      .update(atualizacao);

    return atualizacao;

  },


  async confirmarAceiteProposta(clienteId){

    await FIRESTORE
      .collection('clientes')
      .doc(clienteId)
      .update({ statusPagamento: 'AGUARDANDO_CONFIRMACAO_ADMIN' });

  },


  async confirmarPagamentoSinal(clienteId){

    await FIRESTORE
      .collection('clientes')
      .doc(clienteId)
      .update({ statusPagamento: 'EM_ANDAMENTO' });

  },


  async confirmarPagamentoFinal(clienteId){

    await FIRESTORE
      .collection('clientes')
      .doc(clienteId)
      .update({ statusPagamento: 'QUITADO' });

  },


  /* ==========================================================
     CONTRATO / ASSINATURA DIGITAL
     ========================================================== */

  async salvarAssinaturaContrato(clienteId, imagemBase64){

    await FIRESTORE
      .collection('clientes')
      .doc(clienteId)
      .update({
        assinaturaContrato: imagemBase64,
        dataAssinaturaContrato: DB.hojeISO()
      });

  },


  /* ==========================================================
     ASSINATURA DA PRESTADORA (fixa, salva uma vez, usada
     em todos os contratos)
     ========================================================== */

  async salvarAssinaturaPrestadora(imagemBase64){

    await FIRESTORE
      .collection('configuracoes')
      .doc('prestadora')
      .set({
        assinatura: imagemBase64,
        atualizadoEm: DB.hojeISO()
      }, { merge: true });

  },


  async buscarAssinaturaPrestadora(){

    const doc =
      await FIRESTORE
        .collection('configuracoes')
        .doc('prestadora')
        .get();

    return doc.exists ? (doc.data().assinatura || null) : null;

  },


  /* ==========================================================
     AVISO PERSONALIZADO (substitui o alert() do navegador)
     ========================================================== */

  mostrarAviso(mensagem){

    const overlay = document.createElement('div');
    overlay.className = 'aviso-overlay';

    overlay.innerHTML = `
      <div class="aviso-caixa">
        <p>${mensagem}</p>
        <button class="botao botao-primario botao-bloco" id="aviso-ok-btn">OK</button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('aviso-ok-btn').addEventListener('click', () => {
      overlay.remove();
    });

  },


  /* ==========================================================
     LINK DO WHATSAPP
     ========================================================== */

  linkWhatsApp(numeroWhats, mensagem){

    const digitos = DB.soNumeros(numeroWhats);

    const comDDI =
      digitos.startsWith('55') ? digitos : '55' + digitos;

    return `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`;

  },


  /* ==========================================================
     PIX — GERAÇÃO DO CÓDIGO "COPIA E COLA" (BR Code / EMV)
     ========================================================== */

  _crc16Pix(payload){

    let crc = 0xFFFF;

    for(let i = 0; i < payload.length; i++){

      crc ^= payload.charCodeAt(i) << 8;

      for(let j = 0; j < 8; j++){

        if((crc & 0x8000) !== 0){
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }

      }

    }

    return crc.toString(16).toUpperCase().padStart(4, '0');

  },


  _campoPix(id, valor){

    const tamanho = String(valor.length).padStart(2, '0');

    return `${id}${tamanho}${valor}`;

  },


  gerarPayloadPix({ chave, nome, cidade, valor, txid }){

    const nomeLimpo =
      (nome || 'LOGICDEV SYSTEM').substring(0, 25).toUpperCase();

    const cidadeLimpo =
      (cidade || 'ARACAJU').substring(0, 15).toUpperCase();

    const txidLimpo =
      (txid || '***').substring(0, 25);

    const merchantAccount =
      DB._campoPix('26',
        DB._campoPix('00', 'br.gov.bcb.pix') +
        DB._campoPix('01', chave)
      );

    let valorCampo = '';

    if(valor && Number(valor) > 0){
      valorCampo = DB._campoPix('54', Number(valor).toFixed(2));
    }

    const addData =
      DB._campoPix('62', DB._campoPix('05', txidLimpo));

    const semCrc =
      DB._campoPix('00', '01') +
      merchantAccount +
      DB._campoPix('52', '0000') +
      DB._campoPix('53', '986') +
      valorCampo +
      DB._campoPix('58', 'BR') +
      DB._campoPix('59', nomeLimpo) +
      DB._campoPix('60', cidadeLimpo) +
      addData +
      '6304';

    return semCrc + DB._crc16Pix(semCrc);

  },


  linkQrCodePix(payload){

    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(payload)}`;

  }


};