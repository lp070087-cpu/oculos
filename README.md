# Oliveira OKL: apresentação comercial

Demonstração navegável com loja, área do cliente, painel administrativo e central WhatsApp simulada.

## Como abrir

```bash
npm install
npm run build
npm start
```

Use sempre `npm run build` e `npm start` para apresentar: `npm run dev` compila cada página na hora e pode levar minutos para abrir. Abra `http://localhost:3000/demo` para o roteiro. Para o efeito de pedido em tempo real, deixe a loja e o painel em abas diferentes do mesmo navegador.

| Ambiente | Endereço |
| --- | --- |
| Loja | `/` |
| Área do cliente | `/conta` |
| Painel | `/painel` |
| Roteiro dos 5 cenários | `/demo` |

Para repetir a apresentação do zero, use **Restaurar demonstração** em `/demo` ou em `/painel/ajustes`.

## O que é real, simulado e futuro

**Real na loja atual:** nomes, preços, fotos, categorias, telefone, Instagram, cidade e regras comerciais (mínimo de 6 peças, modelos mesclados, frete fixo de R$ 40, envio nacional).

**Funciona de verdade na demonstração:** navegação, busca, favoritos, carrinho com regra de mínimo, checkout de teste, baixa de estoque, sincronização entre abas, cupons, gestão de pedidos, produtos, clientes e campanhas. Os dados ficam no navegador (`localStorage`).

**Simulado:** clientes, pedidos, estoques, valores do financeiro, login, pagamento, conexão e mensagens de WhatsApp e a "IA" (regras locais em `lib/ai.ts`, sem modelo externo).

**Depende de integração oficial:** Cloud API da Meta, modelos aprovados, gateway de pagamento, banco Neon, autenticação real e transportadora.

## Grupos do WhatsApp

Pela documentação da Meta atualizada em 15/10/2026, a API de Grupos tem limite de 8 participantes, exige conta comercial oficial (OBA) e cria grupos próprios por convite. Não serve para publicar em grupos grandes já existentes. O painel apresenta alternativas compatíveis.

## Pontos a validar antes de publicar

- Várias fotos exibem marca de terceiro, e os nomes dos modelos coincidem com os dela. Confirme a autorização de revenda antes de qualquer publicação.
- Retirada, cartão e formas de pagamento além do Pix não foram confirmados na loja.
- As fotos disponíveis são miniaturas (até 450 px de largura). Originais melhorariam a loja e os banners.

## Modo produção

`NEXT_PUBLIC_APP_MODE=production` troca o provedor em `lib/integrations/whatsapp.ts`, que hoje só retorna "não configurado". O esquema inicial do banco está em `db/schema.sql`, e `lib/demo/store.ts` é o ponto a substituir por uma API.

## Banners

Três campanhas em desktop e mobile (`public/banners/`, WebM, MP4 e WebP), renderizadas com fotos reais da loja em HTML/Canvas, Chrome headless e ffmpeg. O Canva gerou apenas uma placa de luz usada como névoa no Banner 01. Nano Banana não estava disponível.
