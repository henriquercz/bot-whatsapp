# 📋 TODO List - Bot WhatsApp AI

## 🚀 Funcionalidades Solicitadas pelo Capitão Henrique

### ✅ Implementadas
- [x] Sistema de autorização de chats e grupos
- [x] Integração com Gemini 2.5 Flash
- [x] Aprendizado de estilo do usuário
- [x] Memória de conversação
- [x] Agrupamento de mensagens (debounce 30s, 15s para contatos especiais)
- [x] Comandos (!authorize, !deauthorize, !status, !relearn)
- [x] Remoção de emojis das respostas
- [x] Sistema de contatos especiais com respostas personalizadas
- [x] Sistema de Reply (cita mensagem original automaticamente)

---

## 🎯 Prioridade ALTA (Fazer Agora)

### 1. ✨ Sistema de Reply (Citar Mensagem Original)
**Status:** ✅ CONCLUÍDO  
**Descrição:** Quando o bot responder, faz reply da mensagem original do usuário  
**Implementação:**
- Mensagem original armazenada no buffer de agrupamento
- Última mensagem do buffer usada para reply
- Função sendMessage aceita parâmetro `quoted`
- Reply automático em todas as respostas
- Logs específicos indicam quando faz reply
**Arquivos:** `src/whatsapp/client.js`, `src/whatsapp/messageHandler.js`

### 2. 🎤 Transcrição de Áudio (Speech-to-Text)
**Status:** 🔴 Pendente  
**Descrição:** Transcrever mensagens de áudio para texto antes de processar  
**Opções de API:**
- Google Speech-to-Text
- Whisper API (OpenAI)
- AssemblyAI
**Estimativa:** 2-3 horas  
**Arquivos:** `src/audio/transcription.js`, `src/whatsapp/messageHandler.js`

### 3. 🚫 Remover Emojis das Respostas
**Status:** ✅ CONCLUÍDO  
**Descrição:** O bot não deve usar emojis nas respostas (parecer mais humano)  
**Solução:** Configurado no prompt do Gemini + filtro regex robusto na resposta  
**Implementação:**
- Adicionado instrução explícita no prompt: "NUNCA use emojis"
- Filtro de regex que remove todos os emojis Unicode
- Remove emoticons, símbolos, bandeiras, etc.
**Arquivos:** `src/ai/promptBuilder.js`, `src/ai/gemini.js`

### 4. 🎭 Melhorar Naturalidade (Parecer Menos IA)
**Status:** 🔴 Pendente  
**Descrição:** Bot precisa parecer mais com o Henrique e menos com IA  
**Melhorias:**
- Usar gírias e abreviações mais
- Erros de digitação ocasionais
- Respostas mais curtas e diretas
- Delay variável antes de responder (1-5 segundos)
- Nunca usar formatação de lista/bullets
- Evitar respostas muito estruturadas
- Usar mais "né", "po", "mano", "cara"
**Estimativa:** 1-2 horas  
**Arquivos:** `src/ai/promptBuilder.js`, `src/whatsapp/messageHandler.js`

---

## 🔥 Prioridade MÉDIA (Próximas Implementações)

### 5. 📊 Sistema de Contexto de Grupo
**Status:** 🔴 Pendente  
**Descrição:** Em grupos, considerar últimas 10 mensagens de TODOS os membros  
**Motivo:** Entender melhor o contexto da conversa  
**Estimativa:** 1 hora

### 6. 🖼️ Análise de Imagens (Multimodal)
**Status:** 🔴 Pendente  
**Descrição:** Usar Gemini Vision para analisar imagens enviadas  
**Estimativa:** 2 horas

### 7. ⏰ Horários de Funcionamento
**Status:** 🔴 Pendente  
**Descrição:** Configurar horários em que o bot deve/não deve responder  
**Exemplo:** Não responder entre 00h-07h  
**Estimativa:** 30 minutos

### 8. 🎲 Variação de Respostas
**Status:** 🔴 Pendente  
**Descrição:** Para mesma pergunta, gerar respostas diferentes  
**Solução:** Aumentar temperature do Gemini dinamicamente  
**Estimativa:** 20 minutos

### 9. 📝 Comando !forget
**Status:** 🔴 Pendente  
**Descrição:** Esquecer histórico de conversação de um chat específico  
**Estimativa:** 30 minutos

### 10. 🔕 Modo Silencioso por Chat
**Status:** 🔴 Pendente  
**Descrição:** Comando !mute [tempo] para pausar respostas temporariamente  
**Exemplo:** `!mute 2h` - para por 2 horas  
**Estimativa:** 45 minutos

