# guard-brasil

**Camada de segurança para IAs que operam no Brasil.**

Detecta e mascara dados pessoais brasileiros (LGPD), valida eticamente respostas de LLMs e mantém rastro auditável de evidências — sem dependências externas de infraestrutura.

[![npm version](https://img.shields.io/npm/v/guard-brasil)](https://www.npmjs.com/package/guard-brasil)
[![license](https://img.shields.io/npm/l/guard-brasil)](./LICENSE)

---

## O que é

`guard-brasil` é uma biblioteca TypeScript que age como filtro de saída entre seu LLM e o usuário final. Ela compõe três camadas:

1. **ATRiAN** — detecta alegações absolutas ("com certeza"), promessas falsas ("vamos resolver") e referências a dados fabricados.
2. **PII Scanner BR** — identifica e mascara 16 tipos de dados pessoais brasileiros definidos pela LGPD.
3. **Evidence Chain** — anexa proveniência auditável a respostas com fontes documentais.

A combinação garante que sua IA nunca exponha dados sensíveis nem faça afirmações irresponsáveis.

---

## Instalação

```bash
npm install guard-brasil
# ou
bun add guard-brasil
```

Sem dependências de produção. Funciona em Node.js 18+ e Bun.

---

## Quick start

```typescript
import { GuardBrasil } from 'guard-brasil';

const guard = GuardBrasil.create();

// Texto vindo do LLM
const llmResponse = `O CPF do solicitante é 123.456.789-09 e ele
pediu para resolver o caso imediatamente. Com certeza encaminharemos.`;

const result = guard.inspect(llmResponse);

if (!result.safe) {
  console.log(result.output);
  // "O CPF do solicitante é [CPF REMOVIDO] e ele
  //  pediu para resolver o caso imediatamente. ***"
  console.log(result.summary);
  // "Issues found: ATRiAN: 2 violation(s) (false_promise, absolute_claim) | PII: 1 finding(s) (critical)"
  console.log(result.lgpdDisclosure);
  // "[LGPD] Dados pessoais detectados e mascarados nesta resposta: CPF. Conforme Lei 13.709/2018."
}
```

---

## Tipos de PII detectados (16 categorias)

| Categoria | Exemplo | Confiança |
|-----------|---------|-----------|
| CPF | `123.456.789-09` | alta |
| CNPJ | `12.345.678/0001-90` | alta |
| RG | `RG 12.345.678-9` | alta |
| CNH | `CNH 12345678901` | média |
| Cartão SUS | `100 0000 0000 0001` | média |
| Título de Eleitor | `1234 5678 9012` | baixa |
| NIS/PIS | `123.45678.90-1` | média |
| MASP | `MASP 1234567-8` | alta |
| REDS | `REDS 2024/0098765` | alta |
| Processo Judicial | `1234567-89.2024.8.13.0001` | alta |
| Placa (antigo) | `ABC-1234` | média |
| Placa (Mercosul) | `ABC1D23` | média |
| Email | `fulano@empresa.com.br` | alta |
| Telefone | `(31) 99999-8888` | média |
| CEP | `30140-110` | baixa |
| Dado de Saúde | `portador de diabetes` | média |

Além dessas, `INFRASTRUCTURE_SECRET_PATTERNS` cobre chaves AWS, tokens GitHub, chaves Stripe, strings de conexão de banco e tokens Bearer — útil para escanear código ou configs.

---

## Comparação com Presidio (Microsoft)

| Característica | guard-brasil | Presidio |
|----------------|-------------|----------|
| Foco em PII brasileira | nativo (CPF, MASP, REDS, CNPJ…) | requer customização |
| Validação ética de LLM (ATRiAN) | sim | não |
| Evidence Chain auditável | sim | não |
| Mascaramento reversível (vault) | sim | não |
| Dependência de Python/spaCy | não | sim |
| Sem servidor externo | sim | sim |
| Profiles institucionais via JSON | sim | parcial |

---

## Mascaramento reversível (tokenização)

Quando você precisa enviar texto ao LLM mas restaurar os valores depois:

```typescript
import { namedTokenize, namedRestore } from 'guard-brasil';

const { tokenized, vault } = namedTokenize(rawText);
// "O CPF do suspeito é [CPF_0001]."

const llmOutput = await callLLM(tokenized); // seguro
const restored = namedRestore(llmOutput, vault);
// CPF restaurado na resposta final
```

Compatível com o formato DataVirtus de anonimização.

---

## Profiles institucionais (extensibilidade)

Cada instituição pode definir seus próprios padrões de PII sem modificar o núcleo:

```typescript
import { GuardBrasil } from 'guard-brasil';
import type { InstitutionProfile } from 'guard-brasil/registry';

const myProfile: InstitutionProfile = {
  id: 'tjsp',
  name: 'Tribunal de Justiça de São Paulo',
  scope: 'court',
  state: 'SP',
  version: '0.1.0',
  updatedAt: '2024-01-01',
  patterns: [
    {
      id: 'tjsp:numero_externo',
      label: 'Número Externo TJSP',
      regex: /\bEXT-\d{4}-\d{6}\b/g,
      maskFormat: '[NR EXTERNO REMOVIDO]',
      confidence: 'low',
    },
  ],
};

const guard = GuardBrasil.create({
  customPatterns: myProfile.patterns,
});
```

Inicie com `confidence: 'low'`, valide com humanos via HITL, promova para `'high'` após confirmações suficientes.

---

## API resumida

### `GuardBrasil.create(config?)`

| Config | Tipo | Padrão | Descrição |
|--------|------|--------|-----------|
| `blockOnCriticalPII` | `boolean` | `false` | Bloqueia output quando CPF/RG/MASP detectados |
| `lgpdDisclosure` | `boolean` | `true` | Adiciona nota LGPD ao output mascarado |
| `customPatterns` | `CustomPIIPattern[]` | `[]` | Padrões de PII da sua instituição |
| `atrian` | `AtrianConfig` | `{}` | Config do validador ético |

### `guard.inspect(text, options?)`

Retorna `GuardBrasilResult`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `safe` | `boolean` | `true` se sem PII e sem violações ATRiAN |
| `output` | `string` | Texto processado (mascarado ou bloqueado) |
| `masking` | `MaskingResult` | Detalhes dos findings de PII |
| `atrian` | `AtrianResult` | Score e violações éticas |
| `lgpdDisclosure` | `string` | Nota LGPD (vazia se sem PII) |
| `receipt` | `InspectionReceipt` | Hashes criptográficos para auditoria |

---

## Conformidade

- **LGPD (Lei 13.709/2018)** — mascaramento de dados sensíveis art. 5º e art. 11º
- **ATRiAN** — validação ética de respostas de IA
- Hashes SHA-256 para rastreabilidade de proveniência

---

## Licença

MIT — veja [LICENSE](./LICENSE).
