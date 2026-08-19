/* =========================================================================
   CENTRO DE USINAGEM CNC — dados das fases
   Convenção (ISO / Fanuc, centro de usinagem 3 eixos):
     X, Y = posição da ferramenta no plano da peça (vista de cima), a partir
            do zero-peça W. Não existe diâmetro — X e Y são só posição.
     Z    = profundidade. Z0 é a face de cima da peça; Z negativo = dentro
            do material (a ferramenta desceu). R = plano de referência do
            ciclo de furação (folga antes de furar).
     G90 = absoluto · G91 = incremental.
   Fases de contorno (1–14): {id,x,y,note?,g?,arc?,safe?}
   Fases de programa (15–18): blocos N.. com {req:[...], g?,x?,y?,z?,r?,q?,p?,f?,s?,t?,m?,note?}
     — só as colunas em "req" pedem preenchimento; as demais aparecem como "—"
     (célula não aplicável), reproduzindo o comportamento MODAL real dos
     ciclos fixos: um furo repetido só precisa de X e Y novos.
   ========================================================================= */

const MODE_LABEL = {
  abs:  'Coordenadas absolutas (X, Y)',
  inc:  'Coordenadas incrementais (ΔX, ΔY)',
  both: 'Absolutas + Incrementais',
  gcode:'Programação G0 / G1',
  prog: 'Programa completo'
};

/* ---------------- definição de colunas ---------------- */
const GSEL_MILL = ['G0','G1','G2','G3'];
const GSEL_FULL = ['G0','G1','G2','G3','G40','G54','G80','G81','G82','G83','G84','G28'];
const MSEL      = ['M00','M01','M02','M03','M04','M05','M06','M08','M09','M30'];

const COL_G  = {k:'g',  h:'G',  g:'BLOCO',        kind:'g'};
const COL_X  = {k:'x',  h:'X',  g:'ABSOLUTAS',     kind:'x'};
const COL_Y  = {k:'y',  h:'Y',  g:'ABSOLUTAS',     kind:'y'};
const COL_DX = {k:'dx', h:'ΔX', g:'INCREMENTAIS',  kind:'dx'};
const COL_DY = {k:'dy', h:'ΔY', g:'INCREMENTAIS',  kind:'dy'};
const COL_Z  = {k:'z',  h:'Z',  g:'PROFUNDIDADE',  kind:'z'};
const COL_R  = {k:'r',  h:'R',  g:'CICLO',         kind:'r'};
const COL_Q  = {k:'q',  h:'Q',  g:'CICLO',         kind:'q'};
const COL_P  = {k:'p',  h:'P',  g:'CICLO',         kind:'p'};
const COL_F  = {k:'f',  h:'F',  g:'AVANÇO',        kind:'f'};
const COL_S  = {k:'s',  h:'S',  g:'ROTAÇÃO',       kind:'s'};
const COL_T  = {k:'t',  h:'T',  g:'FERRAMENTA',    kind:'t'};
const COL_M  = {k:'m',  h:'M',  g:'AUXILIAR',      kind:'m'};

const COLS_ABS   = [COL_X,COL_Y];
const COLS_INC   = [COL_DX,COL_DY];
const COLS_BOTH  = [COL_X,COL_Y,COL_DX,COL_DY];
const COLS_GCODE = [COL_G,COL_X,COL_Y,COL_DX,COL_DY];
const COLS_FULL  = [COL_T,COL_M,COL_S,COL_G,COL_X,COL_Y,COL_Z,COL_R,COL_Q,COL_P,COL_F];

