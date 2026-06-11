# WebFlow

Ferramenta **web** para construção e execução de fluxogramas, voltada ao ensino de
lógica de programação. O WebFlow permite montar um algoritmo por blocos, executá-lo
**passo a passo** no navegador — com painel de variáveis e console interativo — e
exportá-lo como código em linguagem C. Foi desenvolvido como Trabalho de Conclusão
de Curso, inspirado no Flowgorithm, com o diferencial de funcionar inteiramente no
navegador, sem instalação e de forma multiplataforma.

**Aplicação online:** https://webflow-sigma.vercel.app/

## Funcionalidades

- Editor visual de fluxogramas com seis tipos de bloco: declaração, atribuição,
  entrada, saída, condicional (`se/senão`) e laço (`enquanto`).
- Execução passo a passo, com destaque do bloco em execução, painel de variáveis
  em tempo real e console interativo para entrada e saída de dados.
- Avaliador de expressões próprio, compatível com a sintaxe do Flowgorithm
  (operadores `mod`, `<>` e `^`, entre outros).
- Importação de arquivos `.fprg` (Flowgorithm) e exportação do fluxograma para
  código em linguagem C.
- Contas de usuário e persistência dos projetos em nuvem.
- Temas claro e escuro.

## Tecnologias

**Frontend:** React, TypeScript, Vite, React Flow (`@xyflow/react`), Tailwind CSS.

**Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), autenticação JWT.

## Estrutura do repositório

```
webflow/
├── frontend/   # aplicação React (editor, interpretador, exportadores)
└── backend/    # API REST (autenticação e persistência dos fluxos)
```

O motor de execução dos fluxogramas (interpretador, avaliador de expressões e
gerador de código C) é executado no próprio frontend, no navegador. O backend é
responsável apenas pela autenticação e pelo armazenamento dos projetos.

## Executando localmente

Pré-requisitos: Node.js e uma instância do MongoDB.

**Backend**
```bash
cd backend
npm install
# configure as variáveis de ambiente (conexão com o MongoDB e segredo JWT)
# em um arquivo .env, conforme backend/src/config/env.ts
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
# defina VITE_API_URL apontando para o backend (ex.: http://localhost:3000)
npm run dev
```

## Testes

O núcleo lógico possui testes automatizados com Vitest, cobrindo o avaliador de
expressões, o interpretador, o gerador de código C e as operações sobre a árvore
de comandos.

```bash
cd frontend
npm test
```

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).

## Autoria

Desenvolvido por **Rafael Macêdo Galvão de Carvalho**, sob orientação do
**Prof. Liojes de Oliveira Carneiro**, no Instituto Federal de Educação, Ciência e
Tecnologia da Bahia (IFBA) — Campus Vitória da Conquista.
