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


    const elNome =
      document.getElementById('nome-admin');

    const elCpf =
      document.getElementById('cpf-admin');


    if(elNome){

      elNome.textContent =
        perfil.nome;

    }


    if(elCpf){

      elCpf.textContent =
        perfil.cpf;

    }


    const botaoSair =
      document.getElementById('btn-sair');


    if(botaoSair){

      botaoSair.addEventListener(
        'click',
        async function(e){

          e.preventDefault();

          await DB.sairAdmin();

          window.location.href =
            'index.html';

        }
      );

    }


    if(typeof aoConfirmar === 'function'){

      aoConfirmar();

    }

  });

}


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
   PRÉ-CADASTROS PENDENTES
   ============================================================ */

let PRECADASTRO_EM_CONCLUSAO = null;


async function renderizarPreCadastros(){

  const lista =
    document.getElementById(
      'lista-precadastros'
    );


  if(!lista){

    return;

  }


  lista.innerHTML =
    '<div class="vazio">Carregando pré-cadastros...</div>';


  const precadastros =
    await DB.listarPreCadastros();


  const total =
    document.getElementById(
      'total-precadastros'
    );


  if(total){

    total.textContent =
      `Total: ${precadastros.length}`;

  }


  if(precadastros.length === 0){

    lista.innerHTML =
      '<div class="vazio">Nenhum pré-cadastro pendente.</div>';

  }

  else{

    lista.innerHTML =
      precadastros.map(p => `

        <div class="item-cliente">

          <div class="avatar">
            ${iniciais(p.nome)}
          </div>


          <div class="info">

            <strong>
              ${p.nome}
            </strong>

            <span>
              CPF/CNPJ: ${p.cpfCnpj}
            </span>

            <small>
              WhatsApp: ${p.whatsapp || '—'}
              ·
              E-mail: ${p.email || '—'}
            </small>

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

  const pre =
    await DB.buscarPreCadastroPorId(id);


  if(!pre){

    alert(
      'Pré-cadastro não encontrado. Atualize a página.'
    );

    return;

  }


  PRECADASTRO_EM_CONCLUSAO =
    pre.id;


  document.getElementById('n-nome').value =
    pre.nome || '';

  document.getElementById('n-doc').value =
    pre.cpfCnpj || '';

  document.getElementById('n-whatsapp').value =
    pre.whatsapp || '';

  document.getElementById('n-email').value =
    pre.email || '';


  const inicio =
    document.getElementById('n-inicio');


  if(inicio){

    inicio.value =
      DB.hojeISO();

  }


  document.getElementById('modal-novo').style.display =
    'flex';

}


/* ============================================================
   PAINEL ADMIN
   ============================================================ */

async function renderizarPainelAdmin(){

  const lista =
    document.getElementById(
      'lista-clientes'
    );


  lista.innerHTML =
    '<div class="vazio">Carregando clientes...</div>';


  const clientes =
    await DB.listarClientes();


  const total =
    document.getElementById(
      'total-clientes'
    );


  if(total){

    total.textContent =
      `Total de clientes: ${clientes.length}`;

  }


  if(clientes.length === 0){

    lista.innerHTML =
      '<div class="vazio">Nenhum cliente cadastrado ainda. Clique em "+ Novo Cliente" para começar.</div>';

  }

  else{

    lista.innerHTML =
      clientes.map(c => {

        const progresso =
          DB.calcularProgresso(
            c.etapas
          );


        return `

          <a
            class="item-cliente"
            href="cliente.html?id=${c.id}"
          >

            <div class="avatar">
              ${iniciais(c.nome)}
            </div>


            <div class="info">

              <strong>
                ${c.nome}
              </strong>

              <span>
                ${c.os} · ${c.projeto}
              </span>

              <small>
                CPF/CNPJ: ${c.cpfCnpj}
              </small>

            </div>


            <div class="barra-mini">

              <div class="barra">

                <div
                  style="width:${progresso}%"
                ></div>

              </div>

            </div>


            <div class="pct">
              ${progresso}%
            </div>

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

  const modal =
    document.getElementById(
      'modal-novo'
    );


  const btnNovo =
    document.getElementById(
      'btn-novo-cliente'
    );


  const btnCancelar =
    document.getElementById(
      'btn-cancelar-novo'
    );
    
  /* ============================================================
     MÁSCARA CPF/CNPJ
     ============================================================ */

  const inputDoc =
    document.getElementById(
      'n-doc'
    );


  if(inputDoc){

    inputDoc.setAttribute('maxlength', '18');


    inputDoc.addEventListener(
      'input',
      function(e){

        let value =
          e.target.value.replace(/\D/g, '');


        value =
          value.slice(0, 14);


        if(value.length <= 11){

          value = value
            .replace(/^(\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');

        }

        else{

          value = value
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})\.(\d{3})(\d)/, '.$1.$2/$3')
            .replace(/\/(\d{4})(\d{1,2})$/, '/$1-$2');

        }


        e.target.value =
          value;

      }
    );

  }


  /* ============================================================
     MÁSCARA WHATSAPP
     ============================================================ */

  const inputWhats =
    document.getElementById(
      'n-whatsapp'
    );


  if(inputWhats){

    inputWhats.setAttribute('maxlength', '16');


    inputWhats.addEventListener(
      'input',
      function(e){

        let value =
          e.target.value.replace(/\D/g, '');


        value =
          value.slice(0, 11);


        if(value.length <= 10){

          value = value
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d{1,4})$/, '$1-$2');

        }

        else{

          value = value
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d{1,4})$/, '$1-$2');

        }


        e.target.value =
          value;

      }
    );

  }

  const formulario =
    document.getElementById(
      'form-novo-cliente'
    );


  /*
    Evita registrar os eventos várias vezes
    quando o painel é atualizado.
  */

  if(btnNovo && !btnNovo.dataset.configurado){

    btnNovo.dataset.configurado = 'true';


    btnNovo.addEventListener(
      'click',
      () => {

        PRECADASTRO_EM_CONCLUSAO =
          null;


        const inicio =
          document.getElementById(
            'n-inicio'
          );


        if(inicio){

          inicio.value =
            DB.hojeISO();

        }


        modal.style.display =
          'flex';

      }
    );

  }


  if(btnCancelar &&
     !btnCancelar.dataset.configurado){

    btnCancelar.dataset.configurado =
      'true';


    btnCancelar.addEventListener(
      'click',
      () => {

        PRECADASTRO_EM_CONCLUSAO =
          null;


        modal.style.display =
          'none';

      }
    );

  }


  if(
    formulario &&
    !formulario.dataset.configurado
  ){

    formulario.dataset.configurado =
      'true';


    formulario.addEventListener(
      'submit',
      async function(e){

        e.preventDefault();


        /*
          ETAPAS
        */

        const etapasTexto =
          document
            .getElementById('n-etapas')
            .value
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean);


        if(etapasTexto.length === 0){

          alert(
            'Cadastre ao menos uma etapa para o projeto.'
          );

          return;

        }


        /*
          TECNOLOGIAS
        */

        const tecnologiasTexto =
          document
            .getElementById('n-tecnologias')
            .value
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);


        /*
          BOTÃO
        */

        const botaoSalvar =
          this.querySelector(
            'button[type=submit]'
          );


        botaoSalvar.disabled =
          true;


        botaoSalvar.textContent =
          'Salvando...';


        /*
          CLIENTE + PROJETO
        */

        const novoCliente = {

          nome:
            document.getElementById(
              'n-nome'
            ).value.trim(),


          cpfCnpj:
            document.getElementById(
              'n-doc'
            ).value.trim(),


          whatsapp:
            document.getElementById(
              'n-whatsapp'
            ).value.trim(),


          email:
            document.getElementById(
              'n-email'
            ).value.trim(),


          tipo:
            document.getElementById(
              'n-tipo'
            ).value.trim(),


          projeto:
            document.getElementById(
              'n-projeto'
            ).value.trim(),


          dataInicio:
            document.getElementById(
              'n-inicio'
            ).value,


          prazo:
            document.getElementById(
              'n-prazo'
            ).value,


          etapas:
            etapasTexto.map(
              nome => ({
                nome: nome,
                concluida: false
              })
            ),


          entrega: {

            tecnologias:
              tecnologiasTexto,

            dominio:
              document.getElementById(
                'n-dominio'
              ).value.trim(),

            hospedagem:
              document.getElementById(
                'n-hospedagem'
              ).value.trim()

          }

        };


        try{

          /*
            Usa a mesma função original.
          */

          await DB.criarCliente(
            novoCliente
          );


          /*
            Se esse cadastro veio de um
            pré-cadastro público, marca
            ele como concluído.
          */

          if(PRECADASTRO_EM_CONCLUSAO){

            await DB.concluirPreCadastro(
              PRECADASTRO_EM_CONCLUSAO
            );


            PRECADASTRO_EM_CONCLUSAO =
              null;


            await renderizarPreCadastros();

          }


          modal.style.display =
            'none';


          this.reset();


          await renderizarPainelAdmin();


        }

        catch(erro){

          console.error(
            'Erro ao cadastrar:',
            erro
          );


          alert(
            'Não foi possível salvar o cliente. Veja o console para detalhes.'
          );

        }

        finally{

          botaoSalvar.disabled =
            false;


          botaoSalvar.textContent =
            'Cadastrar Cliente';

        }

      }
    );

  }

}


