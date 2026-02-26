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
            velocidadeCeuConstante: 2 // Velocidade fixa (ajuste este número para mais rápido ou lento)
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
            posicaoCeu: 0 
        };

        // --- 3. POSIÇÕES E OBJETOS ---
        this.estilingue = { x: 150, y: this.canvas.height - 180 };
        this.passaro = {
            x: 0, y: 0, largura: 50, altura: 50,
            xInicial: 0, yInicial: 0, vX: 0, vY: 0, tempoDeVoo: 0
        };
        this.inimigos = [];

        this.configurarControles();
        this.reiniciarRodada();
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
        });
    }

    carregarRecursos() {
        this.spritesPassaro = [new Image(), new Image()];
        this.spritesPassaro[0].src = "./assets/CuteFlappy/flappy00.png";
        this.spritesPassaro[1].src = "./assets/CuteFlappy/flappy05.png";
        
        this.imgInimigo = new Image();
        this.imgInimigo.src = "./assets/CuteFlappy/flappy04.png";
        
        this.imgChao = new Image();
        this.imgChao.src = "./assets/CuteFlappy/ground.png";

        this.imgCeu = new Image();
        this.imgCeu.src = "./assets/CuteFlappy/sky_2.png"; 
    }

    // --- SISTEMAS VISUAIS ---

    desenharParallax() {
        // Movimento estritamente constante, independente do que aconteça no jogo
        this.estado.posicaoCeu -= this.ajustes.velocidadeCeuConstante;

        // Reset do loop infinito
        if (this.estado.posicaoCeu <= -this.canvas.width) {
            this.estado.posicaoCeu = 0;
        }

        // Desenha a imagem ocupando 100% da largura e altura do canvas
        // Imagem 1
        this.ctx.drawImage(
            this.imgCeu, 
            this.estado.posicaoCeu, 0, 
            this.canvas.width, this.canvas.height
        );
        // Imagem 2 (emenda)
        this.ctx.drawImage(
            this.imgCeu, 
            this.estado.posicaoCeu + this.canvas.width, 0, 
            this.canvas.width, this.canvas.height
        );
    }

    desenharChao() {
        const yChao = this.canvas.height - this.ajustes.alturaDoChao;
        const padraoChao = this.ctx.createPattern(this.imgChao, 'repeat-x');
        this.ctx.save();
        this.ctx.fillStyle = padraoChao;
        this.ctx.translate(0, yChao);
        this.ctx.fillRect(0, 0, this.canvas.width, this.ajustes.alturaDoChao);
        this.ctx.restore();
    }

    desenharEstilingue() {
        const { x, y } = this.estilingue;
        this.ctx.strokeStyle = "#6d3611";
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 10, y); this.ctx.lineTo(x + 10, y + 150);
        this.ctx.stroke();

        if (this.estado.puxandoCorda) {
            this.ctx.strokeStyle = "#4b2c20";
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y); this.ctx.lineTo(this.passaro.x, this.passaro.y);
            this.ctx.stroke();
        }

        this.ctx.strokeStyle = "#8b4513";
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(x - 10, y); this.ctx.lineTo(x - 10, y + 150);
        this.ctx.stroke();
    }

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

    desenharCena() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.desenharParallax();
        this.desenharChao();

        this.inimigos.forEach(ini => {
            if (ini.ativo) this.ctx.drawImage(this.imgInimigo, ini.x, ini.y, 45, 45);
        });

        this.estado.particulas.forEach((p, i) => {
            p.x += p.vX; p.y += p.vY; p.vida -= 0.02;
            this.ctx.globalAlpha = Math.max(0, p.vida);
            this.ctx.fillStyle = p.cor;
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, 3, 0, 7); this.ctx.fill();
            if (p.vida <= 0) this.estado.particulas.splice(i, 1);
        });
        this.ctx.globalAlpha = 1;

        this.estado.rastro.forEach((pt, i) => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${i / this.estado.rastro.length})`;
            this.ctx.beginPath(); this.ctx.arc(pt.x, pt.y, 4, 0, 7); this.ctx.fill();
        });

        this.desenharEstilingue();
        if (this.estado.puxandoCorda) this.desenharTrajetoriaPrevia();

        this.ctx.save();
        this.ctx.translate(this.passaro.x, this.passaro.y);
        
        let dx = this.estilingue.x - this.passaro.x;
        let dy = this.estilingue.y - this.passaro.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        let angulo = this.estado.noAr ? 
            Math.atan2(this.passaro.vY + this.ajustes.gravidade * this.passaro.tempoDeVoo, this.passaro.vX) : 
            Math.atan2(dy, dx);

        let larg = this.passaro.largura + (this.estado.puxandoCorda ? dist * 0.4 : 0);
        let alt = this.passaro.altura - (this.estado.puxandoCorda ? dist * 0.2 : 0);

        this.ctx.rotate(angulo);
        this.ctx.drawImage(this.spritesPassaro[this.estado.frameAtual], -larg/2, -alt/2, larg, alt);
        this.ctx.restore();
    }

    desenharTrajetoriaPrevia() {
        this.ctx.beginPath();
        this.ctx.setLineDash([5, 10]);
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        let vX = (this.estilingue.x - this.passaro.x) * this.ajustes.forcaDoLancamento;
        let vY = (this.estilingue.y - this.passaro.y) * this.ajustes.forcaDoLancamento;
        for (let t = 0; t < 20; t += 1.5) {
            let simX = this.passaro.x + (vX * t);
            let simY = this.passaro.y + (vY * t) + (0.5 * this.ajustes.gravidade * t * t);
            if (t === 0) this.ctx.moveTo(simX, simY);
            else this.ctx.lineTo(simX, simY);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    atualizar = (tempo) => {
        const delta = (tempo - this.estado.ultimoTempo) / 1000;
        this.estado.ultimoTempo = tempo;

        this.estado.timerAnimacao += delta;
        if (this.estado.timerAnimacao > this.ajustes.velocidadeAnimacao) {
            this.estado.frameAtual = (this.estado.frameAtual + 1) % 2;
            this.estado.timerAnimacao = 0;
        }

        if (this.estado.noAr) {
            this.passaro.tempoDeVoo += delta * this.ajustes.sensibilidadeFisica;
            this.passaro.x = this.passaro.xInicial + (this.passaro.vX * this.passaro.tempoDeVoo);
            this.passaro.y = this.passaro.yInicial + (this.passaro.vY * this.passaro.tempoDeVoo) + (0.5 * this.ajustes.gravidade * Math.pow(this.passaro.tempoDeVoo, 2));
            
            if (this.passaro.tempoDeVoo % 0.5 < 0.1) this.estado.rastro.push({x: this.passaro.x, y: this.passaro.y});
            if (this.estado.rastro.length > 15) this.estado.rastro.shift();
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
        this.estado.rastro = [];
        this.inimigos = Array.from({length: 5}, () => ({
            x: 600 + Math.random() * (this.canvas.width - 200), 
            y: 100 + Math.random() * (this.canvas.height - 300), 
            largura: 45, altura: 45, ativo: true
        }));
    }

    configurarControles() {
        this.canvas.addEventListener("mousedown", () => !this.estado.noAr && (this.estado.puxandoCorda = true));
        window.addEventListener("mousemove", (e) => {
            if (this.estado.puxandoCorda) {
                let dx = e.clientX - this.estilingue.x, dy = e.clientY - this.estilingue.y;
                let d = Math.min(Math.hypot(dx, dy), this.ajustes.limiteCorda);
                let a = Math.atan2(dy, dx);
                this.passaro.x = this.estilingue.x + Math.cos(a) * d;
                this.passaro.y = this.estilingue.y + Math.sin(a) * d;
            }
        });
        window.addEventListener("mouseup", () => {
            if (this.estado.puxandoCorda) {
                this.estado.puxandoCorda = false; this.estado.noAr = true;
                this.passaro.xInicial = this.passaro.x; this.passaro.yInicial = this.passaro.y;
                this.passaro.vX = (this.estilingue.x - this.passaro.x) * this.ajustes.forcaDoLancamento;
                this.passaro.vY = (this.estilingue.y - this.passaro.y) * this.ajustes.forcaDoLancamento;
            }
        });
    }

    loop = (t) => requestAnimationFrame(this.atualizar);
}

new JogoHappyBird();