import logger from '../utils/logger.js';
import fs from 'fs';
import yaml from 'js-yaml';

export class PromptBuilder {
  constructor(promptsPath = './config/prompts.yaml') {
    this.promptTemplates = this.loadTemplates(promptsPath);
  }

  loadTemplates(path) {
    try {
      if (fs.existsSync(path)) {
        const content = fs.readFileSync(path, 'utf8');
        return yaml.load(content);
      }
    } catch (error) {
      logger.warn(`⚠️ Arquivo de prompts não encontrado em ${path}, usando padrão`);
    }
    return this.getDefaultTemplates();
  }

  buildSystemPrompt(userStyle, chatId = null) {
    const basePrompt = `Você é um assistente que imita EXATAMENTE o padrão de conversação de uma pessoa específica.

=== INFORMAÇÕES CRÍTICAS SOBRE O ESTILO ===

**Tom de Voz:** ${userStyle.tone || 'casual, amigável'}
**Nível de Formalidade:** ${userStyle.formality || 'informal'}
**Comprimento Médio de Mensagens:** ${userStyle.avgLength || 100} caracteres
**Frequência de Emojis:** ${userStyle.emojiFrequency || 'moderada'} 
**Expressões Comuns Usadas:** ${(userStyle.commonPhrases || []).slice(0, 5).join(', ') || 'nenhuma específica'}

=== INSTRUÇÕES DE COMPORTAMENTO ===

1. **Responda como essa pessoa responderia**, não como um assistente de IA genérico
2. **Mantenha a naturalidade** - use as mesmas gírias, expressões e padrões gramaticais
3. **Respeite o comprimento** - se a pessoa responde com mensagens curtas, faça o mesmo
4. **Use emojis corretamente** - com a mesma frequência e contexto
5. **Adapte-se ao tema** - mude seu tom conforme necessário, mas mantendo a essência
6. **Seja conciso** - evite explicações longas ou formais desnecessárias

=== EXEMPLOS DE ESTILO (Few-Shot) ===

${this.buildFewShotExamples(userStyle)}

=== RESTRIÇÕES IMPORTANTES ===

- ❌ NÃO se identifique como IA ou assistente
- ❌ NÃO use markdown/formatação (WhatsApp não suporta bem)
- ❌ NÃO use asteriscos para destaque (**negrito**)
- ❌ NÃO faça discursos longos
- ❌ NÃO mude bruscamente de personalidade
- ✅ SIM, use a natureza conversa e informal
- ✅ SIM, responda de forma breve e direta
- ✅ SIM, use emojis apropriados
- ✅ SIM, seja autêntico ao estilo

=== CONTEXTO DO CHAT ===
${chatId ? `Chat ID: ${chatId}` : 'Conversação pessoal'}

Agora, responda a mensagem do usuário mantendo EXATAMENTE esse estilo:`;

    return basePrompt;
  }

  buildFewShotExamples(userStyle) {
    // Usar exemplos de mensagens do usuário se disponível
    if (userStyle.exampleMessages && userStyle.exampleMessages.length > 0) {
      return userStyle.exampleMessages
        .slice(0, 3)
        .map((msg, idx) => `Exemplo ${idx + 1}: "${msg}"`)
        .join('\n');
    }
    
    // Fallback baseado no tom
    const examples = {
      'casual': [
        'Opa, tudo certo?',
        'Blz, flw',
        'Ahahaha boa! 😂'
      ],
      'formal': [
        'Tudo bem? Tudo certo por aqui.',
        'Concordo com você, excelente ponto.',
        'Obrigado pela mensagem.'
      ],
      'entusiasmado': [
        'Que top demais! 🔥',
        'Amei isso cara!!!',
        'Muito legal mesmo 😎'
      ]
    };
    
    const selectedExamples = examples[userStyle.tone] || examples['casual'];
    return selectedExamples
      .map((msg, idx) => `Exemplo ${idx + 1}: "${msg}"`)
      .join('\n');
  }

  getDefaultTemplates() {
    return {
      system_instruction: 'Você é um assistente amigável',
      constraints: [
        'Respostas curtas (max 200 caracteres)',
        'Usar emojis apropriados',
        'Ser natural e conversacional'
      ]
    };
  }
}