/* ============================================================
   FICHA DO CLIENTE
   ============================================================ */

async function renderizarFichaCliente(){

  const params =
    new URLSearchParams(
      window.location.search
    );


  const id =
    params.get('id');


  const area =
    document.getElementById(
      'area-cliente'
    );


  area.innerHTML =
    '<div class="cartao"><p>Carregando...</p></div>';


  const cliente =
    await DB.buscarClientePorId(id);


  if(!cliente){

    area.innerHTML =
      '<div class="cartao"><p>Cliente não encontrado.</p></div>';

    return;

  }


  const progresso =
    DB.calcularProgresso(
      cliente.etapas
    );


  const selo =
    cliente.status === 'concluido'

      ? '<span class="selo selo-concluido">Concluído</span>'

      : '<span class="selo selo-andamento">Em andamento</span>';


  const entrega =
    cliente.entrega || {};


  area.innerHTML = `

    <div class="cabecalho-secao">

      <div>

        <h2>
          ${cliente.nome}
        </h2>

        <p>
          CPF/CNPJ: ${cliente.cpfCnpj}
          · ${cliente.os}
          · ${cliente.projeto}
        </p>

      </div>

      ${selo}

    </div>


    <div class="grade-2">


      <!-- PROGRESSO -->

      <div class="cartao">

        <div class="cabecalho-secao">

          <h2 style="font-size:1rem;">
            Progresso: ${progresso}%
          </h2>

        </div>


        <div
          class="barra"
          style="margin-bottom:18px;"
        >

          <div
            style="width:${progresso}%"
          ></div>

        </div>


        <form id="form-etapas">

          <div
            class="checklist"
            id="checklist-etapas"
          >

            ${cliente.etapas.map(
              (et, i) => `

                <div
                  class="etapa ${et.concluida ? 'concluida' : ''}"
                >

                  <input
                    type="checkbox"
                    id="etapa-${i}"
                    data-indice="${i}"
                    ${et.concluida ? 'checked' : ''}
                  >

                  <label
                    for="etapa-${i}"
                  >
                    ${et.nome}
                  </label>

                </div>

              `
            ).join('')}

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

        <h2 style="font-size:1rem; margin-bottom:14px;">
          Dados do projeto
        </h2>


        <p
          style="
            font-size:.88rem;
            color:var(--tinta-suave);
            margin:0 0 10px;
          "
        >

          <strong style="color:var(--tinta);">
            Cliente:
          </strong>

          ${cliente.nome}

          <br>


          <strong style="color:var(--tinta);">
            CPF/CNPJ:
          </strong>

          ${cliente.cpfCnpj}

          <br>


          <strong style="color:var(--tinta);">
            WhatsApp:
          </strong>

          ${cliente.whatsapp || '—'}

          <br>


          <strong style="color:var(--tinta);">
            E-mail:
          </strong>

          ${cliente.email || '—'}

          <br>


          <strong style="color:var(--tinta);">
            OS:
          </strong>

          ${cliente.os}

          <br>


          <strong style="color:var(--tinta);">
            Tipo:
          </strong>

          ${cliente.tipo}

          <br>


          <strong style="color:var(--tinta);">
            Início:
          </strong>

          ${DB.formatarData(cliente.dataInicio)}

          <br>


          <strong style="color:var(--tinta);">
            Prazo:
          </strong>

          ${DB.formatarData(cliente.prazo)}

          <br>


          <strong style="color:var(--tinta);">
            Tecnologias:
          </strong>

          ${
            entrega.tecnologias &&
            entrega.tecnologias.length
              ? entrega.tecnologias.join(', ')
              : '—'
          }

          <br>


          <strong style="color:var(--tinta);">
            Domínio:
          </strong>

          ${entrega.dominio || '—'}

          <br>


          <strong style="color:var(--tinta);">
            Hospedagem:
          </strong>

          ${entrega.hospedagem || '—'}

        </p>


        <h2
          style="
            font-size:1rem;
            margin:18px 0 10px;
          "
        >
          Histórico interno
        </h2>


        <div class="linha-tempo">

          ${
            (!cliente.historico ||
             cliente.historico.length === 0)

            ?

            '<p style="font-size:.85rem; color:var(--tinta-suave);">Nenhuma atualização registrada ainda.</p>'

            :

            cliente.historico
              .slice()
              .reverse()
              .map(h => `

                <div class="evento">

                  <div class="data">
                    ${DB.formatarData(h.data)}
                  </div>

                  <div class="responsavel">
                    ${h.responsavel}
                  </div>

                  <ul>

                    ${h.itens.map(
                      i => `<li>${i} concluída</li>`
                    ).join('')}

                  </ul>

                </div>

              `).join('')
          }

        </div>

      </div>

    </div>

  `;


  /*
    ATUALIZAÇÃO DAS ETAPAS
  */

  document
    .getElementById('form-etapas')
    .addEventListener(
      'submit',
      async function(e){

        e.preventDefault();


        const botao =
          this.querySelector(
            'button[type=submit]'
          );


        botao.disabled =
          true;


        botao.textContent =
          'Salvando...';


        const checkboxes =
          document.querySelectorAll(
            '#checklist-etapas input[type=checkbox]'
          );


        const novasEtapas =
          cliente.etapas.map(
            (et, i) => ({

              nome:
                et.nome,

              concluida:
                checkboxes[i].checked

            })
          );


        const perfil =
          await DB.obterPerfilAdmin();


        await DB.atualizarEtapas(
          cliente.id,
          novasEtapas,
          perfil.nome
        );


        await renderizarFichaCliente();

      }
    );

}


