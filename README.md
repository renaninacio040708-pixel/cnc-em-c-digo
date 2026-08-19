# Centro de Usinagem CNC — O Jogo

Jogo de treino para programar um **centro de usinagem CNC** (fresadora 3 eixos): leitura de
desenho, coordenadas absolutas/incrementais/G-code, funções auxiliares M, estrutura de
programa e ciclos fixos de furação (G81/G82/G83/G84). Progressão estilo Angry Birds: 18 fases
+ Modo Infinito, estrelas, XP, patentes, moedas, loja e tutorial dinâmico.

Inspirado na arquitetura e na progressão de **CNC Coordenadas** (torno/fresa), adaptado do
zero para o domínio de centro de usinagem: sem diâmetro, com profundidade Z, ciclos de
furação modais e funções M.

## Como rodar

No PC: dê duplo clique em `servidor.bat` (ou rode `python -m http.server 8124` na pasta) e
abra `http://localhost:8124`.

### Atalho na tela de início (celular/tablet)
Abra o link no navegador → menu → **Adicionar à Tela de Início**. O jogo abre em tela cheia,
sem barra do navegador (manifest + `apple-mobile-web-app-capable`), com ícone próprio.

## Convenções técnicas usadas (ISO / Fanuc)

- `X, Y` = posição da ferramenta no plano da peça, vista de cima — **não há diâmetro**.
- `Z` = profundidade. `Z0` é a face de cima da peça; `Z` negativo entra no material.
- Zero-peça `W`: ponto de referência de onde tudo é medido (`G54`).
- `G90` absoluto · `G91` incremental.
- Chanfro `C x45°` → anda `C` mm em X e `C` mm em Y ao mesmo tempo.
- Raio de canto `R` → desloca `R` mm em X e `R` mm em Y (curva, não corte reto).
- Ciclos de furação (`G81` a `G86`): `R` é o plano de folga, `Z` é o fundo do furo, `Q` é a
  profundidade de cada picada (G83), `P` é a pausa em segundos no fundo (G82). Uma vez
  chamado com todos os parâmetros, o ciclo é **modal** — furos seguintes só precisam de novos
  X e Y, e as demais células aparecem como "—" (não aplicável).
- Fórmulas de corte: `N = 1000·Vc / (π·D)` (rpm) e, no rosqueamento, `F = N × passo`.

## Progressão

| Fase | Desbloqueia |
|---|---|
| 2 | Loja |
| 3 | Tema Blueprint |
| 5 | Assistente Δ (mostra o ponto anterior) |
| 8 | Revelar célula (40 🪙) |
| 12 | Tema Neon |
| 15 | Modo Infinito (peças e furações aleatórias) |

Estrelas: 3★ acertando de primeira sem dica paga · 2★ com poucas tentativas/dicas · 1★ concluindo.
Revelar célula limita a 2★ (1★ da terceira em diante); "ver a resposta" ou pedir dica sem ficha, 1★.
O CHEFE (fase 18) exige estrelas acumuladas suficientes (metade do total possível na trilha).
Após 3 tentativas erradas o botão **Explicar** libera o passo a passo bloco a bloco.
Fase repetida rende 30% da recompensa.

### O que cada fase ensina

1–2. Eixos X/Y absolutos, chanfro de canto · 3–4. Incremental (Δ), com chanfro · 5–6. Absoluta
e incremental lado a lado · 7. Raio de canto · 8. Contorno longo, 8 pontos · 9–10. Ponto de
aproximação e leitura de sinal · 11–12. Primeiro programa G-code (G0/G1) · 13. Diagonais ·
14. G-code com arco (G02/G03) · 15. Estrutura de programa e funções M · 16. Ciclos G81/G82
(furação simples e com pausa), furos modais, cálculo de rotação · 17. Ciclos G83/G84 (picadas
e rosqueamento), cálculo de avanço de rosca · 18. **CHEFE** — programa completo: fresamento de
contorno + furação, tudo junto.

## Ajuda que o jogo dá

- **Dica adaptativa**: lê o que você digitou, acha a primeira célula errada e diagnostica o
  erro clássico (eixos trocados, sinal de Z, incremental na coluna absoluta, R trocado com Z,
  profundidade total no lugar da picada Q, avanço trocado com rotação). Nível 1 é sempre
  grátis; aprofundar gasta 💡.
- **Meu perfil**: desenha em tracejado o contorno que os SEUS números formam, sobre a peça correta.
- **Relatório de erro**: aponta qual coluna concentra os erros e qual padrão se repete.
- Backup do progresso em Manual → Exportar/Importar save.

## Arquivos

- `index.html` — estrutura das telas (mapa, jogo, loja, manual, modais, tutorial)
- `css/style.css` — temas (steel, blueprint, neon, impressão, brasa, forja, oceano, ametista) e layout
- `js/levels.js` — dados das 18 fases + gerador do Modo Infinito (contornos e furações aleatórias)
- `js/game.js` — motor: tabela genérica por colunas, verificação, dicas adaptativas, recompensas,
  desenho técnico em canvas (vista de topo + profundidade Z), animação de usinagem, tutorial

Progresso salvo em `localStorage` (chave `usinagemcnc_v1`).
