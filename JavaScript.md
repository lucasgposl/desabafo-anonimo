# Main.js — Lógica da Aplicação

## Função do arquivo

O `main.js` controla todo o comportamento do sistema.

Ele é responsável por:

* publicar desabafos
* renderizar cards
* salvar dados
* atualizar interface
* reagir às interações do usuário

---

# Estrutura Geral

O código foi dividido em módulos para melhorar:

* organização
* manutenção
* leitura
* reutilização

---

# Storage

Responsável pela persistência dos dados.

## Funções:

### Storage get

Recupera os desabafos salvos no `localStorage`.

---

### Salvar datas

Salva os dados atualizados no navegador.

---

# Utils

Funções auxiliares reutilizáveis.

## Principais funções:

### Gerar Id

Cria identificadores únicos para cada desabafo.

---

### Tempo relativo

Transforma datas em textos mais amigáveis.

### Exemplos:

* “agora”
* “2 minutos atrás”

---

# UI

Responsável pela interface visual.

---

## Criar Card

Cria dinamicamente um card de desabafo.

### Inclui:

* texto
* tempo
* reações
* estilo baseado no sentimento

---

## Render

Atualiza o feed completo.

### Função:

* limpar feed antigo
* renderizar novamente os cards

---

## Limpar

Limpa o campo de texto após publicação.

---

## Mensagem

Mostra mensagens temporárias para o usuário.

---

# App

Camada principal da aplicação.

Coordena:

* UI
* Storage
* eventos
* dados

---

## Init

Inicializa o sistema.

### Executa:

* carregamento de dados
* renderização inicial
* eventos

---

## Publicar

Cria um novo desabafo.

### Processo:

1. Captura dados do formulário
2. Valida texto
3. Cria objeto
4. Salva no localStorage
5. Atualiza interface

---

## Atualizar reações

Atualiza as reações de um desabafo.

### Responsável por:

* incrementar contador
* salvar alteração
* renderizar novamente

---

## Remover

Remove todos os desabafos salvos.

---

## Filtrar

Renderiza o feed aplicando filtros ativos.

---

# Fluxo da Aplicação

Usuário escreve
      ↓
App.publicar()
      ↓
Storage.save()
      ↓
UI.render()
      ↓
Feed atualizado
```

---

# Funcionalidades do Sistema

* Publicação anônima
* Persistência local
* Reações emocionais
* Filtro por sentimento
* Contador de publicações
* Atualização dinâmica da interface

---