/* ============================================================
   RELATÓRIO
   ============================================================ */

let CLIENTES_EM_MEMORIA_RELATORIO = [];


async function inicializarRelatorio(){

  CLIENTES_EM_MEMORIA_RELATORIO =
    await DB.listarClientes();


  const campoBusca =
    document.getElementById(
      'busca'
    );


  campoBusca.addEventListener(
    'input',
    function(){

      const termo =
        this.value.trim();


      const termoNorm =
        DB.normalizarNome(
          termo
        );


      const termoDoc =
        DB.soNumeros(
          termo
        );


      const resultadosDiv =
        document.getElementById(
          'resultados-busca'
        );


      if(termo.length < 2){

        resultadosDiv.innerHTML =
          '';

        return;

      }


      const encontrados =
        CLIENTES_EM_MEMORIA_RELATORIO.filter(
          c =>

            DB.normalizarNome(
              c.nome
            ).includes(
              termoNorm
            )

            ||

            (
              termoDoc &&
              DB.soNumeros(
                c.cpfCnpj
              ).includes(
                termoDoc
              )
            )
        );


      if(encontrados.length === 0){

        resultadosDiv.innerHTML =
          '<p style="font-size:.85rem; color:var(--tinta-suave);">Nenhum cliente encontrado.</p>';

        return;

      }


      resultadosDiv.innerHTML =
        encontrados.map(
          c => `

            <div
              class="item-cliente"
              style="cursor:pointer;"
              onclick="mostrarRelatorioCliente('${c.id}')"
            >

              <div class="avatar">
                ${iniciais(c.nome)}
              </div>

              <div class="info">

                <strong>
                  ${c.nome}
                </strong>

                <span>
                  CPF/CNPJ: ${c.cpfCnpj}
                </span>

                <span>
                  ${c.os} · ${c.projeto}
                </span>

              </div>

            </div>

          `
        ).join('');

    }
  );

}


