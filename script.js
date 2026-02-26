class JogoHappyBird {
    constructor() {
        this.configurarCanvas();
        this.carregarRecursos();

        // --- 1. CONFIGURAÇÕES DA MECÂNICA ---
        this.ajustes = {
            gravidade: 9.82,
            forcaDoLancamento: 1.2,
            sensibilidadeFisica: 10,
            limiteCorda: 80,
            velocidadeAnimacao: 0.2,
            alturaDoChao: 80,
            velocidadeCeuConstante: 2
        };

        // --- 2. ESTADO DO JOGO ---
        this.estado = {
            noAr: false,
            puxandoCorda: false,
            ultimoTempo: 0,
            frameAtual: 0,
            timerAnimacao: 0,
            rastro: [],
            particulas: [],
            posicaoCeu: 0,
            posicaoDedo: { x: 0, y: 0 },
            distanciaPinca: 100
        };

        // --- 3. POSIÇÕES E OBJETOS ---
        this.estilingue = { x: 550, y: this.canvas.height - 180 };
        this.passaro = {
            x: 0, y: 0, largura: 50, altura: 50,
            xInicial: 0, yInicial: 0, vX: 0, vY: 0, tempoDeVoo: 0
        };
        this.inimigos = [];

        this.reiniciarRodada();
        this.prepararML();
        this.loop(0);
    }

    configurarCanvas() {
        this.canvas = document.createElement("canvas");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        document.body.style.margin = "0";
        document.body.style.overflow = "hidden";
        document.body.style.backgroundColor = "#70c5ce";
        document.body.prepend(this.canvas);
        this.ctx = this.canvas.getContext("2d");

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.estilingue.y = this.canvas.height - 180;
        });
    }

    carregarRecursos() {
        this.spritesPassaro = [new Image(), new Image()];
        this.spritesPassaro[0].src = "./assets/CuteFlappy/flappy00.png";
        this.spritesPassaro[1].src = "./assets/CuteFlappy/flappy05.png";
        this.imgInimigo = new Image();
        this.imgInimigo.src = "./assets/CuteFlappy/jubarte.png";
        this.imgChao = new Image();
        this.imgChao.src = "./assets/CuteFlappy/ground.png";
        this.imgCeu = new Image();
        this.imgCeu.src = "./assets/CuteFlappy/sky_2.png";
    }

    // --- MACHINE LEARNING (GESTO DE PINÇA) ---
    async prepararML() {
        this.videoElement = document.createElement('video');
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        hands.onResults((results) => this.processarGesto(results));

        const camera = new Camera(this.videoElement, {
            onFrame: async () => await hands.send({ image: this.videoElement }),
            width: 640, height: 480
        });
        camera.start();
    }

    processarGesto(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const pontos = results.multiHandLandmarks[0];
            const polegar = { x: (1 - pontos[4].x) * this.canvas.width, y: pontos[4].y * this.canvas.height };
            const indicador = { x: (1 - pontos[8].x) * this.canvas.width, y: pontos[8].y * this.canvas.height };

            this.estado.posicaoDedo = { x: (polegar.x + indicador.x) / 2, y: (polegar.y + indicador.y) / 2 };
            this.estado.distanciaPinca = Math.hypot(polegar.x - indicador.x, polegar.y - indicador.y);

            const pinchAtivo = this.estado.distanciaPinca < 50;
            const distParaEstilingue = Math.hypot(this.estado.posicaoDedo.x - this.estilingue.x, this.estado.posicaoDedo.y - this.estilingue.y);

            if (!this.estado.noAr && pinchAtivo && distParaEstilingue < 100) {
                this.estado.puxandoCorda = true;
            }

            if (this.estado.puxandoCorda) {
                if (!pinchAtivo) {
                    this.soltarPassaro();
                } else {
                    let dx = this.estado.posicaoDedo.x - this.estilingue.x;
                    let dy = this.estado.posicaoDedo.y - this.estilingue.y;
                    let d = Math.min(Math.hypot(dx, dy), this.ajustes.limiteCorda);
                    let a = Math.atan2(dy, dx);
                    this.passaro.x = this.estilingue.x + Math.cos(a) * d;
                    this.passaro.y = this.estilingue.y + Math.sin(a) * d;
                }
            }
        }
    }

    soltarPassaro() {
        if (this.estado.puxandoCorda) {
            this.estado.puxandoCorda = false;
            this.estado.noAr = true;
            this.passaro.xInicial = this.passaro.x;
            this.passaro.yInicial = this.passaro.y;
            this.passaro.vX = (this.estilingue.x - this.passaro.x) * this.ajustes.forcaDoLancamento;
            this.passaro.vY = (this.estilingue.y - this.passaro.y) * this.ajustes.forcaDoLancamento;
        }
    }

    // --- SISTEMA DE PARTÍCULAS ---
    criarExplosao(x, y, cor) {
        for (let i = 0; i < 15; i++) {
            this.estado.particulas.push({
                x: x, y: y,
                vX: (Math.random() - 0.5) * 12,
                vY: (Math.random() - 0.5) * 12,
                vida: 1.0,
                cor: cor
            });
        }
    }

    verificarColisoes() {
        this.inimigos.forEach(inimigo => {
            if (inimigo.ativo && this.detectarSobreposicao(this.passaro, inimigo)) {
                inimigo.ativo = false;
                this.criarExplosao(inimigo.x, inimigo.y, "#ffcc00");
            }
        });

        if (this.passaro.y > this.canvas.height - this.ajustes.alturaDoChao) {
            if (this.estado.noAr) {
                this.criarExplosao(this.passaro.x, this.passaro.y, "#ff4444");
                this.estado.noAr = false;
                setTimeout(() => this.reiniciarRodada(), 1000);
            }
        }
    }

    detectarSobreposicao(obj1, obj2) {
        return obj1.x < obj2.x + obj2.largura && obj1.x + obj1.largura > obj2.x &&
            obj1.y < obj2.y + obj2.altura && obj1.y + obj1.altura > obj2.y;
    }

    // --- DESENHO ---
    desenharCena() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Fundo Parallax
        this.estado.posicaoCeu -= this.ajustes.velocidadeCeuConstante;
        if (this.estado.posicaoCeu <= -this.canvas.width) this.estado.posicaoCeu = 0;
        this.ctx.drawImage(this.imgCeu, this.estado.posicaoCeu, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.imgCeu, this.estado.posicaoCeu + this.canvas.width, 0, this.canvas.width, this.canvas.height);

        // Chão
        const yChao = this.canvas.height - this.ajustes.alturaDoChao;
        const padraoChao = this.ctx.createPattern(this.imgChao, 'repeat-x');
        this.ctx.save();
        this.ctx.fillStyle = padraoChao;
        this.ctx.translate(0, yChao);
        this.ctx.fillRect(0, 0, this.canvas.width, this.ajustes.alturaDoChao);
        this.ctx.restore();
       
        if (this.estado.puxandoCorda) {
            this.desenharTrajetoriaPrevia();
        }
        // Partículas
        this.estado.particulas.forEach((p, i) => {
            p.x += p.vX; p.y += p.vY; p.vida -= 0.02;
            this.ctx.globalAlpha = Math.max(0, p.vida);
            this.ctx.fillStyle = p.cor;
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); this.ctx.fill();
            if (p.vida <= 0) this.estado.particulas.splice(i, 1);
        });
        this.ctx.globalAlpha = 1;

        // Inimigos
        this.inimigos.forEach(ini => {
            if (ini.ativo) this.ctx.drawImage(this.imgInimigo, ini.x, ini.y, 45, 45);
        });

        // Estilingue
        const { x, y } = this.estilingue;
        this.ctx.strokeStyle = "#6d3611"; this.ctx.lineWidth = 6;
        this.ctx.beginPath(); this.ctx.moveTo(x + 10, y); this.ctx.lineTo(x + 10, y + 150); this.ctx.stroke();
        if (this.estado.puxandoCorda) {
            this.ctx.strokeStyle = "#4b2c20"; this.ctx.lineWidth = 4;
            this.ctx.beginPath(); this.ctx.moveTo(x, y); this.ctx.lineTo(this.passaro.x, this.passaro.y); this.ctx.stroke();
        }

        // Pássaro com Rotação Dinâmica
        this.ctx.save();
        this.ctx.translate(this.passaro.x, this.passaro.y);
        let angulo;
        if (this.estado.noAr) {
            angulo = Math.atan2(this.passaro.vY + this.ajustes.gravidade * this.passaro.tempoDeVoo, this.passaro.vX);
        } else if (this.estado.puxandoCorda) {
            angulo = Math.atan2(this.passaro.y - this.estilingue.y, this.passaro.x - this.estilingue.x) + Math.PI;
        } else {
            angulo = 0;
        }
        this.ctx.rotate(angulo);
        this.ctx.drawImage(this.spritesPassaro[this.estado.frameAtual], -25, -25, 50, 50);
        this.ctx.restore();

        // Guia Visual (Mira)
        const dX = this.estado.posicaoDedo.x;
        const dY = this.estado.posicaoDedo.y;
        this.ctx.beginPath();
        this.ctx.arc(dX, dY, 15, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.estado.distanciaPinca < 50 ? "#00ff00" : "#ffffff";
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    desenharTrajetoriaPrevia() {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.setLineDash([5, 8]); // Cria o efeito tracejado
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // Branco semitransparente
        this.ctx.lineWidth = 3;

        // Calculamos a velocidade inicial que o pássaro TERIA se fosse solto agora
        let vX = (this.estilingue.x - this.passaro.x) * this.ajustes.forcaDoLancamento;
        let vY = (this.estilingue.y - this.passaro.y) * this.ajustes.forcaDoLancamento;

        // Desenhamos a curva simulando 20 "passos" no futuro
        for (let t = 0; t < 20; t += 1.2) {
            // Equação da posição: S = S0 + V*t + (1/2)*g*t^2
            let simX = this.passaro.x + (vX * t);
            let simY = this.passaro.y + (vY * t) + (0.5 * this.ajustes.gravidade * t * t);

            if (t === 0) this.ctx.moveTo(simX, simY);
            else this.ctx.lineTo(simX, simY);

            // Para se a linha atingir o chão na simulação
            if (simY > this.canvas.height - this.ajustes.alturaDoChao) break;
        }

        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reseta o estilo para não afetar outros desenhos
        this.ctx.restore();
    }

    atualizar = (tempo) => {
        const delta = (tempo - this.estado.ultimoTempo) / 1000;
        this.estado.ultimoTempo = tempo;

        if (this.estado.noAr) {
            this.passaro.tempoDeVoo += delta * this.ajustes.sensibilidadeFisica;
            this.passaro.x = this.passaro.xInicial + (this.passaro.vX * this.passaro.tempoDeVoo);
            this.passaro.y = this.passaro.yInicial + (this.passaro.vY * this.passaro.tempoDeVoo) + (0.5 * this.ajustes.gravidade * Math.pow(this.passaro.tempoDeVoo, 2));
            this.verificarColisoes();
        }

        this.desenharCena();
        requestAnimationFrame(this.atualizar);
    }

    reiniciarRodada = () => {
        this.estado.noAr = false;
        this.passaro.tempoDeVoo = 0;
        this.passaro.x = this.estilingue.x;
        this.passaro.y = this.estilingue.y;
        this.inimigos = Array.from({ length: 3 }, () => ({
            x: 600 + Math.random() * 400, y: 200 + Math.random() * 200, largura: 40, altura: 40, ativo: true
        }));
    }

    loop = (t) => requestAnimationFrame(this.atualizar);
}

new JogoHappyBird();