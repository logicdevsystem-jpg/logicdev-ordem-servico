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

    return (txt || '')
      .replace(/\D/g, '');

  },


  normalizarNome(txt){

    return (txt || '')
      .trim()
      .toLowerCase();

  },


  formatarData(dataISO){

    if(!dataISO) return '—';

    const partes =
      dataISO.split('-');

    if(partes.length !== 3){
      return dataISO;
    }

    const [
      ano,
      mes,
      dia
    ] = partes;

    return `${dia}/${mes}/${ano}`;

  },


  hojeISO(){

    return new Date()
      .toISOString()
      .slice(0,10);

  },


  calcularProgresso(etapas){

    if(
      !etapas ||
      etapas.length === 0
    ){

      return 0;

    }


    const feitas =
      etapas.filter(
        e => e.concluida
      ).length;


    return Math.round(
      (feitas / etapas.length) * 100
    );

  },


  /* ==========================================================
     ADMIN
     ========================================================== */

  emailDoAdmin(cpf){

    return (
      DB.soNumeros(cpf)
      + '@logicdev.app'
    );

  },


  async autenticarAdmin(nome, cpf){

    try{

      const email =
        DB.emailDoAdmin(cpf);


      const senhaUsandoCpf =
        DB.soNumeros(cpf);


      await AUTH
        .signInWithEmailAndPassword(
          email,
          senhaUsandoCpf
        );


      return true;

    }

    catch(erro){

      console.warn(
        'Falha no login do admin:',
        erro.code
      );


      return false;

    }

  },


  async obterPerfilAdmin(){

    const user =
      AUTH.currentUser;


    if(!user){

      return {
        nome: 'Administrador',
        cpf: '—'
      };

    }


    const doc =
      await FIRESTORE
        .collection('admins')
        .doc(user.uid)
        .get();


    return doc.exists

      ? doc.data()

      : {
          nome: 'Administrador',
          cpf: '—'
        };

  },


  async sairAdmin(){

    await AUTH.signOut();

  },


  usuarioEhAdmin(user){

    return !!user &&
      !user.isAnonymous;

  },


  /* ==========================================================
     CLIENTES
     ========================================================== */

  async listarClientes(){

    const snap =
      await FIRESTORE
        .collection('clientes')
        .orderBy(
          'criadoEm',
          'desc'
        )
        .get();


    return snap.docs.map(
      d => ({
        id: d.id,
        ...d.data()
      })
    );

  },


  async buscarClientePorId(id){

    const doc =
      await FIRESTORE
        .collection('clientes')
        .doc(id)
        .get();


    return doc.exists

      ? {
          id: doc.id,
          ...doc.data()
        }

      : null;

  },


  /* ==========================================================
     LOGIN CLIENTE
     ========================================================== */

  async buscarClienteParaLogin(
    nome,
    cpfCnpj
  ){

    if(!AUTH.currentUser){

      await AUTH.signInAnonymously();

    }


    const nomeBusca =
      DB.normalizarNome(
        nome
      );


    const cpfBusca =
      DB.soNumeros(
        cpfCnpj
      );


    const snap =
      await FIRESTORE
        .collection('clientes')
        .where(
          'nomeBusca',
          '==',
          nomeBusca
        )
        .where(
          'cpfBusca',
          '==',
          cpfBusca
        )
        .limit(1)
        .get();


    if(snap.empty){

      return null;

    }


    const doc =
      snap.docs[0];


    return {
      id: doc.id,
      ...doc.data()
    };

  },


  /* ==========================================================
     PRÓXIMA ORDEM DE SERVIÇO
     ========================================================== */

  async proximoOS(){

    const clientes =
      await DB.listarClientes();


    const numeros =
      clientes.map(
        c =>
          parseInt(
            (c.os || '')
              .replace(/\D/g,''),
            10
          ) || 0
      );


    const max =
      numeros.length
        ? Math.max(...numeros)
        : 0;


    return (
      'OS-' +
      String(max + 1)
        .padStart(4,'0')
    );

  },


  /* ==========================================================
     CRIAR CLIENTE + PROJETO
     ========================================================== */

  async criarCliente(cliente){

    const os =
      await DB.proximoOS();


    const documento = {

      /* CLIENTE */

      nome:
        cliente.nome || '',


      cpfCnpj:
        cliente.cpfCnpj || '',


      whatsapp:
        cliente.whatsapp || '',


      email:
        cliente.email || '',


      /* PROJETO */

      tipo:
        cliente.tipo || '',


      projeto:
        cliente.projeto || '',


      dataInicio:
        cliente.dataInicio || '',


      prazo:
        cliente.prazo || '',


      etapas:
        cliente.etapas || [],


      /*
        Informações técnicas
      */

      entrega: {

        tecnologias:
          (
            cliente.entrega &&
            cliente.entrega.tecnologias
          )
          || [],


        dominio:
          (
            cliente.entrega &&
            cliente.entrega.dominio
          )
          || '',


        hospedagem:
          (
            cliente.entrega &&
            cliente.entrega.hospedagem
          )
          || ''

      },


      /* SISTEMA */

      os:


        os,


      nomeBusca:
        DB.normalizarNome(
          cliente.nome
        ),


      cpfBusca:
        DB.soNumeros(
          cliente.cpfCnpj
        ),


      historico:
        [],


      status:
        'em_andamento',


      criadoEm:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    };


    const ref =
      await FIRESTORE
        .collection('clientes')
        .add(
          documento
        );


    return {

      id: ref.id,

      ...documento

    };

  },


  /* ==========================================================
     ATUALIZAR ETAPAS
     ========================================================== */

  async atualizarEtapas(
    clienteId,
    novasEtapas,
    responsavel
  ){

    const ref =
      FIRESTORE
        .collection('clientes')
        .doc(clienteId);


    const doc =
      await ref.get();


    if(!doc.exists){

      return null;

    }


    const cliente =
      doc.data();


    const concluidasAgora =
      [];


    novasEtapas.forEach(
      (novaEtapa, i) => {

        const antes =
          cliente.etapas &&
          cliente.etapas[i];


        if(
          novaEtapa.concluida &&
          (!antes || !antes.concluida)
        ){

          concluidasAgora.push(
            novaEtapa.nome
          );

        }

      }
    );


    const historico =
      cliente.historico || [];


    if(
      concluidasAgora.length > 0
    ){

      historico.push({

        data:
          DB.hojeISO(),


        responsavel:
          responsavel || 'Administrador',


        itens:
          concluidasAgora

      });

    }


    const progresso =
      DB.calcularProgresso(
        novasEtapas
      );


    const atualizacao = {

      etapas:
        novasEtapas,


      historico:
        historico,


      status:
        progresso === 100
          ? 'concluido'
          : 'em_andamento'

    };


    if(
      progresso === 100 &&
      !cliente.dataConclusao
    ){

      atualizacao.dataConclusao =
        DB.hojeISO();

    }


    await ref.update(
      atualizacao
    );


    return {

      id:
        clienteId,

      ...cliente,

      ...atualizacao

    };

  },


  /* ==========================================================
     PRÉ-CADASTRO (formulário público)
     ========================================================== */

  async salvarPreCadastro(dados){

    if(!AUTH.currentUser){

      await AUTH.signInAnonymously();

    }


    const documento = {

      nome:
        dados.nome || '',


      cpfCnpj:
        dados.doc || '',


      whatsapp:
        dados.whatsapp || '',


      email:
        dados.email || '',


      nomeBusca:
        DB.normalizarNome(
          dados.nome
        ),


      cpfBusca:
        DB.soNumeros(
          dados.doc
        ),


      status:
        'pendente',


      criadoEm:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    };


    const ref =
      await FIRESTORE
        .collection('precadastros')
        .add(
          documento
        );


    return {

      id: ref.id,

      ...documento

    };

  },


  async listarPreCadastros(){

    const snap =
      await FIRESTORE
        .collection('precadastros')
        .where('status', '==', 'pendente')
        .orderBy('criadoEm', 'desc')
        .get();


    return snap.docs.map(
      d => ({
        id: d.id,
        ...d.data()
      })
    );

  },


  async buscarPreCadastroPorId(id){

    const doc =
      await FIRESTORE
        .collection('precadastros')
        .doc(id)
        .get();


    return doc.exists

      ? { id: doc.id, ...doc.data() }

      : null;

  },


  async concluirPreCadastro(id){

    await FIRESTORE
      .collection('precadastros')
      .doc(id)
      .update({
        status: 'concluido'
      });

  }


};