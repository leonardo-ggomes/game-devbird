
````md
# DevBird – Gesture Controlled Browser Game

> Jogo experimental inspirado em Angry Birds, controlado por **gestos da mão**, executado **diretamente no navegador** usando JavaScript.

---

## Sobre o Projeto

**DevBird** é um jogo de lançamento de projéteis onde o jogador interage sem mouse ou teclado.  
Toda a interação acontece por meio da **câmera**, utilizando **gestos naturais da mão**.

O projeto roda 100% no navegador e foi desenvolvido com foco em:

- Game Dev com JavaScript
- Visão computacional no browser
- Interação humano–computador
- Experimentos com novas formas de input

---

## Como Jogar (Controle por Gestos)

O jogo utiliza a câmera para detectar o estado da mão do jogador.

### Mecânica principal

1. Fique em frente à câmera
2. **Feche a mão**
   - O jogo entende que você está “segurando” o pássaro
3. Leve a mão fechada até próximo do pássaro na tela
   - Esse movimento define **direção e força**
4. **Abra a mão**
   - O pássaro é lançado automaticamente

Quanto maior o deslocamento da mão, maior a força aplicada ao lançamento.

---

## Funcionamento Interno (Visão Geral)

Fluxo simplificado:

```text
Câmera
  ↓
Detecção da mão
  ↓
Estado (aberta / fechada)
  ↓
Cálculo do vetor de força
  ↓
Lançamento do pássaro
````

O loop do jogo calcula continuamente:

* Posição da mão
* Estado do gesto
* Física básica do projétil (gravidade e velocidade)

---

## Tecnologias Utilizadas

* JavaScript
* HTML5 Canvas
* API de Câmera do Navegador (getUserMedia)
* Detecção de mão no browser
* Live Server (ambiente de execução)

---

## Como Executar o Jogo

### Pré-requisitos

* Navegador moderno (Chrome, Edge ou Firefox)
* Webcam funcional
* Extensão **Live Server** no VS Code

### Passos

1. Clone o repositório:

```bash
git clone https://github.com/leonardo-ggomes/game-devbird.git
```

2. Abra o projeto no VS Code
3. Clique com o botão direito no `index.html`
4. Selecione **“Open with Live Server”**
5. Autorize o acesso à câmera no navegador

O jogo será executado localmente no navegador.

---

## Observações Importantes

* O jogo **não funciona abrindo o HTML diretamente** (file://)
* É necessário rodar via servidor local (Live Server)
* Boa iluminação melhora significativamente a detecção da mão

---

## Objetivo do Projeto 🐦

Este projeto tem caráter educacional e experimental, sendo ideal para:

* Aprender game dev com JavaScript
* Explorar visão computacional no navegador
* Criar jogos baseados em gestos
* Demonstrar conceitos de física aplicada em jogos

---

## Demonstração

(Recomenda-se adicionar um GIF ou vídeo mostrando o gesto da mão e o lançamento do pássaro)

```text
Mão fechada  → pássaro preso
Mover a mão  → define força e direção
Mão aberta  → lançamento
```

---

## Contribuições

Sugestões e melhorias são bem-vindas, como:

* Ajustes na física
* Novos níveis
* Feedback visual do gesto
* Melhorias na detecção da mão

---

## Autor

Leonardo Gomes

