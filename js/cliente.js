/* ============================================================
   LogicDev SYSTEM — AOS
   cliente.js — telas do cliente
   ============================================================ */


/* ============================================================
   PROTEÇÃO
   ============================================================ */

function exigirLoginCliente(aoConfirmar){

  const clienteId =
    sessionStorage.getItem(
      'CLIENTE_LOGADO_ID'
    );

  if(!clienteId){

    window.location.href =
      'index.html';

    return;
  }

  const botaoSair =
    document.getElementById(
      'btn-sair'
    );

  if(botaoSair){

    botaoSair.addEventListener(
      'click',
      function(e){

        e.preventDefault();

        sessionStorage.removeItem(
          'CLIENTE_LOGADO_ID'
        );

        window.location.href =
          'index.html';
      }
    );
  }

  if(
    typeof aoConfirmar ===
    'function'
  ){

    aoConfirmar();
  }
}


/* ============================================================
   PAINEL DO CLIENTE
   ============================================================ */

async function renderizarPainelCliente(){

  const clienteId =
    sessionStorage.getItem(
      'CLIENTE_LOGADO_ID'
    );

  const area =
    document.getElementById(
      'area-cliente'
    );

  const documento =
    document.getElementById(
      'documento-entrega'
    );

  area.innerHTML =
    '<div class="cartao"><p>Carregando...</p></div>';

  if(documento){

    documento.innerHTML =
      '';
  }

  const cliente =
    await DB.buscarClientePorId(
      clienteId
    );

  if(!cliente){

    area.innerHTML =
      '<div class="cartao"><p>Não foi possível carregar os dados do seu projeto.</p></div>';

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


  /* ==========================================================
     PAINEL PRINCIPAL
     ========================================================== */

  area.innerHTML = `

    <div class="cabecalho-secao">

      <div>

        <h2>
          Olá, ${cliente.nome.split(' ')[0]}!
        </h2>

        <p>
          ${cliente.os}
          ·
          ${cliente.projeto}
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


        <div class="checklist">

          ${cliente.etapas.map(

            et => `

              <div
                class="etapa ${
                  et.concluida
                    ? 'concluida'
                    : ''
                }"
              >

                <span class="numero">

                  ${
                    et.concluida
                      ? '✓'
                      : ''
                  }

                </span>

                <label>

                  ${et.nome}

                </label>

              </div>

            `

          ).join('')}

        </div>

      </div>



      <!-- DADOS DO PROJETO -->

      <div class="cartao">

        <h2
          style="
            font-size:1rem;
            margin-bottom:14px;
          "
        >

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

            Ordem de Serviço:

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

          ${DB.formatarData(
            cliente.dataInicio
          )}

          <br>


          <strong style="color:var(--tinta);">

            Prazo:

          </strong>

          ${DB.formatarData(
            cliente.prazo
          )}

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

        </p>



        <h2
          style="
            font-size:1rem;
            margin:18px 0 10px;
          "
        >

          Atualizações

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
              .map(

                h => `

                  <div class="evento">

                    <div class="data">

                      ${DB.formatarData(h.data)}

                    </div>

                    <ul>

                      ${h.itens.map(

                        i =>
                          `<li>${i} concluída</li>`

                      ).join('')}

                    </ul>

                  </div>

                `

              ).join('')
          }

        </div>

      </div>

    </div>

  `;


  /* ==========================================================
     DOCUMENTO DE ENTREGA
     ========================================================== */

  if(!documento){

    return;
  }


  /*
   * PROJETO AINDA NÃO ESTÁ 100%
   *
   * O botão permanece desativado.
   */

  if(progresso < 100){

    documento.innerHTML = `

      <div
        class="cartao"
        style="
          margin-top:20px;
          text-align:center;
        "
      >

        <h2 style="font-size:1rem;">

          Documento do projeto

        </h2>


        <p
          style="
            font-size:.88rem;
            color:var(--tinta-suave);
          "
        >

          O relatório de entrega será liberado
          quando o projeto chegar a 100%.

        </p>


        <button
          class="botao botao-secundario"
          disabled
        >

          Relatório bloqueado — ${progresso}%

        </button>

      </div>

    `;

    return;
  }


  /* ==========================================================
     100% — DOCUMENTO LIBERADO
     ========================================================== */

  documento.innerHTML = `

    <div
      class="cartao"
      style="
        margin-top:20px;
      "
    >

      <div class="cabecalho-secao">

        <div>

          <h2 style="font-size:1rem;">

            Projeto concluído

          </h2>

          <p>

            Seu relatório de entrega está disponível.

          </p>

        </div>


        <!--
          BOTÃO DE RELATÓRIO

          A função gerarDocumentoCliente()
          já existe no seu código.
        -->

        <button
          class="botao botao-primario nao-imprime"
          onclick="gerarDocumentoCliente()"
        >

          Baixar relatório

        </button>

      </div>



      <div
        id="documento-impressao"
        style="display:none;"
      >

        <h1>

          LogicDev SYSTEM

        </h1>


        <h2>

          Documento de Entrega do Projeto

        </h2>


        <hr>


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

          <strong>Data de início:</strong>

          ${DB.formatarData(
            cliente.dataInicio
          )}

        </p>


        <p>

          <strong>Data de conclusão:</strong>

          ${DB.formatarData(
            cliente.dataConclusao
          )}

        </p>


        <h3>

          Tecnologias utilizadas

        </h3>


        <p>

          ${
            entrega.tecnologias &&
            entrega.tecnologias.length

              ? entrega.tecnologias.join(', ')

              : 'Não informado'
          }

        </p>


        <h3>

          Domínio

        </h3>


        <p>

          ${entrega.dominio || 'Não informado'}

        </p>


        <h3>

          Hospedagem

        </h3>


        <p>

          ${entrega.hospedagem || 'Não informado'}

        </p>


        <h3>

          Etapas concluídas

        </h3>


        <ul>

          ${cliente.etapas.map(

            et =>
              `<li>✓ ${et.nome}</li>`

          ).join('')}

        </ul>


        <hr>


        <p>

          Projeto concluído em 100%.

        </p>


        <p>

          LogicDev SYSTEM

        </p>

      </div>

    </div>

  `;
}


/* ============================================================
   GERAR DOCUMENTO
   ============================================================ */

function gerarDocumentoCliente(){

  const documento =
    document.getElementById(
      'documento-impressao'
    );


  if(!documento){

    return;
  }


  const janela =
    window.open(
      '',
      '_blank'
    );


  janela.document.write(`

    <!DOCTYPE html>

    <html lang="pt-BR">

    <head>

      <meta charset="UTF-8">

      <title>

        Documento de Entrega — LogicDev SYSTEM

      </title>


      <style>

        body{

          font-family:Arial,sans-serif;

          max-width:800px;

          margin:40px auto;

          padding:30px;

          color:#111;

        }


        h1,h2,h3{

          margin-bottom:10px;

        }


        hr{

          margin:25px 0;

        }


        li{

          margin-bottom:8px;

        }


        .rodape{

          margin-top:40px;

          padding-top:20px;

          border-top:1px solid #ddd;

        }


        @media print{

          body{

            margin:0;

          }

        }

      </style>

    </head>


    <body>

      ${documento.innerHTML}

    </body>

    </html>

  `);


  janela.document.close();


  janela.focus();


  setTimeout(

    () => {

      janela.print();

    },

    300

  );

}