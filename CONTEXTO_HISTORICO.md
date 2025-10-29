# 📚 Sistema de Contexto Histórico - WhatsApp AI Bot

## 🎯 Objetivo

Implementar um sistema que forneça contexto histórico de mensagens anteriores para a IA, permitindo respostas mais coerentes e contextualizadas.

---

## 📋 Especificações

### **Regras de Contexto:**

1. **Chats Privados (1:1):**
   - Buscar **até 5 mensagens** recentes (última 1 hora)
   - ⚠️ **Flexível:** Pode ser 0-5 mensagens dependendo do histórico
   - Se conversa é nova, pode ter apenas 1-2 mensagens

2. **Grupos:**
   - Buscar **até 10 mensagens** recentes (última 1 hora)
   - ⚠️ **Flexível:** Pode ser 0-10 mensagens dependendo do histórico
   - Grupos com pouca atividade recente terão menos contexto

3. **Filtro Temporal:**
   - Apenas mensagens da **última 1 hora** são consideradas
   - Evita contexto desatualizado ou conversas antigas
   - Detecta automaticamente mudança de assunto por gap temporal

4. **Diferenciação de Remetente (CRÍTICO):**
   - Mensagens do usuário (Capitão Henrique): Identificar como "você"
   - Mensagens dos outros: Identificar com `pessoa (1234)` (últimos 4 dígitos)
   - Isso evita conflito de contexto na IA

5. **Aviso à IA:**
   - Se histórico está vazio: "Conversa recente iniciada"
   - Se histórico parcial: "X mensagens recentes - pode haver mais contexto não exibido"
   - IA deve adaptar resposta ao contexto disponível

---

## 🏗️ Arquitetura da Solução

### **Componentes Afetados:**

```
1. src/database/memory.js
   └─ Adicionar método: getRecentMessages(chatId, limit)
   
2. src/whatsapp/messageHandler.js
   └─ Modificar: processGroupedMessages()
   └─ Buscar histórico antes de processar
   
3. src/ai/promptBuilder.js
   └─ Modificar: buildPrompt()
   └─ Incluir histórico formatado no prompt
```

---

## 📊 Fluxo de Dados

```
1. Mensagem chega → messageHandler
   ↓
2. Mensagens são agrupadas (debounce)
   ↓
3. processGroupedMessages() é chamado
   ↓
4. Buscar histórico no banco:
   - Privado: últimas 5 msgs
   - Grupo: últimas 10 msgs
   ↓
5. Formatar histórico com diferenciação:
   - "[Você]: texto da mensagem"
   - "[Nome/Pessoa]: texto da mensagem"
   ↓
6. Passar histórico + mensagem atual para IA
   ↓
7. IA processa com contexto completo
   ↓
8. Resposta é enviada
```

---

## 🗄️ Estrutura do Banco de Dados

### **Tabela Existente: `conversation_history`**

```sql
CREATE TABLE IF NOT EXISTS conversation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  is_bot BOOLEAN DEFAULT 0,
  UNIQUE(chat_id, timestamp)
)
```

### **Campos Relevantes:**

- `chat_id`: Identificador do chat/grupo
- `sender`: Número do remetente (ex: 5511974980928@s.whatsapp.net)
- `message`: Conteúdo da mensagem
- `timestamp`: Unix timestamp
- `is_bot`: 0 = mensagem de pessoa, 1 = mensagem do bot

---

## 🔧 Implementação Detalhada

### **PASSO 1: Adicionar método no Memory (src/database/memory.js)**

