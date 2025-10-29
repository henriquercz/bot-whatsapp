# 📚 Sistema de Contexto Histórico - WhatsApp AI Bot

## 🎯 Objetivo

Implementar um sistema que forneça contexto histórico de mensagens anteriores para a IA, permitindo respostas mais coerentes e contextualizadas.

---

## 📋 Especificações

### **Regras de Contexto:**

1. **Chats Privados (1:1):**
   - Buscar as **últimas 5 mensagens** antes da mensagem atual
   - Total: 5 mensagens antigas + 1 mensagem nova = 6 mensagens processadas

2. **Grupos:**
   - Buscar as **últimas 10 mensagens** antes da mensagem atual
   - Total: 10 mensagens antigas + 1 mensagem nova = 11 mensagens processadas

3. **Diferenciação de Remetente (CRÍTICO):**
   - Mensagens do usuário (Capitão Henrique): Identificar como "Você"
   - Mensagens dos outros: Identificar com nome do contato ou "Pessoa"
   - Isso evita conflito de contexto na IA

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

### **Cenário 1: Chat Privado**
```
Histórico:
[pessoa]: oi tudo bem?
[você]: opa beleza e tu?
[pessoa]: to bem sim, viu aquele jogo ontem?
[você]: vi mano que loucura
[pessoa]: demais ne

Nova mensagem:
[pessoa]: vamos assistir o proximo junto?

Esperado:
Bot responde com contexto sobre o jogo mencionado
```

### **Cenário 2: Grupo**
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

---

## ⚠️ Considerações

### **Performance:**
- Consulta SQL adicional por resposta
- Impacto mínimo (índice em `chat_id` + `timestamp`)

### **Privacidade:**
- Histórico já está no banco
- Nenhum dado novo é armazenado

### **Limites:**
- Privado: 5 mensagens (~500-1000 tokens)
- Grupo: 10 mensagens (~1000-2000 tokens)
- Total do prompt não deve exceder limite do Gemini (32k tokens)

---

## 📝 Checklist de Implementação

```
[ ] 1. Adicionar getRecentMessages() em memory.js
[ ] 2. Modificar processGroupedMessages() em messageHandler.js
[ ] 3. Adicionar parâmetro historicalMessages em gemini.js
[ ] 4. Adicionar formatSenderName() em promptBuilder.js
[ ] 5. Modificar buildPrompt() em promptBuilder.js
[ ] 6. Testar em chat privado
[ ] 7. Testar em grupo
[ ] 8. Validar diferenciação de remetentes
[ ] 9. Commit e push para repositório
[ ] 10. Deploy na Oracle Cloud
```

---

## 🚀 Próximos Passos Após Implementação

1. Monitorar logs para verificar histórico carregado
2. Testar conversas longas
3. Ajustar limites se necessário (5/10 mensagens)
4. Considerar adicionar nomes de contatos salvos

---

**Autor:** Capitão Henrique  
**Data:** 29/10/2024  
**Versão:** 1.0