/* ============================================================
   MOSTRAR RELATÓRIO
   ============================================================ */

async function mostrarRelatorioCliente(id){

  const cliente =
    await DB.buscarClientePorId(id);


  if(!cliente){

    return;

  }


  const perfil =
    await DB.obterPerfilAdmin();


  const progresso =
    DB.calcularProgresso(
      cliente.etapas
    );


  const area =
    document.getElementById(
      'area-relatorio'
    );


  area.innerHTML = `

    <div class="cartao">


      <div class="cabecalho-secao">

        <div>

          <h2>
            ${cliente.nome}
          </h2>

          <p>
            CPF/CNPJ: ${cliente.cpfCnpj}
          </p>

        </div>


        <button
          class="botao botao-secundario nao-imprime"
          onclick="window.print()"
        >
          Imprimir / Salvar PDF
        </button>

      </div>


      <p>
        <strong>Cliente:</strong>
        ${cliente.nome}
      </p>


      <p>
        <strong>CPF/CNPJ:</strong>
        ${cliente.cpfCnpj}
      </p>


      <p>
        <strong>Ordem de Serviço:</strong>
        ${cliente.os}
      </p>


      <p>
        <strong>Projeto:</strong>
        ${cliente.projeto}
      </p>


      <p>
        <strong>Tipo:</strong>
        ${cliente.tipo}
      </p>


      <p>
        <strong>Início:</strong>
        ${DB.formatarData(cliente.dataInicio)}
      </p>


      <p>
        <strong>Prazo:</strong>
        ${DB.formatarData(cliente.prazo)}
      </p>


      <p>
        <strong>Responsável:</strong>
        ${perfil.nome}
      </p>


      <h2 style="font-size:1rem; margin-top:20px;">
        Progresso: ${progresso}%
      </h2>


      <div
        class="barra"
        style="margin-bottom:20px;"
      >

        <div
          style="width:${progresso}%"
        ></div>

      </div>


      <h2 style="font-size:1rem; margin-bottom:8px;">
        Etapas
      </h2>


      <div
        class="checklist"
        style="margin-bottom:18px;"
      >

        ${cliente.etapas.map(
          et => `

            <div
              class="etapa ${et.concluida ? 'concluida' : ''}"
            >

              <span class="numero">
                ${et.concluida ? '✓' : ''}
              </span>

              <label>
                ${et.nome}
              </label>

            </div>

          `
        ).join('')}

      </div>


      <h2 style="font-size:1rem; margin-bottom:8px;">
        Histórico de execução
      </h2>


      <div class="linha-tempo">

        ${
          (!cliente.historico ||
           cliente.historico.length === 0)

          ?

          '<p style="font-size:.85rem; color:var(--tinta-suave);">Nenhuma atualização registrada.</p>'

          :

          cliente.historico
            .map(
              h => `

                <div class="evento">

                  <div class="data">
                    ${DB.formatarData(h.data)}
                    —
                    ${h.responsavel}
                  </div>

                  <ul>

                    ${h.itens.map(
                      i => `<li>${i} concluída</li>`
                    ).join('')}

                  </ul>

                </div>

              `
            ).join('')
        }

      </div>


      <div
        style="
          margin-top:20px;
          padding-top:16px;
          border-top:1px solid var(--linha);
        "
      >

        <span
          class="selo ${
            cliente.status === 'concluido'
              ? 'selo-concluido'
              : 'selo-andamento'
          }"
        >

          ${
            cliente.status === 'concluido'
              ? 'STATUS: CONCLUÍDO'
              : 'STATUS: EM ANDAMENTO'
          }

        </span>


        ${
          cliente.dataConclusao

          ?

          `<p style="font-size:.85rem; margin-top:8px;">
            Projeto finalizado em:
            ${DB.formatarData(cliente.dataConclusao)}
          </p>`

          :

          ''
        }

      </div>


    </div>

  `;

}