```javascript
/**
 * Busca mensagens recentes de um chat para contexto
 * @param {string} chatId - ID do chat
 * @param {number} limit - Quantidade de mensagens
 * @returns {Array} Array de mensagens ordenadas cronologicamente
 */
getRecentMessages(chatId, limit = 5) {
  const stmt = this.db.prepare(`
    SELECT sender, message, timestamp, is_bot
    FROM conversation_history
    WHERE chat_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  
  const messages = stmt.all(chatId, limit);
  
  // Inverter ordem para cronológica (mais antiga primeiro)
  return messages.reverse();
}
```

---

### **PASSO 2: Modificar processGroupedMessages (src/whatsapp/messageHandler.js)**

```javascript
async processGroupedMessages(chatId) {
  try {
    const buffer = this.messageBuffers.get(chatId);
    if (!buffer || buffer.length === 0) {
      logger.warn(`⚠️ Buffer vazio para ${chatId}`);
      return;
    }

    // Determinar se é grupo
    const isGroup = chatId.includes('@g.us');
    
    // Definir limite de histórico
    const historyLimit = isGroup ? 10 : 5;
    
    // NOVO: Buscar histórico de mensagens
    const historicalMessages = this.memory.getRecentMessages(chatId, historyLimit);
    logger.info(`📚 Histórico carregado: ${historicalMessages.length} mensagens`);

    // Combinar mensagens do buffer
    const combinedText = buffer.map(msg => msg.text).join('\n');
    const firstMessage = buffer[0];
    
    logger.info(`📝 Mensagens combinadas (${buffer.length}):\n${combinedText}`);
    
    // Verificar contato especial
    const specialContactInfo = this.chatConfig.getSpecialContactInfo(chatId);

    // Buscar perfil do usuário
    const userStyle = await this.memory.getUserStyleProfile();
    
    // MODIFICADO: Passar histórico para o Gemini
    const response = await this.gemini.generateResponse(
      combinedText,
      userStyle,
      specialContactInfo,
      historicalMessages  // NOVO PARÂMETRO
    );

    // ... resto do código continua igual
  } catch (error) {
    logger.error('❌ Erro ao processar mensagens agrupadas:', error);
  }
}
```

---

### **PASSO 3: Modificar Gemini AI (src/ai/gemini.js)**

```javascript
async generateResponse(messageText, userStyle, specialContactInfo = null, historicalMessages = []) {
  try {
    logger.info('🤖 Gerando resposta com Gemini 2.5 Flash...');
    
    // MODIFICADO: Passar histórico para promptBuilder
    const prompt = this.promptBuilder.buildPrompt(
      messageText,
      userStyle,
      specialContactInfo,
      historicalMessages  // NOVO PARÂMETRO
    );

    logger.info(`📤 Prompt enviado ao Gemini (${prompt.length} caracteres)`);
    
    const result = await this.model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    logger.info(`📥 Resposta do Gemini: ${text.substring(0, 100)}...`);
    
    return text;
  } catch (error) {
    logger.error('❌ Erro ao gerar resposta com Gemini:', error);
    throw error;
  }
}
```

---

### **PASSO 4: Modificar PromptBuilder (src/ai/promptBuilder.js)**

```javascript
buildPrompt(message, userStyle, specialContactInfo = null, historicalMessages = []) {
  // Determinar qual prompt usar
  const basePrompt = specialContactInfo
    ? this.buildGirlfriendPrompt(userStyle, specialContactInfo)
    : this.buildDefaultPrompt(userStyle);

  // NOVO: Formatar histórico
  let historyContext = '';
  if (historicalMessages && historicalMessages.length > 0) {
    historyContext = '\n\n=== CONTEXTO DA CONVERSA (MENSAGENS ANTERIORES) ===\n\n';
    
    historicalMessages.forEach(msg => {
      const sender = this.formatSenderName(msg.sender, msg.is_bot);
      historyContext += `[${sender}]: ${msg.message}\n`;
    });
    
    historyContext += '\n=== FIM DO CONTEXTO ===\n';
  }

  // Construir prompt final
  const fullPrompt = `${basePrompt}

${historyContext}

=== MENSAGEM ATUAL PARA RESPONDER ===

${message}

=== SUA RESPOSTA ===`;

  return fullPrompt;
}

/**
 * Formata o nome do remetente para o contexto
 * @param {string} sender - Número do remetente
 * @param {boolean} isBot - Se é mensagem do bot
 * @returns {string} Nome formatado
 */
formatSenderName(sender, isBot) {
  // Se é o bot, é "Você" (Henrique)
  if (isBot) {
    return 'você';
  }
  
  // Se é o próprio Henrique (número dele)
  if (sender.includes('5511974980928')) {
    return 'você';
  }
  
  // Tentar extrair nome do contato (se disponível)
  // Por enquanto, usar apenas "pessoa" ou número parcial
  const phoneMatch = sender.match(/(\d+)@/);
  if (phoneMatch) {
    const phone = phoneMatch[1];
    const lastDigits = phone.slice(-4);
    return `pessoa (${lastDigits})`;
  }
  
  return 'pessoa';
}
```

---

## 🧪 Testes e Validação

### **Cenário 1: Chat Privado com Histórico Completo (5 msgs)**
```
Histórico:
[pessoa (7744)]: oi tudo bem?
[você]: opa beleza e tu?
[pessoa (7744)]: to bem sim, viu aquele jogo ontem?
[você]: vi mano que loucura
[pessoa (7744)]: demais ne

Nova mensagem:
[pessoa (7744)]: vamos assistir o proximo junto?

Esperado:
Bot responde com contexto sobre o jogo mencionado
```

### **Cenário 2: Conversa Recente (apenas 2 msgs)**
```
Histórico:
[pessoa (9876)]: oi
[você]: opa

Nova mensagem:
[pessoa (9876)]: tudo bem?

Aviso à IA:
"(⚠️ 2 mensagens recentes - pode haver mais contexto não exibido)"

Esperado:
Bot responde naturalmente, sem assumir contexto que não existe
```

### **Cenário 3: Conversa Nova (sem histórico)**
```
Histórico: vazio

Nova mensagem:
[pessoa (5555)]: ola voce pode me ajudar?

Aviso à IA:
"Conversa recente iniciada. Sem histórico anterior."