/* ---------------- fases de contorno (X/Y) ---------------- */
const LEVELS = [
{
  id:1, kind:'contour', cols:COLS_ABS, name:'Primeiro Contato', sub:'Os eixos X e Y', modes:['abs'], boss:false,
  tip:'Não existe diâmetro no centro de usinagem: X e Y são só a posição da ferramenta no plano, a partir do zero-peça W.',
  brief:'Vista de cima de uma peça simples, com um degrau. Leia X e Y de cada canto.',
  pts:[
    {id:'A', x:0,  y:0,  note:'quina inicial — zero-peça W'},
    {id:'B', x:30, y:0,  note:'andou em X, o Y não mudou'},
    {id:'C', x:30, y:20, note:'subiu em Y, o X não mudou'},
    {id:'D', x:50, y:20, note:'degrau: X avança, Y fica igual'},
    {id:'E', x:50, y:40, note:'fim do contorno'}
  ],
  hints:[
    'De A para B só X muda — a fresa anda reto num lado do contorno.',
    'De B para C só Y muda — é o lado perpendicular.',
    'Em cada canto reto, um dos dois eixos repete o valor do ponto anterior.'
  ]
},
{
  id:2, kind:'contour', cols:COLS_ABS, name:'Chanfro de Entrada', sub:'Chanfro 4x45° e diagonal', modes:['abs'], boss:false,
  tip:'Chanfro de canto 4x45°: anda 4 mm em X e 4 mm em Y ao mesmo tempo.',
  brief:'Mesmo tipo de contorno, agora com um chanfro de canto a 45° e um trecho diagonal.',
  pts:[
    {id:'A', x:0,  y:0},
    {id:'B', x:20, y:0},
    {id:'C', x:24, y:4,  note:'chanfro 4x45°: 4 mm em X e 4 mm em Y'},
    {id:'D', x:24, y:24},
    {id:'E', x:44, y:44, note:'trecho diagonal — X e Y mudam juntos'},
    {id:'F', x:44, y:60}
  ],
  hints:[
    'B→C é o chanfro: ΔX = 4 e ΔY = 4, os dois iguais (45°).',
    'D→E é diagonal: X e Y mudam na mesma proporção, 20 e 20.',
    'Comprimento total 60 mm em Y → o último ponto é Y60.'
  ]
},
{
  id:3, kind:'contour', cols:COLS_INC, name:'Pensando em Δ', sub:'Coordenadas incrementais', modes:['inc'], boss:false,
  tip:'Incremental = quanto a ferramenta ANDOU desde o ponto anterior, em X e em Y.',
  brief:'A mesma leitura de sempre, mas agora você informa o deslocamento desde o ponto anterior.',
  pts:[
    {id:'A', x:0,  y:0},
    {id:'B', x:35, y:0},
    {id:'C', x:35, y:15},
    {id:'D', x:55, y:15},
    {id:'E', x:55, y:35}
  ],
  hints:[
    'O primeiro ponto sai da origem: o incremental é igual ao absoluto.',
    'Se X não muda, ΔX = 0. Se Y não muda, ΔY = 0.',
    'Andar para cima em Y dá ΔY positivo; andar em X dá ΔX positivo.'
  ]
},
{
  id:4, kind:'contour', cols:COLS_INC, name:'Δ com Chanfro', sub:'Incremental em contorno com chanfro', modes:['inc'], boss:false,
  tip:'No chanfro 4x45°, ΔX vale 4 e ΔY vale 4.',
  brief:'Contorno com chanfro de canto e degrau — só incrementais.',
  pts:[
    {id:'A', x:0,  y:0},
    {id:'B', x:26, y:0},
    {id:'C', x:30, y:4},
    {id:'D', x:30, y:24},
    {id:'E', x:50, y:24},
    {id:'F', x:50, y:48}
  ],
  hints:[
    'B→C é o chanfro: ΔX = 4 e ΔY = 4.',
    'D→E é degrau reto: ΔY = 0.',
    'Some todos os ΔY: o resultado tem que dar 48 (altura total).'
  ]
},
{
  id:5, kind:'contour', cols:COLS_BOTH, name:'Lado a Lado', sub:'A mesma peça nas duas colunas', modes:['both'], boss:false,
  tip:'X e Y são só posição no plano — as mesmas regras de sempre, agora nas quatro colunas.',
  brief:'A peça da fase 3 de novo — agora com as quatro colunas. Sem chanfro: só o método.',
  pts:[
    {id:'A', x:0,  y:0,  note:'zero-peça W'},
    {id:'B', x:35, y:0,  note:'andou em X, ainda em Y0'},
    {id:'C', x:35, y:15, note:'fim do trecho de 15 mm'},
    {id:'D', x:55, y:15, note:'degrau: sobe X sem mudar Y'},
    {id:'E', x:55, y:35, note:'fim do contorno'}
  ],
  hints:[
    'Absoluta = medida a partir do zero-peça. Incremental = diferença para a linha de cima.',
    'A primeira linha sai da origem, então ΔX = X e ΔY = Y: 35 e 0.',
    'Controle: ΣΔX = 35+0+20+0 = 55 (último X) e ΣΔY = 0+15+0+20 = 35 (último Y).'
  ]
},
{
  id:6, kind:'contour', cols:COLS_BOTH, name:'Duas Colunas', sub:'Absoluta e incremental juntas', modes:['both'], boss:false,
  tip:'Confira cada ponto com o desenho: qual X e qual Y ele mostra ali?',
  brief:'Agora as duas tabelas ao mesmo tempo, como na folha de processo.',
  pts:[
    {id:'A', x:0,  y:0},
    {id:'B', x:18, y:0},
    {id:'C', x:22, y:4},
    {id:'D', x:22, y:18},
    {id:'E', x:36, y:32},
    {id:'F', x:36, y:46},
    {id:'G', x:56, y:46}
  ],
  hints:[
    'Absoluta = medida a partir do zero-peça. Incremental = diferença da linha de cima.',
    'D→E é diagonal: muda X e Y ao mesmo tempo.',
    'A última linha é degrau: ΔY = 0, ΔX = 56 − 36 = 20.'
  ]
},
{
  id:7, kind:'contour', cols:COLS_ABS, name:'Raio de Canto', sub:'Chanfro, raio R3 e degrau', modes:['abs'], boss:false,
  tip:'Num raio de canto R3, o ponto final fica deslocado 3 mm em X e 3 mm em Y — é curva, não corte reto.',
  brief:'Contorno com chanfro, trecho reto, raio de canto e degrau. Atenção nos pontos do raio.',
  pts:[
    {id:'A', x:0,  y:0},
    {id:'B', x:14, y:0,  note:'entrada do chanfro 3x45°'},
    {id:'C', x:17, y:3,  note:'fim do chanfro'},
    {id:'D', x:17, y:20, note:'fim do lado reto'},
    {id:'E', x:23, y:20, note:'início do raio R3'},
    {id:'F', x:26, y:23, arc:3, note:'fim do raio, já em X26'},
    {id:'G', x:26, y:42},
    {id:'H', x:46, y:42}
  ],
  hints:[
    'Chanfro 3x45° → anda 3 mm em X e 3 mm em Y.',
    'O raio R3 desloca 3 mm em X e 3 mm em Y — é uma curva, não um corte reto.',
    'E→F: X vai de 23 para 26 enquanto Y vai de 20 para 23.'
  ]
},
{
  id:8, kind:'contour', cols:COLS_BOTH, name:'Folha de Processo', sub:'Absoluta + incremental, 8 pontos', modes:['both'], boss:false,
  tip:'Confira somando: a soma dos ΔX tem que bater com o último X absoluto.',
  brief:'Contorno longo. Preencha as quatro colunas sem errar o sinal.',
  pts:[
    {id:'A', x:0,  y:0},
    {id:'B', x:24, y:0},
    {id:'C', x:27, y:3},
    {id:'D', x:27, y:25},
    {id:'E', x:41, y:25},
    {id:'F', x:41, y:48},
    {id:'G', x:57, y:56},
    {id:'H', x:57, y:75}
  ],
  hints:[
    'Chanfro 3x45° na entrada: 27 = 24 + 3.',
    'F→G é diagonal: ΔX = 16 e ΔY = 8.',
    'Soma dos ΔY = 75. Soma dos ΔX = 57.'
  ]
},
{
  id:9, kind:'contour', cols:COLS_ABS, name:'Antes de Aproximar', sub:'Ponto de aproximação e leitura de sinal', modes:['abs'], boss:false,
  tip:'O ponto de aproximação (PA) fica FORA da peça — X e Y bem afastados, geralmente negativos.',
  brief:'Contorno simples. O que é novo aqui são as duas primeiras linhas: o ponto de aproximação e a entrada na peça.',
  pts:[
    {id:'P1', x:-40, y:-40, safe:true, note:'ponto de aproximação — fora da peça, não está no desenho'},
    {id:'P2', x:0,   y:0,   note:'entrou no zero-peça W'},
    {id:'P3', x:24,  y:0},
    {id:'P4', x:24,  y:20},
    {id:'P5', x:40,  y:20},
    {id:'P6', x:40,  y:35}
  ],
  hints:[
    'P1 é o ponto de aproximação: bem longe da peça, X e Y negativos → X-40 Y-40.',
    'P2 já é o zero-peça: X0 Y0.',
    'De P3 a P6 é o contorno de sempre: sobe em X, depois em Y, degrau, e mais um trecho.'
  ]
},
{
  id:10, kind:'contour', cols:COLS_ABS, name:'A Peça do Instrutor', sub:'9 pontos + ponto de aproximação', modes:['abs'], boss:false,
  tip:'O ponto de aproximação fica bem longe do contorno: X e Y bem negativos.',
  brief:'Aquela peça de prova: contorno escalonado com chanfros e um raio. P1 é o ponto de aproximação.',
  pts:[
    {id:'P1', x:-50, y:-50, safe:true, note:'ponto de aproximação'},
    {id:'P2', x:0,   y:0,   note:'zero-peça W'},
    {id:'P3', x:14,  y:0},
    {id:'P4', x:17,  y:3,  note:'fim do chanfro 3x45°'},
    {id:'P5', x:17,  y:20},
    {id:'P6', x:23,  y:20, note:'início do raio R3'},
    {id:'P7', x:26,  y:23, arc:3, note:'fim do raio R3'},
    {id:'P8', x:26,  y:40},
    {id:'P9', x:40,  y:40, note:'início do chanfro final'},
    {id:'P10',x:46,  y:46, note:'fim do chanfro, 6 mm em X e Y'}
  ],
  hints:[
    'P1 não toca a peça: está bem longe, em X-50 Y-50.',
    'P2 é o zero-peça: X0 Y0.',
    'Entre P9 e P10, X e Y andam juntos 6 mm — outro chanfro a 45°.'
  ]
},
{
  id:11, kind:'contour', cols:COLS_GCODE, name:'Cinco Blocos', sub:'Primeiro programa: G0 e G1', modes:['gcode'], boss:false,
  tip:'G0 = no ar, sem cortar. G1 = cortando. Só a aproximação é G0 aqui.',
  brief:'A peça da fase 1, agora escrita como programa. Cinco blocos, um G0 e quatro G1.',
  pts:[
    {id:'N10', x:30, y:-8, g:'G0', note:'aproxima no ar, 8 mm antes de tocar o contorno'},
    {id:'N20', x:30, y:0,  g:'G1', note:'toca o contorno — a partir daqui há material'},
    {id:'N30', x:30, y:20, g:'G1'},
    {id:'N40', x:50, y:20, g:'G1', note:'degrau: sobe em X sem mudar Y'},
    {id:'N50', x:50, y:40, g:'G1', note:'termina os 40 mm de Y'}
  ],
  hints:[
    'Só o primeiro bloco é no ar: N10 é G0, todo o resto é G1.',
    'N10 está 8 mm ANTES do contorno (Y-8) e N20 já toca nele (Y0) — o X não muda, continua 30.',
    'N30→N40 é degrau: Y fica em 20 e X vai de 30 para 50.'
  ]
},
{
  id:12, kind:'contour', cols:COLS_GCODE, name:'Escrevendo G-Code', sub:'G0 rápido, G1 usinando', modes:['gcode'], boss:false,
  tip:'G0 = deslocamento rápido, no ar, sem F. G1 = avanço de trabalho, cortando, com F.',
  brief:'Agora vira programa: escolha G0/G1 e preencha X e Y de cada bloco, terminando com um recuo.',
  pts:[
    {id:'N10', x:0,  y:-8, g:'G0', note:'aproxima no ar, 8 mm antes do zero-peça'},
    {id:'N20', x:0,  y:0,  g:'G1', note:'entra no zero-peça'},
    {id:'N30', x:22, y:0,  g:'G1'},
    {id:'N40', x:22, y:26, g:'G1'},
    {id:'N50', x:42, y:26, g:'G1'},
    {id:'N60', x:42, y:48, g:'G1'},
    {id:'N70', x:-60,y:-60,g:'G0', safe:true, note:'recua para longe da peça'}
  ],
  hints:[
    'Movimento no ar (aproximação e recuo) sempre G0; qualquer corte é G1.',
    'A aproximação em Y-8 fica ANTES do contorno.',
    'O último bloco leva a ferramenta para longe: G0 X-60 Y-60.'
  ]
},
{
  id:13, kind:'contour', cols:COLS_BOTH, name:'Perfil com Duas Diagonais', sub:'Absoluta + incremental', modes:['both'], boss:false,
  tip:'Num trecho diagonal, X e Y mudam na mesma linha. Calcule um de cada vez.',
  brief:'Duas diagonais e um degrau. Cada diagonal muda X e Y na mesma linha.',
  pts:[
    {id:'A', x:0,  y:0},
    {id:'B', x:16, y:0},
    {id:'C', x:20, y:4},
    {id:'D', x:20, y:15},
    {id:'E', x:34, y:30},
    {id:'F', x:34, y:45},
    {id:'G', x:48, y:52},
    {id:'H', x:48, y:70},
    {id:'I', x:64, y:70}
  ],
  hints:[
    'D→E é diagonal: ΔX = 14 e ΔY = 15.',
    'F→G é a segunda diagonal: ΔX = 14 e ΔY = 7.',
    'A última linha é degrau reto: ΔY = 0.'
  ]
},
{
  id:14, kind:'contour', cols:COLS_GCODE, name:'Programa Completo', sub:'G-code com chanfro, arco e diagonal', modes:['gcode'], boss:false,
  tip:'Aproxime sempre no ar (G0). Corte reto é G1; corte em arco é G2 (horário) ou G3 (anti-horário) — o raio não vira número na tabela: a função e o ponto final (absoluto e incremental) já definem o arco.',
  brief:'Programa de acabamento inteiro, do ponto de aproximação até o recuo — com um arco de verdade (G2).',
  pts:[
    {id:'N10', x:-60,y:-60,g:'G0', safe:true, note:'ponto de aproximação'},
    {id:'N20', x:14, y:-8, g:'G0', note:'aproximação rápida, perto do contorno'},
    {id:'N30', x:14, y:0,  g:'G1'},
    {id:'N40', x:17, y:3,  g:'G1', note:'chanfro 3x45°'},
    {id:'N50', x:17, y:22, g:'G1'},
    {id:'N60', x:23, y:28, g:'G2', arc:6, note:'arco R6, sentido horário'},
    {id:'N70', x:23, y:48, g:'G1'},
    {id:'N80', x:41, y:58, g:'G1', note:'diagonal'},
    {id:'N90', x:41, y:72, g:'G1'},
    {id:'N100',x:-60,y:-60,g:'G0', safe:true, note:'recuo'}
  ],
  hints:[
    'Blocos N10, N20 e N100 são no ar → G0. Retas cortando são G1; o arco é G2.',
    'O chanfro 3x45° soma 3 mm em X e 3 mm em Y.',
    'N50→N60 é o arco: função G2 (sentido horário). O raio R6 desloca o ponto final 6 mm em X e 6 mm em Y — isso já aparece nas colunas de X e Y, absoluto e incremental.',
    'N70→N80 é diagonal: X vai a 41 enquanto Y vai a 58.'
  ]
},

/* ------------- fases de PROGRAMA (estrutura, M, ciclos de furação) ------------- */
{
  id:15, kind:'program', cols:COLS_FULL, name:'Estrutura do Programa', sub:'Funções auxiliares M e a ordem dos blocos', modes:['prog'], boss:false,
  tip:'Todo programa segue a mesma ordem: chamar ferramenta → zero-peça e giro → posicionar → aproximar com refrigerante → usinar → cancelar → recuar e desligar → fim (M30).',
  brief:'Um programa de fresamento simples, bloco a bloco — preencha só as colunas que aquele bloco realmente usa.',
  pts:[
    {req:['t','m'],           t:'T02', m:'M06', note:'chamada de ferramenta: troca para a ferramenta T02'},
    {req:['g','s','m'],       g:'G54', s:1200,  m:'M03', note:'zero-peça G54, giro 1200 rpm, sentido horário'},
    {req:['g','x','y'],       g:'G0',  x:-10,   y:0,     note:'posiciona rápido, fora da peça'},
    {req:['g','z','m'],       g:'G0',  z:5,     m:'M08', note:'aproxima em Z, 5 mm acima da face, liga o refrigerante'},
    {req:['g','z','f'],       g:'G1',  z:-3,    f:100,   note:'mergulha até a profundidade de corte, avanço lento'},
    {req:['g','x','y','f'],   g:'G1',  x:40,    y:0,     f:250, note:'usina em linha reta, avanço de corte'},
    {req:['g'],                g:'G40', note:'cancela a compensação de raio da ferramenta'},
    {req:['g','z','m'],       g:'G0',  z:5,     m:'M09', note:'recua e desliga o refrigerante'},
    {req:['g','z','m'],       g:'G28', z:0,     m:'M05', note:'retorno ao ponto de referência e para o giro'},
    {req:['m'],                m:'M30', note:'fim de programa e retrocesso à primeira linha'}
  ],
  hints:[
    'Cada linha do programa real só usa as colunas que aquele bloco precisa — o resto fica em branco (—).',
    'A sequência é sempre a mesma: T + M06 troca a ferramenta; G54 + S + M03 liga o giro no zero-peça certo.',
    'M08/M09 ligam e desligam o refrigerante; M05 para o giro; M30 é sempre o último bloco do programa.'
  ]
},
{
  id:16, kind:'program', cols:COLS_FULL, name:'Ciclos de Furação I', sub:'G81 e G82 — furação simples e com pausa', modes:['prog'], boss:false,
  tip:'G81 fura: rápido até o plano R, avanço até Z, recuo rápido. G82 é igual, mas para P segundos no fundo do furo (acabamento). Uma vez chamado com todos os parâmetros, o ciclo é MODAL: no furo seguinte só X e Y mudam.',
  brief:'Três furos com G81 e dois com G82 (com pausa no fundo) — repare como os furos repetidos só pedem X e Y.',
  pts:[
    {req:['t','m'],            t:'T05', m:'M06', note:'chama a broca T05'},
    {req:['g','s','m'],        g:'G54', s:999,   m:'M03', note:'N = 1000·Vc/(π·D) = 1000·31,4/(π·10) ≈ 999 rpm'},
    {req:['g','x','y'],        g:'G0',  x:-10,   y:-10,   note:'posiciona rápido fora da peça'},
    {req:['g','z','m'],        g:'G0',  z:5,     m:'M08', note:'aproxima e liga o refrigerante'},
    {req:['g','x','y','z','r','f'], g:'G81', x:20,y:20,z:-12,r:3,f:120, note:'1º furo — ciclo completo: plano R3, fundo Z-12'},
    {req:['x','y'],            x:50, y:20, note:'2º furo — MODAL: o ciclo G81 já está ativo, só X e Y mudam'},
    {req:['x','y'],            x:80, y:20, note:'3º furo — mesma lógica'},
    {req:['g'],                 g:'G80', note:'cancela o ciclo de furação'},
    {req:['g','x','y','z','r','p','f'], g:'G82', x:20,y:50,z:-8,r:3,p:1,f:100, note:'furo com pausa: P1 segundo parado no fundo'},
    {req:['x','y'],            x:50, y:50, note:'2º furo do G82 — modal de novo, só X e Y'},
    {req:['g'],                 g:'G80', note:'cancela o ciclo'},
    {req:['g','z','m'],        g:'G0',  z:100,   m:'M09', note:'recuo alto, refrigerante fora'},
    {req:['m'],                 m:'M30', note:'fim de programa'}
  ],
  hints:[
    'O ciclo modal economiza digitação: depois do primeiro furo completo, os furos seguintes na mesma família só levam X e Y.',
    'G81 não pausa no fundo; G82 pausa P segundos — é o que dá acabamento melhor num furo raso.',
    'R é o plano de aproximação (folga acima da peça); Z é o fundo do furo, sempre negativo.',
    'S = 1000·Vc/(π·D): com Vc=31,4 m/min e D=10 mm dá aproximadamente 999 rpm.'
  ]
},
{
  id:17, kind:'program', cols:COLS_FULL, name:'Ciclos de Furação II', sub:'G83 peck drilling e G84 rosqueamento', modes:['prog'], boss:false,
  tip:'G83 fura em picadas: a cada passe de Q mm ele recua para quebrar o cavaco — ótimo em furos fundos. G84 rosqueia: o avanço F tem que casar com o passo da rosca, F = S × passo.',
  brief:'Um furo fundo com G83 (picotado) e depois um furo rosqueado com G84 — a broca troca, o macho entra.',
  pts:[
    {req:['t','m'],            t:'T08', m:'M06', note:'chama a broca de picotar T08'},
    {req:['g','s','m'],        g:'G54', s:796,   m:'M03', note:'N = 1000·Vc/(π·D) = 1000·15/(π·6) ≈ 796 rpm'},
    {req:['g','x','y'],        g:'G0',  x:0,     y:0,     note:'posiciona rápido'},
    {req:['g','z','m'],        g:'G0',  z:5,     m:'M08', note:'aproxima e liga o refrigerante'},
    {req:['g','x','y','z','r','q','f'], g:'G83', x:15,y:15,z:-20,r:3,q:5,f:100, note:'furo de 20 mm em picadas de 5 mm (4 picadas)'},
    {req:['x','y'],            x:45, y:15, note:'2º furo — modal, só X e Y'},
    {req:['g'],                 g:'G80', note:'cancela o ciclo'},
    {req:['t','m'],            t:'T09', m:'M06', note:'troca para o macho de roscar M10x1,5'},
    {req:['g','s','m'],        g:'G54', s:500,   m:'M03', note:'rosqueamento usa rotação mais baixa que furação comum'},
    {req:['g','x','y'],        g:'G0',  x:15,    y:45,    note:'posiciona sobre o furo já pré-furado'},
    {req:['g','z','m'],        g:'G0',  z:5,     m:'M08', note:'aproxima'},
    {req:['g','x','y','z','r','f'], g:'G84', x:15,y:45,z:-15,r:3,f:750, note:'F = S × passo = 500 × 1,5 = 750 mm/min'},
    {req:['g'],                 g:'G80', note:'cancela o ciclo'},
    {req:['g','z','m'],        g:'G0',  z:100,   m:'M09', note:'recuo, refrigerante fora'},
    {req:['m'],                 m:'M30', note:'fim de programa'}
  ],
  hints:[
    'Q é a profundidade de CADA picada, não a profundidade total do furo — em furo fundo, várias picadas de Q mm.',
    'G84 é a rosca: a máquina sincroniza o giro com o avanço, por isso F depende do passo da rosca.',
    'F de rosqueamento = S (rpm) × passo (mm/volta). Aqui: 500 × 1,5 = 750 mm/min.',
    'Trocar de broca para macho exige nova chamada de ferramenta (T + M06) e, em geral, rotação mais baixa.'
  ]
},
{
  id:18, kind:'program', cols:COLS_FULL, name:'Peça de Prova', sub:'CHEFE — fresamento e furação no mesmo programa', modes:['prog'], boss:true,
  tip:'Sem pressa: siga a ordem do programa — ferramenta, zero-peça, posicionar, aproximar, usinar, cancelar, trocar de ferramenta de novo, furar, recuar, fim.',
  brief:'17 blocos: contorno fresado com chanfro-degrau retangular e um furo G81 no meio da peça. Prove que virou programador de centro de usinagem.',
  pts:[
    {req:['t','m'],            t:'T01', m:'M06', note:'fresa de topo T01'},
    {req:['g','s','m'],        g:'G54', s:1200,  m:'M03', note:'zero-peça e giro'},
    {req:['g','x','y'],        g:'G0',  x:0,     y:0,     note:'posiciona no 1º canto, fora do material em Z'},
    {req:['g','z','m'],        g:'G0',  z:5,     m:'M08', note:'aproxima e liga o refrigerante'},
    {req:['g','z','f'],        g:'G1',  z:-3,    f:100,   note:'mergulha até a profundidade de corte'},
    {req:['g','x','y','f'],    g:'G1',  x:40,    y:0,     f:300, note:'usina o 1º lado'},
    {req:['g','x','y'],        g:'G1',  x:40,    y:25,    note:'2º lado'},
    {req:['g','x','y'],        g:'G1',  x:0,     y:25,    note:'3º lado'},
    {req:['g','x','y'],        g:'G1',  x:0,     y:0,     note:'fecha o contorno'},
    {req:['g','z','m'],        g:'G0',  z:5,     m:'M09', note:'recua, refrigerante fora'},
    {req:['t','m'],            t:'T05', m:'M06', note:'troca para a broca'},
    {req:['g','s','m'],        g:'G54', s:995,   m:'M03', note:'N = 1000·25/(π·8) ≈ 995 rpm'},
    {req:['g','x','y'],        g:'G0',  x:20,    y:12,    note:'posiciona sobre o centro do furo'},
    {req:['g','z','m'],        g:'G0',  z:5,     m:'M08', note:'aproxima, refrigerante ligado'},
    {req:['g','x','y','z','r','f'], g:'G81', x:20,y:12,z:-15,r:3,f:120, note:'fura no centro da peça'},
    {req:['g'],                 g:'G80', note:'cancela o ciclo'},
    {req:['g','z','m'],        g:'G0',  z:100,   m:'M09', note:'recuo alto, refrigerante fora'},
    {req:['g','z','m'],        g:'G28', z:0,     m:'M05', note:'retorno de referência, para o giro'},
    {req:['m'],                 m:'M30', note:'fim de programa'}
  ],
  hints:[
    'O programa inteiro é: ferramenta → zero-peça/giro → posicionar → aproximar → usinar o contorno → cancelar/recuar → trocar de ferramenta → furar → recuar de vez → fim.',
    'O contorno fecha: a última linha de fresamento volta exatamente ao ponto de partida (0,0).',
    'A troca de ferramenta pede T + M06 de novo, e o novo giro pede G54 + S + M03 de novo — a máquina não guarda o giro entre ferramentas.'
  ]
}
];
const LEVELS_COUNT = LEVELS.length;

