# Changelog

## 0.1.1 — 2026-09-01

Sincronizados dois fixes de precisão do CPF/CNPJ e placa que já rodavam no motor privado (kernel EGOS) desde julho/2026:

- **CNPJ**: adicionado lookbehind `(?<!\d\.)` para não confundir fração decimal (ex.: `69.99999999999966`) com CNPJ — falso-positivo medido 2026-07-26.
- **Placa (antiga e Mercosul)**: removida a flag `i` (case-insensitive) — texto minúsculo tipo "por 1000"/"faz 1500" era detectado como placa e apagava preços reais em contexto de bot de vendas (GUARD-PLACA-FP-001, 2026-06-21). Placa Mercosul passou a aceitar separador opcional (`ABC-1D23`), fechando um falso-negativo comum em boletim de ocorrência (2026-07-27).

## 0.1.0

Versão inicial publicada.