Esperado:
Bot responde como início de conversa: "opa, dboa cara, fala ae"
```

### **Cenário 4: Grupo com Múltiplos Participantes**
```
Histórico (10 mensagens):
[pessoa (1234)]: alguem sabe onde fica o restaurante?
[pessoa (5678)]: fica na rua principal
[você]: eh perto do shopping
[pessoa (1234)]: ah entendi
[pessoa (9012)]: chegou todo mundo?
[você]: to chegando
[pessoa (5678)]: ja to aqui
[pessoa (1234)]: tbm
[pessoa (9012)]: falta so voce entao
[você]: daqui 5 min chego

Nova mensagem:
[pessoa (1234)]: e ai chegou?

Esperado:
Bot responde considerando que disse "daqui 5 min chego"
```

### **Cenário 5: Mudança de Assunto (gap temporal)**
```
Histórico: vazio (última mensagem foi há 2h)

Nova mensagem:
[pessoa (7744)]: e ae, viu aquela noticia?

Aviso à IA:
"Conversa recente iniciada. Sem histórico anterior."

Esperado:
Bot trata como conversa nova, sem assumir contexto antigo
```

---

## 🎯 Benefícios

1. **Respostas Mais Coerentes:**
   - Bot entende referências a mensagens anteriores
   
2. **Contexto Mantido:**
   - Conversas fluem naturalmente
   
3. **Diferenciação Clara:**
   - IA sabe o que você disse vs o que outros disseram
   
4. **Experiência Melhorada:**
   - Bot parece "lembrar" da conversa

5. **Flexibilidade Inteligente:**
   - Funciona bem com conversas novas (1-2 msgs)
   - Funciona bem com conversas longas (5-10 msgs)
   - Adapta-se ao contexto disponível

6. **Detecção Temporal:**
   - Ignora mensagens antigas (>1h)
   - Detecta mudança de assunto automaticamente
   - Evita confusão de contexto

---

## ⚠️ Considerações

### **Performance:**
- Consulta SQL adicional por resposta
- Impacto mínimo (índice em `chat_id` + `timestamp`)
- Filtro temporal torna queries mais eficientes

### **Privacidade:**
- Histórico já está no banco
- Nenhum dado novo é armazenado
- Apenas últimas 1h de mensagens são acessadas

### **Limites:**
- Privado: até 5 mensagens (~500-1000 tokens)
- Grupo: até 10 mensagens (~1000-2000 tokens)
- Flexível: pode ser 0-5 ou 0-10 dependendo do histórico
- Total do prompt não deve exceder limite do Gemini (32k tokens)

### **Janela Temporal:**
- Padrão: 1 hora de histórico
- Ajustável via parâmetro `maxAgeHours`
- Evita contexto desatualizado

---

## 📝 Checklist de Implementação

```
[✅] 1. Melhorar getRecentMessages() em conversationMemory.js (com filtro temporal)
[✅] 2. Modificar processGroupedMessages() em messageHandler.js (limite flexível)
[✅] 3. Adicionar parâmetro conversationHistory em gemini.js
[✅] 4. Melhorar formatHistoryForGemini() em messageHandler.js
[✅] 5. Modificar buildSystemPrompt() em promptBuilder.js
[✅] 6. Adicionar método formatHistory() em promptBuilder.js
[✅] 7. Implementar avisos à IA sobre contexto limitado
[✅] 8. Atualizar documentação com cenários flexíveis
[ ] 9. Testar em chat privado com histórico completo
[ ] 10. Testar em chat privado com histórico parcial (1-2 msgs)
[ ] 11. Testar conversa nova (sem histórico)
[ ] 12. Testar em grupo
[ ] 13. Validar diferenciação de remetentes
[ ] 14. Commit e push para repositório
[ ] 15. Deploy na Oracle Cloud
```

---

## 🚀 Próximos Passos Após Implementação

1. Monitorar logs para verificar histórico carregado
2. Testar conversas longas e curtas
3. Validar que contexto flexível funciona corretamente
4. Ajustar janela temporal se necessário (padrão: 1h)
5. Considerar adicionar nomes de contatos salvos

---

## ⚙️ Configuração Avançada

### **Ajustar Janela Temporal:**

Se quiser alterar o período de histórico (padrão: 1 hora), edite `messageHandler.js`:

```javascript
// Linha ~259 em messageHandler.js
const recentMessages = this.memory.getRecentMessages(chatId, historyLimit);

// Alterar para janela de 2 horas:
const recentMessages = this.memory.getRecentMessages(chatId, historyLimit, 2);

// Alterar para janela de 30 minutos:
const recentMessages = this.memory.getRecentMessages(chatId, historyLimit, 0.5);
```

### **Ajustar Limites de Mensagens:**

```javascript
// Linha ~255 em messageHandler.js
const historyLimit = isGroup ? 10 : 5;

// Exemplo: Aumentar para 7 privado, 15 grupo
const historyLimit = isGroup ? 15 : 7;
```

---

**Autor:** Capitão Henrique  
**Data:** 29/10/2024  
**Versão:** 2.0 (com flexibilidade e filtro temporal)