---

## 💡 Prioridade BAIXA (Ideias Futuras)

### 11. 📍 Filtro por Palavras-Chave
**Status:** 🔴 Pendente  
**Descrição:** Só responder quando mencionar palavras específicas  
**Exemplo:** Só responder quando falarem "Henrique"

### 12. 🤖 Detecção de Spam
**Status:** 🔴 Pendente  
**Descrição:** Ignorar mensagens de spam/links suspeitos

### 13. 📈 Dashboard Web
**Status:** 🔴 Pendente  
**Descrição:** Interface web para ver estatísticas e configurar o bot

### 14. 🔄 Sincronização Multi-Dispositivo
**Status:** 🔴 Pendente  
**Descrição:** Suportar múltiplas sessões do WhatsApp

### 15. 💾 Backup Automático
**Status:** 🔴 Pendente  
**Descrição:** Backup automático do banco de dados e configurações

### 16. 🎯 Respostas Personalizadas por Contato
**Status:** 🔴 Pendente  
**Descrição:** Tom diferente para amigos, família, trabalho

### 17. 📱 Notificações Desktop
**Status:** 🔴 Pendente  
**Descrição:** Notificar no desktop quando receber mensagens importantes

### 18. 🌐 Modo Multi-Idioma
**Status:** 🔴 Pendente  
**Descrição:** Detectar e responder em inglês/espanhol automaticamente

---

## 🛠️ Melhorias Técnicas

### 19. 🧪 Testes Automatizados
**Status:** 🔴 Pendente  
**Descrição:** Criar suite de testes com Jest

### 20. 📚 Documentação
**Status:** 🔴 Pendente  
**Descrição:** Documentar todas as funções e comandos

### 21. 🐳 Docker Support
**Status:** 🔴 Pendente  
**Descrição:** Criar Dockerfile para deploy fácil

### 22. 🔐 Criptografia de Dados Sensíveis
**Status:** 🔴 Pendente  
**Descrição:** Criptografar API keys e dados no banco

### 23. 📊 Logging Melhorado
**Status:** 🔴 Pendente  
**Descrição:** Sistema de logs com níveis e rotação

### 24. ⚡ Rate Limiting Inteligente
**Status:** 🔴 Pendente  
**Descrição:** Ajustar dinamicamente baseado na API do Gemini

---

## 🎨 Funcionalidades Avançadas (Sugestões)

### 25. 🎮 Reações Automáticas
**Status:** 🔴 Pendente  
**Descrição:** Reagir com emojis em mensagens (sem texto)  
**Exemplo:** React com 👍 quando alguém agradecer

### 26. 🎯 Detecção de Perguntas Diretas
**Status:** 🔴 Pendente  
**Descrição:** Priorizar responder quando perguntarem diretamente  
**Exemplo:** "Henrique, o que você acha?"

### 27. 🔊 Envio de Áudio
**Status:** 🔴 Pendente  
**Descrição:** Bot pode enviar áudios (TTS) ao invés de texto  
**Motivo:** Mais natural em algumas situações

### 28. 📸 Envio de Figurinhas
**Status:** 🔴 Pendente  
**Descrição:** Bot pode criar/enviar figurinhas contextuais

### 29. 🎲 Modo "Aleatório"
**Status:** 🔴 Pendente  
**Descrição:** Às vezes responder de forma inesperada/engraçada

### 30. 🤝 Integração com Calendário
**Status:** 🔴 Pendente  
**Descrição:** Lembrar de compromissos e avisar no WhatsApp

---

## 📌 Ordem de Implementação Sugerida

1. **Remover Emojis** (15 min) - Rápido e impacta muito
2. **Sistema de Reply** (30 min) - Essencial para grupos
3. **Melhorar Naturalidade** (1-2h) - Foco principal
4. **Transcrição de Áudio** (2-3h) - Expande funcionalidade
5. **Sistema de Contexto de Grupo** (1h) - Melhora grupos
6. **Análise de Imagens** (2h) - Funcionalidade WOW
7. **Outras funcionalidades conforme prioridade**

---

## 📝 Notas

- Priorizar funcionalidades que fazem o bot parecer mais humano
- Manter código limpo e documentado
- Sempre testar antes de fazer commit
- Focar na experiência do usuário

---

**Última atualização:** 28 de Outubro de 2025  
**Próxima revisão:** Após cada feature implementada
