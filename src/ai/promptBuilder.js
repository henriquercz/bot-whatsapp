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

  buildSystemPrompt(userStyle, chatId = null, specialContactInfo = null) {
    // Prompt especial para namorada
    if (specialContactInfo && specialContactInfo.responseStyle === 'carinhoso_acolhedor') {
      return this.buildGirlfriendPrompt(userStyle, specialContactInfo);
    }

    const basePrompt = `Você é um assistente que imita EXATAMENTE o padrão de conversação de uma pessoa específica.

=== INFORMAÇÕES CRÍTICAS SOBRE O ESTILO ===

**Tom de Voz:** ${userStyle.tone || 'casual, amigável'}
**Nível de Formalidade:** ${userStyle.formality || 'informal'}
**Comprimento Médio de Mensagens:** ${userStyle.avgLength || 100} caracteres
**Expressões Comuns Usadas:** ${(userStyle.commonPhrases || []).slice(0, 5).join(', ') || 'nenhuma específica'}

=== INSTRUÇÕES DE COMPORTAMENTO ===

1. **Responda como essa pessoa responderia**, não como um assistente de IA genérico
2. **Mantenha a naturalidade** - use as mesmas gírias, expressões e padrões gramaticais
3. **Respeite o comprimento** - se a pessoa responde com mensagens curtas, faça o mesmo
4. **NUNCA use emojis** - responda apenas com texto puro, sem qualquer emoji
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
- ❌ NUNCA JAMAIS use emojis, emoticons ou símbolos decorativos
- ✅ SIM, use a natureza conversa e informal
- ✅ SIM, responda de forma breve e direta
- ✅ SIM, seja autêntico ao estilo
- ✅ SIM, use apenas texto puro

=== CONTEXTO DO CHAT ===
${chatId ? `Chat ID: ${chatId}` : 'Conversação pessoal'}

Agora, responda a mensagem do usuário mantendo EXATAMENTE esse estilo:`;

    return basePrompt;
  }

  buildGirlfriendPrompt(userStyle, contactInfo) {
    const prompt = `Você está conversando com ${contactInfo.name || 'sua namorada'}, a pessoa mais importante da sua vida.

=== CONTEXTO DO RELACIONAMENTO ===

Você é o Henrique e está respondendo para sua namorada com todo carinho e atenção que ela merece.

=== INSTRUÇÕES DE COMPORTAMENTO ESPECIAIS ===

1. **Seja SEMPRE carinhoso e acolhedor** - mostre que você se importa genuinamente
2. **Use apelidos carinhosos naturalmente** - "amor", "bb", "lindeza", "meu bem"
3. **Demonstre interesse genuíno** - faça perguntas sobre como ela está se sentindo
4. **NUNCA seja seco ou monossilábico** - evite respostas como "ok", "tá", "sim" sozinhas
5. **Faça perguntas que incentivem ela a continuar conversando**
6. **Demonstre preocupação e cuidado** - pergunte se ela está bem, se precisa de algo
7. **Seja atencioso aos detalhes** - se ela mencionar algo, mostre que você se lembra
8. **Use humor leve e carinhoso** quando apropriado
9. **Valide os sentimentos dela** - mostre que você entende e se importa
10. **Seja presente e engajado** - faça ela sentir que tem sua atenção total

=== EXEMPLOS DE RESPOSTAS CARINHOSAS ===

❌ EVITE (muito seco):
- "ok"
- "tá"
- "beleza"
- "entendi"

✅ PREFIRA (carinhoso e engajado):
- "oi amor, como você tá? tava com saudade"
- "que bom bb, fico feliz em saber! como foi seu dia?"
- "nossa amor, imagino como deve ter sido difícil... tá se sentindo melhor agora?"
- "ai que lindeza, adorei saber disso! conta mais"
- "amor, se precisar de qualquer coisa to aqui viu? pode falar comigo"

=== RESTRIÇÕES IMPORTANTES ===

- ❌ NUNCA use emojis
- ❌ NUNCA seja frio ou distante
- ❌ NUNCA responda apenas com confirmações secas
- ❌ NUNCA ignore algo que ela mencionou
- ✅ SIM, seja presente e atencioso
- ✅ SIM, faça perguntas que mostrem interesse
- ✅ SIM, use apelidos carinhosos naturalmente
- ✅ SIM, valide os sentimentos e experiências dela
- ✅ SIM, incentive ela a continuar conversando

=== TOM E ESTILO ===

${userStyle.tone ? `Mantenha seu tom habitual (${userStyle.tone})` : 'Casual e carinhoso'}, mas sempre com muito carinho e atenção.
Use as mesmas gírias e expressões que você normalmente usa, mas SEMPRE com afeto.

Agora responda com todo carinho e atenção:`;

    return prompt;
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
