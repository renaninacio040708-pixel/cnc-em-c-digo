// Conteúdo pedagógico, baseado no curso "C Programming Full Course" (bro code).
// Cada SESSION corresponde a um capítulo (ou grupo de capítulos) do vídeo.
// Cada phase é um desafio de código: você digita ou altera um trecho de C de verdade.
//
// Tipos de desafio:
//  - 'code'  : desafio de digitação/alteração. Campos:
//      instruction    -> o que fazer
//      context_before -> código fixo (read-only) mostrado ANTES da parte editável (pode ser "")
//      seed           -> texto inicial no campo editável ("" = campo em branco / "código existente" = alterar)
//      target         -> resposta certa (comparada ignorando espaços/quebras de linha)
//      context_after  -> código fixo (read-only) mostrado DEPOIS da parte editável (pode ser "")
//      expectedOutput -> o que o programa imprimiria (null se for só declaração, sem saída)
//      hint           -> dica
//  - 'mcq'/'text' : pergunta rápida de conceito (mesmo formato do sistema anterior)

const SESSIONS = [
  {
    id: 1,
    chapterRef: "9:53 no vídeo — “your first C program”",
    title: "Primeiro programa",
    icon: "🖥️",
    intro: `
      <p>Todo programa em C começa com esse "esqueleto":</p>
      <pre><code>#include &lt;stdio.h&gt;

int main() {
    printf("Hello, World!\\n");
    return 0;
}</code></pre>
      <p><code>\\n</code> dentro do texto é um caractere especial que <b>pula linha</b>.
      Sem ele, tudo que você imprimir fica grudado na mesma linha.</p>`,
    phases: [
      {
        type: "code",
        instruction: "Complete a linha que imprime \"Hello, World!\" seguida de quebra de linha.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    printf("Hello, World!\\n");',
        context_after: "    return 0;\n}",
        expectedOutput: "Hello, World!",
        hint: 'Use printf com \\n no final do texto, dentro das aspas.'
      },
      {
        type: "code",
        instruction: 'Altere o texto para imprimir "Aprendendo C!" no lugar de "Hello, World!".',
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: '    printf("Hello, World!\\n");',
        target: '    printf("Aprendendo C!\\n");',
        context_after: "    return 0;\n}",
        expectedOutput: "Aprendendo C!",
        hint: "Só o texto entre aspas muda. Mantenha o \\n no final."
      },
      {
        type: "code",
        instruction: 'A primeira linha já imprime "Aprendendo C!". Adicione uma SEGUNDA linha de printf, logo abaixo, imprimindo "Vamos praticar.".',
        context_before: '#include <stdio.h>\n\nint main() {\n    printf("Aprendendo C!\\n");',
        seed: "",
        target: '    printf("Vamos praticar.\\n");',
        context_after: "    return 0;\n}",
        expectedOutput: "Aprendendo C!\nVamos praticar.",
        hint: "Mesma estrutura da linha de cima, só muda o texto."
      },
      {
        type: "mcq",
        q: 'O que "\\n" faz dentro de um printf?',
        options: ["Apaga o texto", "Pula uma linha", "Deixa maiúsculo", "Nada, é decorativo"],
        answer: 1,
        hint: "É o motivo de cada printf aparecer em uma linha separada.",
        explain: '\\n é o caractere de "nova linha" — sem ele, dois printf seguidos ficariam colados.'
      }
    ]
  },

  {
    id: 2,
    chapterRef: "15:04 no vídeo — “variables”",
    title: "Variáveis",
    icon: "📦",
    intro: `
      <p>Uma variável guarda um valor com um tipo definido:</p>
      <pre><code>int idade = 25;
float diametro = 12.5;
char inicial = 'R';</code></pre>
      <ul>
        <li><code>int</code> — números inteiros</li>
        <li><code>float</code> — números com casas decimais</li>
        <li><code>char</code> — um único caractere, entre aspas <b>simples</b></li>
      </ul>
      <p>Pra imprimir o valor de uma variável, usamos um "marcador" no printf:
      <code>%d</code> para int, <code>%f</code> para float, <code>%c</code> para char.</p>`,
    phases: [
      {
        type: "code",
        instruction: "Declare uma variável inteira chamada idade, com valor 25.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: "    int idade = 25;",
        context_after: "    return 0;\n}",
        expectedOutput: null,
        hint: "tipo nome = valor;"
      },
      {
        type: "code",
        instruction: "Agora imprima o valor de idade usando %d.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int idade = 25;",
        seed: "",
        target: '    printf("%d", idade);',
        context_after: "    return 0;\n}",
        expectedOutput: "25",
        hint: '%d representa um int dentro do printf.'
      },
      {
        type: "code",
        instruction: "Mude o valor de idade de 25 para 30 (o printf de baixo continua igual).",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "    int idade = 25;",
        target: "    int idade = 30;",
        context_after: '    printf("%d", idade);\n    return 0;\n}',
        expectedOutput: "30",
        hint: "Só o número depois do = muda."
      },
      {
        type: "code",
        instruction: "Declare uma variável float chamada diametro com valor 12.5.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: "    float diametro = 12.5;",
        context_after: "    return 0;\n}",
        expectedOutput: null,
        hint: "Mesma estrutura do int, só troca o tipo."
      },
      {
        type: "code",
        instruction: "Declare uma variável char chamada inicial com o valor 'R' (aspas simples!).",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: "    char inicial = 'R';",
        context_after: "    return 0;\n}",
        expectedOutput: null,
        hint: "char usa aspas simples: 'X', nunca aspas duplas."
      },
      {
        type: "code",
        instruction: "Declare três inteiros x, y e z, todos na MESMA linha, com valores 1, 2 e 3.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: "    int x = 1, y = 2, z = 3;",
        context_after: "    return 0;\n}",
        expectedOutput: null,
        hint: "int a = 1, b = 2, c = 3; — separa por vírgula."
      },
      {
        type: "mcq",
        q: "Qual tipo você usaria para guardar a letra 'S' de \"Sim\"?",
        options: ["int", "float", "char", "string"],
        answer: 2,
        hint: "É um único caractere.",
        explain: "char guarda exatamente um caractere, entre aspas simples."
      }
    ]
  },

  {
    id: 3,
    chapterRef: "35:06 no vídeo — “format specifiers”",
    title: "Especificadores de formato",
    icon: "🎯",
    intro: `
      <p>Cada tipo tem seu marcador no printf/scanf:</p>
      <pre><code>%d   int
%f   float (padrão 6 casas decimais)
%.2f float com 2 casas decimais
%c   char
%s   texto (string)</code></pre>
      <p>Dá pra combinar vários na mesma chamada de printf, na ordem em que aparecem:</p>
      <pre><code>printf("Idade: %d anos", idade);</code></pre>`,
    phases: [
      {
        type: "code",
        instruction: "Imprima o número 10 usando %d.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    printf("%d", 10);',
        context_after: "    return 0;\n}",
        expectedOutput: "10",
        hint: "printf(\"%d\", numero);"
      },
      {
        type: "code",
        instruction: "Imprima o número 3.14159 usando %.2f (2 casas decimais).",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    printf("%.2f", 3.14159);',
        context_after: "    return 0;\n}",
        expectedOutput: "3.14",
        hint: "O número depois do ponto em %.2f define quantas casas decimais aparecem."
      },
      {
        type: "code",
        instruction: "Imprima o caractere 'A' usando %c.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    printf("%c", \'A\');',
        context_after: "    return 0;\n}",
        expectedOutput: "A",
        hint: "O valor 'A' vai direto no printf, com aspas simples."
      },
      {
        type: "code",
        instruction: "Complete o printf pra mostrar: Idade: 25, Altura: 1.7 — usando %d para idade (25) e %.1f para altura (1.73).",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    printf("Idade: %d, Altura: %.1f", 25, 1.73);',
        context_after: "    return 0;\n}",
        expectedOutput: "Idade: 25, Altura: 1.7",
        hint: "Dois marcadores no texto = dois valores depois da vírgula, na mesma ordem."
      },
      {
        type: "mcq",
        q: "Qual especificador usamos para imprimir um texto (string)?",
        options: ["%t", "%s", "%txt", "%w"],
        answer: 1,
        hint: "s de 'string'.",
        explain: "%s é o marcador padrão para texto em C."
      }
    ]
  },

  {
    id: 4,
    chapterRef: "44:15 no vídeo — “arithmetic operators”",
    title: "Operadores aritméticos",
    icon: "➗",
    intro: `
      <p>Os 5 operadores matemáticos básicos de C:</p>
      <pre><code>+   soma
-   subtracao
*   multiplicacao
/   divisao
%   resto da divisao (modulo)</code></pre>
      <p><b>Atenção:</b> divisão entre dois <code>int</code> descarta a parte decimal.
      <code>7 / 2</code> dá <b>3</b>, não 3.5.</p>`,
    phases: [
      {
        type: "code",
        instruction: "Imprima o resultado de 5 + 3.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    printf("%d", 5 + 3);',
        context_after: "    return 0;\n}",
        expectedOutput: "8",
        hint: "printf(\"%d\", a + b);"
      },
      {
        type: "code",
        instruction: "Imprima o resultado de 10 - 4.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    printf("%d", 10 - 4);',
        context_after: "    return 0;\n}",
        expectedOutput: "6",
        hint: "Troque só o sinal e os números do desafio anterior."
      },
      {
        type: "code",
        instruction: "Imprima o resultado de 6 * 7.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    printf("%d", 6 * 7);',
        context_after: "    return 0;\n}",
        expectedOutput: "42",
        hint: "* é o sinal de multiplicação em C (não é x)."
      },
      {
        type: "code",
        instruction: "Imprima o resultado de 20 / 4.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    printf("%d", 20 / 4);',
        context_after: "    return 0;\n}",
        expectedOutput: "5",
        hint: "20 dividido por 4 é exato."
      },
      {
        type: "code",
        instruction: "Imprima o RESTO da divisão de 10 por 3 (use %).",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    printf("%d", 10 % 3);',
        context_after: "    return 0;\n}",
        expectedOutput: "1",
        hint: "10 dividido por 3 dá 3 com resto 1. % devolve esse resto."
      }
    ]
  },

  {
    id: 5,
    chapterRef: "50:40 no vídeo — “user input”",
    title: "Entrada do usuário",
    icon: "⌨️",
    intro: `
      <p><code>scanf</code> lê o que o usuário digita. Ele precisa do <b>endereço</b> da
      variável (por isso o <code>&amp;</code>):</p>
      <pre><code>int idade;
printf("Digite sua idade: ");
scanf("%d", &idade);
printf("Voce tem %d anos", idade);</code></pre>`,
    phases: [
      {
        type: "code",
        instruction: "Declare uma variável inteira chamada idade (sem valor ainda).",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: "    int idade;",
        context_after: '    scanf("%d", &idade);\n    return 0;\n}',
        expectedOutput: null,
        hint: "Só o tipo e o nome, sem = valor."
      },
      {
        type: "code",
        instruction: "Complete o scanf para ler um inteiro e guardar em idade.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int idade;",
        seed: "",
        target: '    scanf("%d", &idade);',
        context_after: "    return 0;\n}",
        expectedOutput: null,
        hint: "Não esqueça o & antes do nome da variável."
      },
      {
        type: "code",
        instruction: "A variável já é float. Troque %d por %f no scanf, para ler um número decimal em vez de inteiro.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: '    float peso;\n    scanf("%d", &peso);',
        target: '    float peso;\n    scanf("%f", &peso);',
        context_after: "    return 0;\n}",
        expectedOutput: null,
        hint: "float combina com %f, não com %d."
      },
      {
        type: "mcq",
        q: "Por que colocamos & antes da variável no scanf?",
        options: [
          "É só estilo, não muda nada",
          "Indica o endereço de memória da variável, pra scanf saber onde guardar o valor",
          "Transforma a variável em texto",
          "É obrigatório só para float"
        ],
        answer: 1,
        hint: "Pensa em '& = endereço na memória'.",
        explain: "scanf precisa saber ONDE guardar o valor lido — & aponta pro endereço da variável."
      }
    ]
  },

  {
    id: 6,
    chapterRef: "1:44:28 no vídeo — “if statements”",
    title: "Condicionais: if",
    icon: "🔀",
    intro: `
      <p><code>if</code> só executa o bloco se a condição for verdadeira. <code>else</code>
      cobre o "caso contrário":</p>
      <pre><code>if (idade > 18) {
    printf("Maior de idade");
} else {
    printf("Menor de idade");
}</code></pre>
      <p>Operadores de comparação: <code>&gt;</code> <code>&lt;</code> <code>&gt;=</code>
      <code>&lt;=</code> <code>==</code> (igual) <code>!=</code> (diferente).</p>`,
    phases: [
      {
        type: "code",
        instruction: "Escreva um if que imprime \"Maior de idade\" quando idade for maior que 18.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int idade = 25;",
        seed: "",
        target: '    if (idade > 18) {\n        printf("Maior de idade");\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "Maior de idade",
        hint: "if (condicao) {\n    codigo\n}"
      },
      {
        type: "code",
        instruction: "Adicione um else, logo depois do if, que imprime \"Menor de idade\" caso a condição seja falsa.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int idade = 25;",
        seed: '    if (idade > 18) {\n        printf("Maior de idade");\n    }',
        target: '    if (idade > 18) {\n        printf("Maior de idade");\n    }\n    else {\n        printf("Menor de idade");\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "Maior de idade",
        hint: "else vem logo após a chave de fechamento do if, sem condição."
      },
      {
        type: "code",
        instruction: "Escreva um if/else que imprime \"Par\" se num for divisível por 2 (resto 0), ou \"Impar\" caso contrário.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int num = 7;",
        seed: "",
        target: '    if (num % 2 == 0) {\n        printf("Par");\n    }\n    else {\n        printf("Impar");\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "Impar",
        hint: "Use % 2 == 0 para testar se é par."
      },
      {
        type: "mcq",
        q: "Qual operador representa 'maior ou igual'?",
        options: [">=", "=>", "==", "<>"],
        answer: 0,
        hint: "O sinal de maior vem antes do igual.",
        explain: ">= testa se o valor da esquerda é maior OU igual ao da direita."
      },
      {
        type: "text",
        q: "O que este código imprime?\n\nint x = 4;\nif (x > 10) {\n  printf(\"A\");\n} else if (x > 2) {\n  printf(\"B\");\n} else {\n  printf(\"C\");\n}",
        answer: "B",
        hint: "4 não é maior que 10, mas é maior que 2.",
        explain: "A primeira condição (x>10) é falsa. A segunda (x>2) é verdadeira, então imprime B."
      }
    ]
  },

  {
    id: 7,
    chapterRef: "2:10:27 no vídeo — “switches”",
    title: "Switch",
    icon: "🔁",
    intro: `
      <p><code>switch</code> compara uma variável com vários valores possíveis. Cada
      <code>case</code> precisa de <code>break</code> pra não "vazar" pro próximo:</p>
      <pre><code>switch (estacao) {
    case 1:
        printf("Verao");
        break;
    case 2:
        printf("Inverno");
        break;
    default:
        printf("Desconhecida");
}</code></pre>`,
    phases: [
      {
        type: "code",
        instruction: "Complete o switch: case 1 imprime \"Verao\", case 2 imprime \"Inverno\", default imprime \"Desconhecida\".",
        context_before: "#include <stdio.h>\n\nint main() {\n    int estacao = 1;",
        seed: "",
        target: '    switch (estacao) {\n        case 1:\n            printf("Verao");\n            break;\n        case 2:\n            printf("Inverno");\n            break;\n        default:\n            printf("Desconhecida");\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "Verao",
        hint: "Cada case termina com break; (menos o default, que é o último)."
      },
      {
        type: "code",
        instruction: "Mude o valor de estacao de 1 para 2 (o switch abaixo continua igual).",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "    int estacao = 1;",
        target: "    int estacao = 2;",
        context_after: '\n    switch (estacao) {\n        case 1:\n            printf("Verao");\n            break;\n        case 2:\n            printf("Inverno");\n            break;\n        default:\n            printf("Desconhecida");\n    }\n    return 0;\n}',
        expectedOutput: "Inverno",
        hint: "Só o número depois do = muda."
      },
      {
        type: "code",
        instruction: "Adicione o case que falta: quando cor for 'V', imprime \"Verde\" (com break).",
        context_before: "#include <stdio.h>\n\nint main() {\n    char cor = 'V';\n    switch (cor) {\n        case 'A':\n            printf(\"Azul\");\n            break;",
        seed: "",
        target: "        case 'V':\n            printf(\"Verde\");\n            break;",
        context_after: '\n        default:\n            printf("Cor desconhecida");\n    }\n    return 0;\n}',
        expectedOutput: "Verde",
        hint: "Mesma estrutura do case 'A', só troca a letra e o texto."
      },
      {
        type: "mcq",
        q: "O que break faz dentro de um case do switch?",
        options: ["Sai do switch, evitando cair no próximo case", "Repete o case atual", "Encerra o programa inteiro", "Não faz nada"],
        answer: 0,
        hint: "Sem ele, a execução 'vaza' pro case seguinte.",
        explain: "break interrompe o switch assim que um case bate — sem ele, os próximos cases também rodariam."
      }
    ]
  },

  {
    id: 8,
    chapterRef: "2:18:34 e 2:34:23 no vídeo — “nested if” + “logical operators”",
    title: "If aninhado & operadores lógicos",
    icon: "🧠",
    intro: `
      <p>Dá pra colocar um if dentro de outro (if aninhado), e combinar condições com
      operadores lógicos:</p>
      <pre><code>&&   E (as duas precisam ser verdadeiras)
||   OU (basta uma ser verdadeira)
!    NAO (inverte o valor logico)</code></pre>
      <pre><code>if (idade >= 18 && temCarteira == 1) {
    printf("Pode dirigir");
}</code></pre>`,
    phases: [
      {
        type: "code",
        instruction: "Escreva um if que imprime \"Pode dirigir\" só quando idade for >= 18 E temCarteira for igual a 1.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int idade = 20;\n    int temCarteira = 1;",
        seed: "",
        target: '    if (idade >= 18 && temCarteira == 1) {\n        printf("Pode dirigir");\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "Pode dirigir",
        hint: "&& exige as duas condições verdadeiras ao mesmo tempo."
      },
      {
        type: "code",
        instruction: "Troque temCarteira de 1 para 0 (sem carteira). Repare o que acontece com a saída.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int idade = 20;",
        seed: "    int temCarteira = 1;",
        target: "    int temCarteira = 0;",
        context_after: '\n    if (idade >= 18 && temCarteira == 1) {\n        printf("Pode dirigir");\n    }\n    return 0;\n}',
        expectedOutput: "",
        hint: "Com && , se UMA condição for falsa, o bloco inteiro não roda."
      },
      {
        type: "code",
        instruction: "Escreva um if de fora checando idade >= 18, e DENTRO dele outro if checando temCarteira == 1, que imprime \"Pode dirigir sozinho\".",
        context_before: "#include <stdio.h>\n\nint main() {\n    int idade = 20;\n    int temCarteira = 1;",
        seed: "",
        target: '    if (idade >= 18) {\n        if (temCarteira == 1) {\n            printf("Pode dirigir sozinho");\n        }\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "Pode dirigir sozinho",
        hint: "O segundo if fica todo dentro das chaves { } do primeiro."
      },
      {
        type: "mcq",
        q: "Qual operador lógico exige que AS DUAS condições sejam verdadeiras?",
        options: ["&&", "||", "!", "=="],
        answer: 0,
        hint: "Pense em 'E' (ambas).",
        explain: "&& (E lógico) só é verdadeiro quando os dois lados são verdadeiros."
      },
      {
        type: "mcq",
        q: "O que o operador ! faz com uma condição?",
        options: ["Inverte o valor lógico (verdadeiro vira falso)", "Soma 1 ao valor", "Não faz nada", "Compara igualdade"],
        answer: 0,
        hint: "! de 'negação'.",
        explain: "! inverte: !verdadeiro = falso, !falso = verdadeiro."
      }
    ]
  },

  {
    id: 9,
    chapterRef: "2:41:49 a 3:05:26 no vídeo — “functions”, “return”, “scope”, “prototypes”",
    title: "Funções",
    icon: "🧩",
    intro: `
      <p>Funções são blocos de código reutilizáveis, com nome, parâmetros e um tipo de
      retorno:</p>
      <pre><code>int dobro(int x) {
    return x * 2;
}</code></pre>
      <p><code>int</code> antes do nome é o que a função <b>devolve</b>. Se ela não devolve
      nada, usamos <code>void</code>. Uma variável criada DENTRO de uma função só existe ali
      (escopo local).</p>`,
    phases: [
      {
        type: "code",
        instruction: "Escreva a função dobro, que recebe um int x e devolve x * 2.",
        context_before: "#include <stdio.h>\n\n",
        seed: "",
        target: "int dobro(int x) {\n    return x * 2;\n}",
        context_after: '\n\nint main() {\n    printf("%d", dobro(5));\n    return 0;\n}',
        expectedOutput: "10",
        hint: "tipoDeRetorno nome(tipo parametro) { return ...; }"
      },
      {
        type: "code",
        instruction: "Chame a função dobro passando 8, dentro do printf.",
        context_before: "#include <stdio.h>\n\nint dobro(int x) {\n    return x * 2;\n}\n\nint main() {",
        seed: "",
        target: '    printf("%d", dobro(8));',
        context_after: "\n    return 0;\n}",
        expectedOutput: "16",
        hint: "printf(\"%d\", dobro(numero));"
      },
      {
        type: "code",
        instruction: "Transforme a função dobro em triplo: renomeie e faça ela devolver x * 3.",
        context_before: "#include <stdio.h>\n\n",
        seed: "int dobro(int x) {\n    return x * 2;\n}",
        target: "int triplo(int x) {\n    return x * 3;\n}",
        context_after: '\n\nint main() {\n    printf("%d", triplo(4));\n    return 0;\n}',
        expectedOutput: "12",
        hint: "Troque o nome da função e o número da multiplicação."
      },
      {
        type: "code",
        instruction: "Escreva uma função void chamada saudacao, sem parâmetros, que imprime \"Ola!\" (void = não devolve nada).",
        context_before: "#include <stdio.h>\n\n",
        seed: "",
        target: 'void saudacao() {\n    printf("Ola!");\n}',
        context_after: "\n\nint main() {\n    saudacao();\n    return 0;\n}",
        expectedOutput: "Ola!",
        hint: "void nome() { ... } — sem return de valor."
      },
      {
        type: "mcq",
        q: "Se uma função não devolve nenhum valor, qual palavra usamos no lugar do tipo de retorno?",
        options: ["void", "null", "none", "empty"],
        answer: 0,
        hint: "Significa 'vazio'.",
        explain: "void indica que a função não retorna valor algum."
      },
      {
        type: "mcq",
        q: "Uma variável criada DENTRO de uma função existe...",
        options: ["só dentro dessa função (escopo local)", "no programa inteiro", "só depois do return", "em nenhum lugar"],
        answer: 0,
        hint: "É o conceito de 'escopo'.",
        explain: "Variáveis locais só existem enquanto a função está rodando — fora dela, não podem ser acessadas."
      }
    ]
  },

  {
    id: 10,
    chapterRef: "3:10:31 no vídeo — “while loops”",
    title: "Loops: while",
    icon: "🔂",
    intro: `
      <p><code>while</code> repete um bloco enquanto a condição for verdadeira. Você
      precisa atualizar a variável dentro do loop, senão ele nunca para:</p>
      <pre><code>int i = 1;
while (i <= 5) {
    printf("%d", i);
    i++;
}
// imprime: 12345</code></pre>`,
    phases: [
      {
        type: "code",
        instruction: "Escreva um while que imprime 1 2 3 4 5 (sem espaços), usando i começando em 1.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int i = 1;",
        seed: "",
        target: '    while (i <= 5) {\n        printf("%d", i);\n        i++;\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "12345",
        hint: "Não esqueça o i++; dentro do loop, senão ele nunca termina."
      },
      {
        type: "code",
        instruction: "Mude a condição do loop para parar em i <= 3 em vez de i <= 5.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int i = 1;",
        seed: '    while (i <= 5) {\n        printf("%d", i);\n        i++;\n    }',
        target: '    while (i <= 3) {\n        printf("%d", i);\n        i++;\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "123",
        hint: "Só o número de comparação muda."
      },
      {
        type: "code",
        instruction: "Escreva uma contagem regressiva com while: de 5 até 1, imprimindo cada número.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int i = 5;",
        seed: "",
        target: '    while (i >= 1) {\n        printf("%d", i);\n        i--;\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "54321",
        hint: "Dessa vez a condição é >= e o passo é i-- (diminuindo)."
      },
      {
        type: "mcq",
        q: "O que acontece se você esquecer de fazer i++ (ou i--) dentro de um while?",
        options: ["Loop infinito", "Erro de compilação", "O loop roda só uma vez", "Nada muda"],
        answer: 0,
        hint: "A condição nunca deixa de ser verdadeira.",
        explain: "Sem atualizar a variável, a condição do while nunca fica falsa, e o programa trava em loop infinito."
      }
    ]
  },

  {
    id: 11,
    chapterRef: "3:21:57 no vídeo — “for loops”",
    title: "Loops: for",
    icon: "🔁",
    intro: `
      <p><code>for</code> junta início, condição e incremento numa linha só — ótimo quando
      você já sabe quantas vezes repetir:</p>
      <pre><code>for (int i = 1; i <= 5; i++) {
    printf("%d", i);
}
// imprime: 12345</code></pre>`,
    phases: [
      {
        type: "code",
        instruction: "Escreva um for que imprime 1 2 3 4 5 (sem espaços).",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    for (int i = 1; i <= 5; i++) {\n        printf("%d", i);\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "12345",
        hint: "for (inicio; condicao; incremento) { codigo }"
      },
      {
        type: "code",
        instruction: "Mude o limite do loop de 5 para 10.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: '    for (int i = 1; i <= 5; i++) {\n        printf("%d", i);\n    }',
        target: '    for (int i = 1; i <= 10; i++) {\n        printf("%d", i);\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "12345678910",
        hint: "Só o número da condição (i <= X) muda."
      },
      {
        type: "code",
        instruction: "Use um for para somar os números de 1 a 5 na variável soma, e imprima o total.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int soma = 0;",
        seed: "",
        target: '    for (int i = 1; i <= 5; i++) {\n        soma += i;\n    }\n    printf("%d", soma);',
        context_after: "\n    return 0;\n}",
        expectedOutput: "15",
        hint: "soma += i; é o mesmo que soma = soma + i;"
      },
      {
        type: "mcq",
        q: "Quais são as 3 partes dentro dos parênteses de um for?",
        options: ["início; condição; incremento", "início, fim, passo (sem ponto e vírgula)", "tipo; nome; valor", "condição; início; fim"],
        answer: 0,
        hint: "Nessa ordem, separadas por ponto e vírgula.",
        explain: "for (início; condição; incremento) — as três partes, separadas por ;"
      }
    ]
  },

  {
    id: 12,
    chapterRef: "3:27:56 e 3:30:16 no vídeo — “break & continue” + “nested loops”",
    title: "break/continue & loops aninhados",
    icon: "⏭️",
    intro: `
      <p><code>break</code> encerra o loop de vez. <code>continue</code> pula só a
      iteração atual e segue pra próxima. Um loop dentro de outro é um "loop aninhado":</p>
      <pre><code>for (int i = 1; i <= 2; i++) {
    for (int j = 1; j <= 3; j++) {
        printf("*");
    }
}
// imprime 6 asteriscos (2 x 3)</code></pre>`,
    phases: [
      {
        type: "code",
        instruction: "Escreva um for de 1 a 10 que usa break para parar assim que i chegar a 6 (deve imprimir 1 2 3 4 5).",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    for (int i = 1; i <= 10; i++) {\n        if (i == 6) {\n            break;\n        }\n        printf("%d", i);\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "12345",
        hint: "break sai do for completamente quando a condição do if bate."
      },
      {
        type: "code",
        instruction: "Escreva um for de 1 a 5 que usa continue para PULAR a impressão quando i for igual a 3 (deve imprimir 1 2 4 5).",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    for (int i = 1; i <= 5; i++) {\n        if (i == 3) {\n            continue;\n        }\n        printf("%d", i);\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "1245",
        hint: "continue pula pro próximo i sem executar o resto do bloco."
      },
      {
        type: "code",
        instruction: "Escreva dois for aninhados que imprimem 6 asteriscos: o de fora de 1 a 2, o de dentro de 1 a 3.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    for (int i = 1; i <= 2; i++) {\n        for (int j = 1; j <= 3; j++) {\n            printf("*");\n        }\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "******",
        hint: "O for de dentro roda inteiro pra cada volta do for de fora: 2 x 3 = 6."
      },
      {
        type: "mcq",
        q: "Qual comando pula só a iteração atual do loop, sem sair dele de vez?",
        options: ["continue", "break", "return", "skip"],
        answer: 0,
        hint: "'Continue' o loop, não pare ele.",
        explain: "continue pula o restante do bloco atual e vai direto pra próxima volta do loop."
      }
    ]
  },

  {
    id: 13,
    chapterRef: "1:06:54 e 1:15:38 no vídeo — “shopping cart” + “mad libs”",
    title: "Projetos: carrinho & mad libs",
    icon: "🛒",
    intro: `
      <p>Pra ler uma palavra (sem espaço) digitada pelo usuário, usamos <code>%s</code> com
      um vetor de char — e, diferente de int/float, <b>não</b> usamos <code>&amp;</code>:</p>
      <pre><code>char produto[50];
scanf("%s", produto);</code></pre>
      <p>Esses projetos do curso combinam scanf, variáveis e contas — exatamente o que você
      já aprendeu, só juntando as peças.</p>`,
    phases: [
      {
        type: "code",
        instruction: "Declare um vetor de char chamado produto (tamanho 50) e leia o nome digitado com scanf.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    char produto[50];\n    scanf("%s", produto);',
        context_after: "\n    return 0;\n}",
        expectedOutput: null,
        hint: "Vetores já são um endereço — não precisa de & antes de produto."
      },
      {
        type: "code",
        instruction: "Calcule e imprima o total: preco vezes qtd, com 2 casas decimais.",
        context_before: "#include <stdio.h>\n\nint main() {\n    float preco = 25.5;\n    int qtd = 3;",
        seed: "",
        target: '    printf("%.2f", preco * qtd);',
        context_after: "\n    return 0;\n}",
        expectedOutput: "76.50",
        hint: "printf(\"%.2f\", preco * qtd);"
      },
      {
        type: "code",
        instruction: "Aplique 10% de desconto no total (multiplique o resultado por 0.9).",
        context_before: "#include <stdio.h>\n\nint main() {\n    float preco = 25.5;\n    int qtd = 3;",
        seed: '    printf("%.2f", preco * qtd);',
        target: '    printf("%.2f", preco * qtd * 0.9);',
        context_after: "\n    return 0;\n}",
        expectedOutput: "68.85",
        hint: "Só multiplica a expressão inteira por 0.9 a mais."
      },
      {
        type: "mcq",
        q: "Qual especificador lemos com scanf para capturar uma palavra (sem espaços)?",
        options: ["%s", "%c", "%d", "%f"],
        answer: 0,
        hint: "s de 'string'.",
        explain: "%s lê uma sequência de caracteres até encontrar um espaço."
      }
    ]
  },

  {
    id: 14,
    chapterRef: "1:25:25 a 1:36:44 no vídeo — “math functions”, “circle calculator”, “compound interest”",
    title: "Funções matemáticas & calculadoras",
    icon: "🧮",
    intro: `
      <p>A biblioteca <code>&lt;math.h&gt;</code> traz funções matemáticas prontas:</p>
      <pre><code>#include &lt;math.h&gt;

sqrt(16)     // raiz quadrada -> 4
pow(2, 5)    // potencia (2 elevado a 5) -> 32</code></pre>`,
    phases: [
      {
        type: "code",
        instruction: "Imprima a raiz quadrada de 16, sem casas decimais (%.0f).",
        context_before: "#include <stdio.h>\n#include <math.h>\n\nint main() {",
        seed: "",
        target: '    printf("%.0f", sqrt(16));',
        context_after: "\n    return 0;\n}",
        expectedOutput: "4",
        hint: "sqrt(numero) calcula a raiz quadrada."
      },
      {
        type: "code",
        instruction: "Imprima 2 elevado a 5, usando pow, sem casas decimais.",
        context_before: "#include <stdio.h>\n#include <math.h>\n\nint main() {",
        seed: "",
        target: '    printf("%.0f", pow(2, 5));',
        context_after: "\n    return 0;\n}",
        expectedOutput: "32",
        hint: "pow(base, expoente)."
      },
      {
        type: "code",
        instruction: "Calcule a área de um círculo (3.14159 * raio * raio) e imprima com 2 casas decimais.",
        context_before: "#include <stdio.h>\n\nint main() {\n    float raio = 5;",
        seed: "",
        target: '    printf("%.2f", 3.14159 * raio * raio);',
        context_after: "\n    return 0;\n}",
        expectedOutput: "78.54",
        hint: "Área = pi * raio * raio."
      },
      {
        type: "code",
        instruction: "Mude o raio de 5 para 10 (a conta da área continua igual).",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "    float raio = 5;",
        target: "    float raio = 10;",
        context_after: '\n    printf("%.2f", 3.14159 * raio * raio);\n    return 0;\n}',
        expectedOutput: "314.16",
        hint: "Só o número depois do = muda."
      },
      {
        type: "mcq",
        q: "Qual biblioteca precisamos incluir pra usar sqrt e pow?",
        options: ["<math.h>", "<stdio.h>", "<stdlib.h>", "<calc.h>"],
        answer: 0,
        hint: "math de 'matemática'.",
        explain: "<math.h> traz as funções matemáticas como sqrt, pow, entre outras."
      }
    ]
  },

  {
    id: 15,
    chapterRef: "3:40:00 a 4:21:11 no vídeo — “random numbers”, jogos e “banking program”",
    title: "Números aleatórios & jogos",
    icon: "🎲",
    intro: `
      <p><code>rand()</code> (de <code>&lt;stdlib.h&gt;</code>) gera um número pseudo-aleatório.
      Usamos <code>%</code> pra limitar a faixa:</p>
      <pre><code>rand() % 10        // 0 a 9
rand() % 6 + 1     // 1 a 6 (dado)</code></pre>
      <p><code>srand(time(NULL))</code>, chamado uma vez no início do programa, garante que os
      números mudem a cada execução (senão rand() sempre repete a mesma sequência).</p>`,
    phases: [
      {
        type: "code",
        instruction: "Guarde em numero um valor aleatório de 0 a 9, usando rand().",
        context_before: "#include <stdio.h>\n#include <stdlib.h>\n\nint main() {",
        seed: "",
        target: "    int numero = rand() % 10;",
        context_after: "\n    return 0;\n}",
        expectedOutput: null,
        hint: "rand() % 10 dá um resto entre 0 e 9."
      },
      {
        type: "code",
        instruction: "Simule uma jogada de dado: guarde em dado um valor de 1 a 6.",
        context_before: "#include <stdio.h>\n#include <stdlib.h>\n\nint main() {",
        seed: "",
        target: "    int dado = rand() % 6 + 1;",
        context_after: "\n    return 0;\n}",
        expectedOutput: null,
        hint: "Some +1 no final pra começar do 1 em vez do 0."
      },
      {
        type: "code",
        instruction: "Adicione srand(time(NULL)); logo no início do main, antes de gerar o número.",
        context_before: "#include <stdio.h>\n#include <stdlib.h>\n#include <time.h>\n\nint main() {",
        seed: "",
        target: "    srand(time(NULL));",
        context_after: "\n    int numero = rand() % 10;\n    return 0;\n}",
        expectedOutput: null,
        hint: "srand precisa vir ANTES de qualquer chamada a rand()."
      },
      {
        type: "mcq",
        q: "rand() % 10 gera números em qual faixa?",
        options: ["0 a 9", "1 a 10", "0 a 10", "1 a 9"],
        answer: 0,
        hint: "% devolve o resto, que nunca chega no divisor.",
        explain: "O resto de qualquer número dividido por 10 vai de 0 a 9."
      },
      {
        type: "mcq",
        q: "Para que serve srand(time(NULL))?",
        options: [
          "Muda a semente aleatória a cada execução, usando o horário atual",
          "Gera sempre o mesmo número",
          "Não faz nada",
          "Só funciona com float"
        ],
        answer: 0,
        hint: "time(NULL) muda a cada segundo.",
        explain: "Sem srand, rand() sempre gera a mesma sequência de números toda vez que o programa roda."
      }
    ]
  },

  {
    id: 16,
    chapterRef: "4:21:11 a 5:13:50 no vídeo — “arrays”, “2D arrays”, “arrays of strings”",
    title: "Vetores (arrays)",
    icon: "📊",
    intro: `
      <p>Um vetor guarda vários valores do mesmo tipo, acessados por índice (começando em 0):</p>
      <pre><code>int notas[3] = {10, 8, 6};
printf("%d", notas[1]); // 8</code></pre>
      <p>Uma matriz (array 2D) é um vetor de vetores: <code>int grade[2][2]</code>. E um vetor
      de strings é um vetor de vetores de char: <code>char nomes[3][20]</code>.</p>`,
    phases: [
      {
        type: "code",
        instruction: "Declare um vetor de 3 inteiros chamado notas, com valores 10, 8 e 6.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: "    int notas[3] = {10, 8, 6};",
        context_after: "\n    return 0;\n}",
        expectedOutput: null,
        hint: "tipo nome[tamanho] = {valores};"
      },
      {
        type: "code",
        instruction: "Imprima o SEGUNDO valor do vetor notas (índice 1).",
        context_before: "#include <stdio.h>\n\nint main() {\n    int notas[3] = {10, 8, 6};",
        seed: "",
        target: '    printf("%d", notas[1]);',
        context_after: "\n    return 0;\n}",
        expectedOutput: "8",
        hint: "O índice 0 é o primeiro elemento (10); índice 1 é o segundo."
      },
      {
        type: "code",
        instruction: "Use um for para imprimir TODOS os elementos do vetor notas, em sequência.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int notas[3] = {10, 8, 6};",
        seed: "",
        target: '    for (int i = 0; i < 3; i++) {\n        printf("%d", notas[i]);\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: "1086",
        hint: "notas[i] muda de valor a cada volta do loop."
      },
      {
        type: "code",
        instruction: "Complete o for que lê 3 números digitados pelo usuário e guarda em idades[i].",
        context_before: "#include <stdio.h>\n\nint main() {\n    int idades[3];",
        seed: "",
        target: '    for (int i = 0; i < 3; i++) {\n        scanf("%d", &idades[i]);\n    }',
        context_after: "\n    return 0;\n}",
        expectedOutput: null,
        hint: "Usa & antes de idades[i] — cada posição é um int comum."
      },
      {
        type: "code",
        instruction: "Declare uma matriz 2x2 chamada grade, com os valores {{1, 2}, {3, 4}}.",
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: "    int grade[2][2] = {{1, 2}, {3, 4}};",
        context_after: "\n    return 0;\n}",
        expectedOutput: null,
        hint: "int nome[linhas][colunas] = {{...}, {...}};"
      },
      {
        type: "code",
        instruction: "Imprima o elemento da linha 1, coluna 0 da matriz grade.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int grade[2][2] = {{1, 2}, {3, 4}};",
        seed: "",
        target: '    printf("%d", grade[1][0]);',
        context_after: "\n    return 0;\n}",
        expectedOutput: "3",
        hint: "grade[linha][coluna] — linha 1 é a segunda linha: {3, 4}."
      },
      {
        type: "code",
        instruction: 'Declare um vetor de 3 strings chamado nomes (tamanho 20 cada), com "Ana", "Bia" e "Caio".',
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: 'char nomes[3][20] = {"Ana", "Bia", "Caio"};',
        context_after: "\n    return 0;\n}",
        expectedOutput: null,
        hint: "char nome[QUANTAS][TAMANHO_MAXIMO] = {...};"
      },
      {
        type: "code",
        instruction: "Imprima o segundo nome do vetor nomes, usando %s.",
        context_before: '#include <stdio.h>\n\nint main() {\n    char nomes[3][20] = {"Ana", "Bia", "Caio"};',
        seed: "",
        target: '    printf("%s", nomes[1]);',
        context_after: "\n    return 0;\n}",
        expectedOutput: "Bia",
        hint: "%s imprime a string inteira daquela posição."
      }
    ]
  },

  {
    id: 17,
    chapterRef: "5:13:50 a 5:48:08 no vídeo — “ternary operator” + “structs”",
    title: "Structs",
    icon: "⚙️",
    intro: `
      <p>Uma struct agrupa vários valores relacionados num só tipo:</p>
      <pre><code>struct Peca {
    float diametro;
    int rotacao;
};

struct Peca p1;
p1.diametro = 25.4;</code></pre>
      <p>Bônus — o operador ternário resume um if/else numa linha:
      <code>condicao ? valorSeVerdadeiro : valorSeFalso</code>.</p>`,
    phases: [
      {
        type: "code",
        instruction: "Declare uma struct chamada Peca, com dois campos: float diametro e int rotacao.",
        context_before: "#include <stdio.h>\n\n",
        seed: "",
        target: "struct Peca {\n    float diametro;\n    int rotacao;\n};",
        context_after: "\n\nint main() {\n    return 0;\n}",
        expectedOutput: null,
        hint: "struct Nome {\n    tipo campo1;\n    tipo campo2;\n};"
      },
      {
        type: "code",
        instruction: "Crie uma variável p1 do tipo struct Peca, e defina diametro como 25.4.",
        context_before: "#include <stdio.h>\n\nstruct Peca {\n    float diametro;\n    int rotacao;\n};\n\nint main() {",
        seed: "",
        target: "    struct Peca p1;\n    p1.diametro = 25.4;",
        context_after: "\n    return 0;\n}",
        expectedOutput: null,
        hint: "struct Peca p1; depois p1.diametro = valor;"
      },
      {
        type: "code",
        instruction: "Imprima o valor de p1.diametro, com 1 casa decimal.",
        context_before: "#include <stdio.h>\n\nstruct Peca {\n    float diametro;\n    int rotacao;\n};\n\nint main() {\n    struct Peca p1;\n    p1.diametro = 25.4;",
        seed: "",
        target: '    printf("%.1f", p1.diametro);',
        context_after: "\n    return 0;\n}",
        expectedOutput: "25.4",
        hint: "Acesse o campo com o ponto: p1.diametro"
      },
      {
        type: "code",
        instruction: "Mude o diâmetro de 25.4 para 30.0.",
        context_before: "#include <stdio.h>\n\nstruct Peca {\n    float diametro;\n    int rotacao;\n};\n\nint main() {\n    struct Peca p1;",
        seed: "    p1.diametro = 25.4;",
        target: "    p1.diametro = 30.0;",
        context_after: '\n    printf("%.1f", p1.diametro);\n    return 0;\n}',
        expectedOutput: "30.0",
        hint: "Só o número depois do = muda."
      },
      {
        type: "code",
        instruction: 'Use o operador ternário para imprimir "Par" se num for par, ou "Impar" caso contrário, em uma linha só.',
        context_before: "#include <stdio.h>\n\nint main() {\n    int num = 8;",
        seed: "",
        target: '    printf(num % 2 == 0 ? "Par" : "Impar");',
        context_after: "\n    return 0;\n}",
        expectedOutput: "Par",
        hint: "condicao ? valorSeVerdadeiro : valorSeFalso"
      },
      {
        type: "mcq",
        q: "O que uma struct agrupa?",
        options: ["Vários valores relacionados num só tipo", "Só funções", "Só texto", "Nada, é decorativo"],
        answer: 0,
        hint: "Pense numa 'ficha' com vários campos.",
        explain: "struct empacota campos de tipos diferentes (float, int, char...) sob um único nome de tipo."
      }
    ]
  },

  {
    id: 18,
    chapterRef: "5:54:48 no vídeo — “pointers”",
    title: "Ponteiros",
    icon: "📍",
    intro: `
      <p>Um ponteiro guarda o <b>endereço de memória</b> de uma variável, não o valor
      direto:</p>
      <pre><code>int x = 10;
int *p = &x;      // p guarda o ENDERECO de x
printf("%d", *p); // *p acessa o VALOR (10)</code></pre>
      <p>Alterar <code>*p</code> altera <code>x</code> de verdade, porque os dois apontam pro
      mesmo lugar na memória.</p>`,
    phases: [
      {
        type: "code",
        instruction: "Declare um ponteiro p que guarda o endereço de x.",
        context_before: "#include <stdio.h>\n\nint main() {\n    int x = 10;",
        seed: "",
        target: "    int *p = &x;",
        context_after: "\n    return 0;\n}",
        expectedOutput: null,
        hint: "tipo *nome = &variavel;"
      },
      {
        type: "code",
        instruction: "Imprima o valor apontado por p (não o endereço — o valor).",
        context_before: "#include <stdio.h>\n\nint main() {\n    int x = 10;\n    int *p = &x;",
        seed: "",
        target: '    printf("%d", *p);',
        context_after: "\n    return 0;\n}",
        expectedOutput: "10",
        hint: "*p (com asterisco) acessa o valor guardado no endereço."
      },
      {
        type: "code",
        instruction: "Através do ponteiro p, mude o valor de x para 20 (sem usar x diretamente).",
        context_before: "#include <stdio.h>\n\nint main() {\n    int x = 10;\n    int *p = &x;",
        seed: "",
        target: "    *p = 20;",
        context_after: '\n    printf("%d", x);\n    return 0;\n}',
        expectedOutput: "20",
        hint: "*p = novoValor; altera quem p aponta."
      },
      {
        type: "mcq",
        q: "O que * faz na frente de um ponteiro (fora da declaração)?",
        options: [
          "Acessa/altera o valor pro qual o ponteiro aponta (dereference)",
          "Multiplica o ponteiro por 1",
          "Cria um novo ponteiro",
          "Apaga o ponteiro da memória"
        ],
        answer: 0,
        hint: "É o oposto de &.",
        explain: "*p 'desreferencia' o ponteiro — acessa o valor guardado no endereço que ele aponta."
      },
      {
        type: "mcq",
        q: "O que int *p = &x; guarda dentro de p?",
        options: ["O endereço de memória de x", "O valor de x", "Um texto", "Nada"],
        answer: 0,
        hint: "& é 'endereço de'.",
        explain: "p não guarda o valor de x — guarda ONDE x está na memória."
      }
    ]
  },

  {
    id: 19,
    chapterRef: "6:02:55 e 6:08:50 no vídeo — “write files” + “read files”",
    title: "Arquivos",
    icon: "📁",
    intro: `
      <p>Pra trabalhar com arquivos, usamos <code>FILE*</code>:</p>
      <pre><code>FILE *arquivo = fopen("dados.txt", "w"); // w = escrever
fprintf(arquivo, "%d", 42);              // funciona como printf
fclose(arquivo);                         // sempre feche no final</code></pre>
      <p>Pra ler, trocamos o modo pra <code>"r"</code> e usamos <code>fscanf</code> no lugar
      de <code>fprintf</code>.</p>`,
    phases: [
      {
        type: "code",
        instruction: 'Abra o arquivo "dados.txt" em modo de escrita ("w"), guardando em arquivo.',
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: "",
        target: '    FILE *arquivo = fopen("dados.txt", "w");',
        context_after: "\n    fclose(arquivo);\n    return 0;\n}",
        expectedOutput: null,
        hint: 'FILE *nome = fopen("caminho", "modo");'
      },
      {
        type: "code",
        instruction: "Escreva o número 42 dentro do arquivo, usando fprintf.",
        context_before: '#include <stdio.h>\n\nint main() {\n    FILE *arquivo = fopen("dados.txt", "w");',
        seed: "",
        target: '    fprintf(arquivo, "%d", 42);',
        context_after: "\n    fclose(arquivo);\n    return 0;\n}",
        expectedOutput: null,
        hint: "fprintf funciona como printf, só que o primeiro argumento é o arquivo."
      },
      {
        type: "code",
        instruction: 'Troque "w" (escrever) por "r" (ler), pra abrir o arquivo em modo leitura.',
        context_before: "#include <stdio.h>\n\nint main() {",
        seed: '    FILE *arquivo = fopen("dados.txt", "w");',
        target: '    FILE *arquivo = fopen("dados.txt", "r");',
        context_after: "\n    fclose(arquivo);\n    return 0;\n}",
        expectedOutput: null,
        hint: "Só a letra dentro das aspas do modo muda."
      },
      {
        type: "mcq",
        q: "Por que sempre chamamos fclose no final?",
        options: [
          "Libera o arquivo e garante que os dados foram salvos de verdade",
          "É opcional, nunca muda nada",
          "Apaga o arquivo",
          "Renomeia o arquivo"
        ],
        answer: 0,
        hint: "Sem fechar, dados podem ficar 'presos' e não serem gravados.",
        explain: "fclose libera o recurso do sistema operacional e garante que tudo que foi escrito é salvo no disco."
      }
    ]
  },

  {
    id: 20,
    chapterRef: "6:15:14 a 6:31:33 no vídeo — “malloc”, “calloc”, “realloc”",
    title: "malloc / calloc / realloc",
    icon: "🧠",
    intro: `
      <p>Essas funções (de <code>&lt;stdlib.h&gt;</code>) pedem memória "sob demanda", em
      tempo de execução:</p>
      <pre><code>int *numeros = malloc(5 * sizeof(int));  // 5 inteiros, memoria "suja"
int *zeros = calloc(5, sizeof(int));     // 5 inteiros, ja zerados
free(numeros);                           // sempre libere depois</code></pre>`,
    phases: [
      {
        type: "code",
        instruction: "Aloque memória dinâmica pra 5 inteiros, usando malloc, guardando em numeros.",
        context_before: "#include <stdio.h>\n#include <stdlib.h>\n\nint main() {",
        seed: "",
        target: "    int *numeros = malloc(5 * sizeof(int));",
        context_after: "\n    free(numeros);\n    return 0;\n}",
        expectedOutput: null,
        hint: "malloc(quantidade * sizeof(tipo))"
      },
      {
        type: "code",
        instruction: "Guarde 100 na primeira posição de numeros, e imprima esse valor.",
        context_before: "#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int *numeros = malloc(5 * sizeof(int));",
        seed: "",
        target: '    numeros[0] = 100;\n    printf("%d", numeros[0]);',
        context_after: "\n    free(numeros);\n    return 0;\n}",
        expectedOutput: "100",
        hint: "Memória alocada com malloc pode ser usada com colchetes [ ], igual um vetor normal."
      },
      {
        type: "code",
        instruction: "Troque malloc por calloc (calloc recebe quantidade e tamanho como dois argumentos separados, e já vem zerado).",
        context_before: "#include <stdio.h>\n#include <stdlib.h>\n\nint main() {",
        seed: "    int *numeros = malloc(5 * sizeof(int));",
        target: "    int *numeros = calloc(5, sizeof(int));",
        context_after: "\n    free(numeros);\n    return 0;\n}",
        expectedOutput: null,
        hint: "calloc(quantidade, tamanhoDeCadaUm) — sem multiplicação."
      },
      {
        type: "mcq",
        q: "Por que sempre usamos free() depois de malloc/calloc?",
        options: [
          "Pra liberar a memória alocada e evitar vazamento (memory leak)",
          "É opcional e nunca importa",
          "Apaga o programa inteiro",
          "Só serve para variáveis float"
        ],
        answer: 0,
        hint: "Memória não liberada fica 'presa' até o programa terminar.",
        explain: "Sem free(), a memória alocada continua reservada mesmo sem uso — isso é um vazamento de memória (memory leak)."
      }
    ]
  },

  {
    id: 21,
    chapterRef: "6:43:23 no vídeo — “digital clock” (projeto final)",
    title: "Projeto final: relógio digital",
    icon: "⏰",
    intro: `
      <p>Pra pegar a hora atual, usamos <code>&lt;time.h&gt;</code>:</p>
      <pre><code>time_t agora = time(NULL);
struct tm *tempo = localtime(&agora);
printf("%02d:%02d:%02d", tempo->tm_hour, tempo->tm_min, tempo->tm_sec);</code></pre>
      <p><code>tempo</code> é um <b>ponteiro</b> pra struct, por isso usamos <code>-&gt;</code>
      em vez de <code>.</code> pra acessar os campos. <code>%02d</code> imprime sempre com 2
      dígitos (ex: 05 em vez de 5).</p>`,
    phases: [
      {
        type: "code",
        instruction: "Pegue o horário atual do sistema e guarde o resultado em tempo (um ponteiro pra struct tm).",
        context_before: "#include <stdio.h>\n#include <time.h>\n\nint main() {",
        seed: "",
        target: "    time_t agora = time(NULL);\n    struct tm *tempo = localtime(&agora);",
        context_after: "\n    return 0;\n}",
        expectedOutput: null,
        hint: "time(NULL) pega o instante atual; localtime converte pra hora/minuto/segundo."
      },
      {
        type: "code",
        instruction: "Imprima a hora atual (tm_hour) sempre com 2 dígitos.",
        context_before: "#include <stdio.h>\n#include <time.h>\n\nint main() {\n    time_t agora = time(NULL);\n    struct tm *tempo = localtime(&agora);",
        seed: "",
        target: '    printf("%02d", tempo->tm_hour);',
        context_after: "\n    return 0;\n}",
        expectedOutput: null,
        hint: "tempo->tm_hour porque tempo é um ponteiro — usamos -> em vez de ponto."
      },
      {
        type: "code",
        instruction: "Complete o printf pra montar o relógio completo no formato HH:MM:SS (hora, minuto, segundo).",
        context_before: "#include <stdio.h>\n#include <time.h>\n\nint main() {\n    time_t agora = time(NULL);\n    struct tm *tempo = localtime(&agora);",
        seed: "",
        target: '    printf("%02d:%02d:%02d", tempo->tm_hour, tempo->tm_min, tempo->tm_sec);',
        context_after: "\n    return 0;\n}",
        expectedOutput: null,
        hint: "Três %02d separados por dois pontos, na ordem hora, minuto, segundo."
      },
      {
        type: "mcq",
        q: "Por que usamos tempo->tm_hour em vez de tempo.tm_hour?",
        options: [
          "Porque tempo é um ponteiro pra struct, não a struct em si",
          "Porque tm_hour é um campo privado",
          "Não tem diferença nenhuma",
          "Porque hour precisa ser maiúsculo"
        ],
        answer: 0,
        hint: "localtime devolve um ponteiro (struct tm *tempo).",
        explain: "-> é o atalho pra acessar campos quando você tem um PONTEIRO pra struct, em vez da struct direto."
      }
    ]
  }
];

// Roadmap completo do curso (57 capítulos agrupados) — nós visíveis na trilha,
// ainda não jogáveis. Vão virando sessões completas nas próximas atualizações.
// Trilha completa! Todos os 57 capítulos do curso viraram sessões jogáveis (1-21).
const ROADMAP = [];