/* ---- gerador do Modo Infinito (desbloqueado na fase 15) ---- */
function makeEndlessLevel(seedRun){
  const R=(a,b,st=1)=> a + st*Math.floor(Math.random()*((b-a)/st+1));
  const run  = Math.max(1, seedRun|0);
  const tier = Math.min(4, Math.floor((run-1)/4));
  const ALPHA='ABCDEFGHIJKLMN';

  /* a partir da rodada 13 (tier 3), 35% de chance de virar um desafio de furação */
  if(tier>=3 && Math.random()<0.35) return makeEndlessDrill(run,tier);

  const nGeo = Math.min(12, 5 + Math.floor(run/2) + tier);
  const ch = R(2,3);
  let x = R(12,26,2), y = 0;
  const geo=[{x:0, y:0, note:'zero-peça'}];
  geo.push({x:x-ch, y:0,  note:`entrada do chanfro ${ch}x45° (${x} − ${ch})`});
  geo.push({x:x,    y:ch, note:'fim do chanfro'});
  y = ch;
  let lastWasStep = true;
  while(geo.length < nGeo){
    const left = nGeo - geo.length;
    if(lastWasStep || left===1){ y += R(10,26,1); geo.push({x, y}); lastWasStep=false; continue; }
    let grow = R(8,16,2);
    if(x+grow > 80) grow = 80-x;
    if(grow < 8){ y += R(10,20); geo.push({x, y}); lastWasStep=false; continue; }
    const roll = Math.random();
    if(tier>=2 && left>=2 && roll<.30){
      const r = R(2,3);
      geo.push({x:x+grow-r, y, note:`início do raio R${r}`});
      x += grow; y += r;
      geo.push({x, y, arc:r, note:`fim do raio R${r}`});
    } else if(tier>=1 && roll<.60){
      x += grow; y += R(4,10);
      geo.push({x, y, note:'diagonal'});
    } else {
      x += grow; geo.push({x, y});
    }
    lastWasStep = true;
  }
  if(lastWasStep && geo.length<nGeo){ y += R(10,20); geo.push({x, y, note:'fim do contorno'}); }

  const POOL = run<6 ? ['abs','inc','both','abs','inc','both']
                     : ['both','gcode','abs','both','inc','gcode'];
  const modes = [ POOL[run % POOL.length] ];
  const isG   = modes[0]==='gcode';
  const useSafe = isG || (run>=8 && modes[0]!=='inc');
  const cols  = isG ? COLS_GCODE : modes[0]==='abs' ? COLS_ABS : modes[0]==='inc' ? COLS_INC : COLS_BOTH;

  const pts=[];
  if(isG){
    let n=0;
    const blk = o => pts.push(Object.assign({id:'N'+(10*++n)}, o));
    if(useSafe) blk({x:-60, y:-60, g:'G0', safe:true, note:'ponto de aproximação'});
    blk({x:geo[1].x, y:-8, g:'G0', note:'aproximação rápida, perto do contorno'});
    geo.forEach(p => blk(Object.assign({}, p, {g:'G1'})));
    if(useSafe) blk({x:-60, y:-60, g:'G0', safe:true, note:'recuo'});
  } else if(useSafe){
    let n=1;
    pts.push({id:'P1', x:-50, y:-50, safe:true, note:'ponto de aproximação'});
    geo.forEach((p,i) => pts.push(Object.assign({}, p, {id:'P'+(++n)})));
  } else {
    geo.forEach((p,i) => pts.push(Object.assign({}, p, {id:ALPHA[i]})));
  }

  const nivel = ['aquecimento','com diagonal','com raio','longa','completa'][tier];
  return {
    id:'inf', kind:'contour', cols, name:'Modo Infinito #'+run, sub:MODE_LABEL[modes[0]], modes, endless:true, boss:false,
    tip: isG ? 'G0 = no ar (aproximação e recuo). G1 = cortando.'
             : 'Contorno gerado na hora. Mesma leitura de sempre: X e Y no plano, sem diâmetro.',
    brief:`Desafio aleatório (${nivel}) — ${pts.length} linhas nesta rodada.`,
    pts,
    hints:[
      'X e Y são só posição no plano — sem diâmetro.',
      isG ? 'Aproximação e recuo não cortam nada → G0. Todo bloco que toca material → G1.'
          : 'Degrau reto: um dos dois eixos não muda entre as linhas.',
      useSafe ? 'O ponto de aproximação não aparece no desenho: bem longe do contorno, geralmente negativo.'
              : (modes[0]==='inc'||modes[0]==='both') ? 'Confira a soma dos incrementais com o último valor absoluto.'
              : 'X e Y são posição no plano — sem coluna extra aqui.'
    ]
  };
}
function makeEndlessDrill(run,tier){
  const R=(a,b,st=1)=> a + st*Math.floor(Math.random()*((b-a)/st+1));
  const n = Math.min(6, 3+tier);
  const z = -R(8,20), r=3, f=R(90,150,10);
  const pts=[
    {req:['g','x','y'], g:'G0', x:-10, y:-10, note:'posiciona fora da peça'},
    {req:['g','z','m'], g:'G0', z:5, m:'M08', note:'aproxima, refrigerante ligado'},
    {req:['g','x','y','z','r','f'], g:'G81', x:R(10,30,2), y:R(10,30,2), z, r, f, note:'1º furo — ciclo completo'}
  ];
  let lastX=pts[2].x;
  for(let i=1;i<n;i++){ lastX+=R(20,35,5); pts.push({req:['x','y'], x:lastX, y:pts[2].y, note:'furo modal — só X e Y'}); }
  pts.push({req:['g'], g:'G80', note:'cancela o ciclo'});
  pts.push({req:['g','z','m'], g:'G0', z:100, m:'M09', note:'recuo, refrigerante fora'});
  pts.push({req:['m'], m:'M30', note:'fim de programa'});
  return {
    id:'inf', kind:'program', cols:COLS_FULL, name:'Modo Infinito #'+run, sub:'Furação em série', modes:['prog'], endless:true, boss:false,
    tip:'Depois do primeiro furo com todos os parâmetros, o ciclo é modal — os furos seguintes só precisam de X e Y.',
    brief:`Desafio de furação aleatório — ${n} furos nesta rodada.`,
    pts,
    hints:[
      'R é o plano de folga; Z é o fundo do furo, sempre negativo.',
      'Uma vez chamado o ciclo, ele fica ativo: só cancela com G80.',
      'Furos modais (repetidos) só pedem X e Y novos — o resto continua valendo.'
    ]
  };
}
