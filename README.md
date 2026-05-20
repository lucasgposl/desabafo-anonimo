# Espaço Seguro

## Sobre o projeto

O **Espaço Seguro** é uma aplicação web simples que permite que pessoas expressem seus sentimentos de forma totalmente anônima.

A proposta do projeto é criar um ambiente digital acolhedor, onde qualquer pessoa possa desabafar sem julgamentos e encontrar identificação em outras experiências.



## Objetivo

* Permitir que usuários escrevam desabafos livremente
* Criar sensação de acolhimento emocional
* Incentivar empatia através de interações simples
* Manter anonimato total (sem cadastro)



## Funcionalidades

### Publicação

* Campo de texto para desabafo
* Seleção de sentimento:

  * Tristeza
  * Raiva
  * Alívio
* Botão "Publicar"



### Feed de desabafos

* Exibição dos mais recentes primeiro
* Armazenamento local (localStorage)
* Persistência mesmo ao recarregar a página



### Interações

* Botão "Eu me identifiquei"
* Botão "Força"
* Contador de cliques por desabafo



### Experiência do usuário

* Mensagem acolhedora após publicação
* Interface simples e focada
* Design em modo escuro
* Layout responsivo



### Filtro

* Filtrar desabafos por sentimento



### Controle

* Botão para apagar todos os desabafos



## Tecnologias utilizadas

* HTML5
* CSS3 (Flexbox)
* JavaScript puro (Vanilla JS)
* LocalStorage (armazenamento no navegador)



## Estrutura do projeto

```
 projeto/
 ├── index.html
 ├── estilos.css
 └── main.js
```



## Arquitetura do código

O projeto foi organizado em módulos:

### UI

Responsável por manipular a interface e renderizar os elementos na tela.

### App

Controla a lógica principal do sistema:

* publicar desabafos
* reagir
* filtrar
* atualizar interface

### Utils

Funções auxiliares:

* geração de ID
* cálculo de tempo relativo



## Armazenamento

Os dados são armazenados no navegador usando:

```javascript
localStorage.setItem("desabafos", JSON.stringify(lista));
```



## Aviso importante

> Este site não substitui ajuda profissional.


## Possíveis melhorias futuras

* Sistema de login anônimo
* Integração com banco de dados (Firebase)
* Moderação de conteúdo
* IA para respostas automáticas
* Desabafos temporários (expiram com o tempo)



## Conceito

Este projeto funciona como:

* um diário público
* um espaço seguro
* um eco de sentimentos

### Autores
Lucas Gabriel e Styven
