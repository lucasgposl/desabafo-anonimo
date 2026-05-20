const Storage = {
  get() {
    try {
      return JSON.parse(localStorage.getItem("desabafos")) || [];
    } catch {
      return [];
    }
  },
  save(data) {
    localStorage.setItem("desabafos", JSON.stringify(data));
  }
};

const Utils = {
  gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  tempoRelativo(data) {
    const agora = new Date();
    const diff = Math.floor((agora - new Date(data)) / 1000);

    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;

    return new Date(data).toLocaleDateString();
  }
};

const UI = {
  feed: document.getElementById("feed"),
  texto: document.getElementById("texto"),
  sentimento: document.getElementById("sentimento"),
  filtro: document.getElementById("filtro"),
  contador: document.getElementById("contador"),
  feedback: document.getElementById("feedback"),

  criarCard(item) {
    const card = document.createElement("div");
    card.className = `card ${item.sentimento}`;

    const texto = document.createElement("p");
    texto.innerText = item.oculto ? "Clique para revelar..." : item.texto;

    texto.style.cursor = "pointer";
    texto.addEventListener("click", () => {
      item.oculto = !item.oculto;
      Storage.save(App.lista);
      App.render();
    });

    const tempo = document.createElement("small");
    tempo.innerText = Utils.tempoRelativo(item.data);

    const reacoes = document.createElement("div");
    reacoes.className = "reacoes";

    const btnApoio = document.createElement("button");
    btnApoio.innerText = `(${item.apoio})`;
    btnApoio.onclick = () => App.reagir(item.id, "apoio");

    const btnForca = document.createElement("button");
    btnForca.innerText = `(${item.forca})`;
    btnForca.onclick = () => App.reagir(item.id, "forca");

    reacoes.append(btnApoio, btnForca);

    card.append(texto, tempo, reacoes);

    return card;
  },

  render(lista) {
    this.feed.innerHTML = "";

    lista.forEach(item => {
      this.feed.appendChild(this.criarCard(item));
    });

    this.contador.innerText = `${lista.length} desabafos`;
  },

  limparInput() {
    this.texto.value = "";
  },

  mensagem(msg) {
    this.feedback.innerText = msg;
    setTimeout(() => (this.feedback.innerText = ""), 3000);
  }
};

const App = {
  lista: [],

  mensagens: [
    "Você não está sozinho",
    "Seu sentimento importa",
    "Respira… vai passar",
    "Alguém entende você"
  ],

  init() {
    this.lista = Storage.get();

    document.getElementById("btnPublicar")
      .addEventListener("click", () => this.publicar());

    document.getElementById("btnLimpar")
      .addEventListener("click", () => this.limpar());

    document.getElementById("filtro")
      .addEventListener("change", () => this.render());

    this.render();
  },

  publicar() {
    const texto = UI.texto.value.trim();
    const sentimento = UI.sentimento.value;

    if (!texto) return alert("Escreva algo!");

    this.lista.unshift({
      id: Utils.gerarId(),
      texto,
      sentimento,
      apoio: 0,
      forca: 0,
      oculto: false,
      data: new Date()
    });

    Storage.save(this.lista);

    UI.limparInput();
    UI.mensagem(this.getMensagem());

    this.render();
  },

  reagir(id, tipo) {
    const item = this.lista.find(d => d.id === id);
    if (!item) return;

    item[tipo]++;
    Storage.save(this.lista);

    this.render();
  },

  limpar() {
    if (confirm("Apagar tudo?")) {
      this.lista = [];
      Storage.save([]);
      this.render();
    }
  },

  getMensagem() {
    return this.mensagens[
      Math.floor(Math.random() * this.mensagens.length)
    ];
  },

  render() {
    const filtro = document.getElementById("filtro").value;

    let listaFiltrada = this.lista;

    if (filtro !== "todos") {
      listaFiltrada = this.lista.filter(d => d.sentimento === filtro);
    }

    UI.render(listaFiltrada);
  }
};

App.init();