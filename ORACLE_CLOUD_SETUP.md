# 🚀 Guia Completo: Deploy do WhatsApp AI Bot na Oracle Cloud Free Tier

## 📋 RESUMO DO PROJETO

**Nome:** WhatsApp AI Bot (bot-whatsapp)
**Descrição:** Bot de WhatsApp com IA personalizada que aprende padrões de resposta usando Google Gemini 2.5 Flash. O bot imita o estilo de conversação do usuário, usa gírias brasileiras, responde em minúsculas, e possui modo especial para contatos específicos (ex: namorada).

**Tecnologias:**
- Node.js 20.x
- @whiskeysockets/baileys (WhatsApp Web API)
- Google Gemini 2.5 Flash API
- SQLite (banco de dados local)
- PM2 (gerenciador de processos)

**Funcionalidades:**
- Sistema de autorização de chats/grupos
- Aprendizado automático do estilo do usuário
- Memória de conversação persistente
- Agrupamento de mensagens (debounce 30s/15s)
- Reply automático (cita mensagem original)
- Respostas naturais com gírias brasileiras
- Modo especial carinhoso para namorada
- Sempre escreve em minúsculas (exceto CAPSLOCK para surpresa)
- Remoção automática de emojis

**Requisitos da VM:**
- Sistema: Ubuntu 22.04
- CPU: 1 OCPU (Always Free)
- RAM: 1 GB
- Disco: ~20GB (boot volume padrão)
- Rede: IP público + sub-rede pública
- SSH: Obrigatório para acesso

---

## 🎯 GUIA PASSO A PASSO: CRIAR VM NA ORACLE CLOUD

### PASSO 1: ACESSAR O CONSOLE DA ORACLE CLOUD

1. **Acesse:** https://cloud.oracle.com/
2. **Faça login** com suas credenciais
3. **Aguarde** carregar o Dashboard da Oracle Cloud Infrastructure (OCI)

---

### PASSO 2: NAVEGAR PARA COMPUTE INSTANCES

1. **Clique** no ícone de **menu hambúrguer** (☰) no canto superior esquerdo
2. **Navegue:** `Compute` → `Instances`
   - Caminho completo: Menu ☰ → Compute → Instances
3. **Aguarde** a página de instâncias carregar

---

### PASSO 3: SELECIONAR COMPARTIMENTO

1. **Localize** o seletor de compartimento no lado esquerdo da tela
2. **Selecione:** Compartimento raiz (`henriquercz (root)`)
   - Se já estiver selecionado, continue
3. **Clique** no botão **"Create Instance"** (azul, no topo da página)

---

### PASSO 4: CONFIGURAR INFORMAÇÕES BÁSICAS

#### 4.1 Nome e Compartimento
```
Campo: Name
Valor: whatsapp-bot

Campo: Create in compartment
Valor: henriquercz (root) [já deve estar selecionado]
```

#### 4.2 Posicionamento (Placement)
```
Campo: Availability domain
Valor: AD 1 (SA-SAOPAULO-1-AD-1) [ou qualquer AD disponível]

Nota: Mantenha a região Brazil East (São Paulo) que já está configurada
```

#### 4.3 Segurança (Security)
```
☑ Shielded instance: MANTER ATIVADO
☐ Secure boot: Deixar desativado (padrão)
☐ Measured boot: Deixar desativado (padrão)  
☐ Trusted platform module (TPM): Deixar desativado (padrão)
```

**AÇÃO:** Role a página para baixo para continuar

---

### PASSO 5: CONFIGURAR IMAGE E SHAPE

#### 5.1 Image and shape
Esta seção já deve estar visível. Se não, procure por "Image and shape" ou role a página.

#### 5.2 Selecionar Imagem (Image)
```
Botão: "Change Image"
1. Clique no botão "Change Image"
2. Na janela que abrir:
   - Selecione: "Canonical Ubuntu"
   - Versão: "Canonical Ubuntu 22.04"
   - Build: 2025.09.22-0 (ou mais recente disponível)
3. Clique em "Select Image"
```

#### 5.3 Selecionar Shape (Tamanho da VM)
```
Botão: "Change Shape"
1. Clique no botão "Change Shape"
2. Na janela que abrir:
   - Série: "VM.Standard.E2.1.Micro"
   - ⚠️ IMPORTANTE: Verifique se tem o selo "Always Free-eligible"
   
Especificações esperadas:
   - OCPUs: 1
   - Memory: 1 GB
   - Network bandwidth: 0.48 Gbps
   
3. Clique em "Select Shape"
```

**AÇÃO:** Role a página para baixo para continuar

---

### PASSO 6: CONFIGURAR REDE (NETWORKING)

Esta é a seção mais importante para o funcionamento do bot!

#### 6.1 Primary VNIC information

```
Campo: Primary network
Opção 1 (SE JÁ TEM VCN):
   - Selecione: "Select existing virtual cloud network"
   - Escolha sua VCN existente

Opção 2 (CRIAR NOVA - RECOMENDADO):
   - Selecione: "Create new virtual cloud network"
   - Name: whatsapp-vcn (será gerado automaticamente)
```

#### 6.2 Sub-rede (CRÍTICO)

```
Campo: Subnet
⚠️ IMPORTANTE: Selecione "Create new public subnet"

NÃO escolha private subnet!

Configuração esperada:
   - Nome: whatsapp-subnet (gerado automaticamente)
   - Tipo: PUBLIC SUBNET ✓
```

#### 6.3 Endereços IP

```
☑ Assign a public IPv4 address
   ⚠️ OBRIGATÓRIO: Esta caixa DEVE estar MARCADA!
   
   Por quê?
   - Você precisa acessar via SSH
   - Bot precisa se conectar ao WhatsApp
   - Sem IP público = sem acesso

Campo: Private IPv4 address
   ☑ Automatically assign private IPv4 address
   (deixar marcado - padrão)

Campo: IPv6 address
   ☐ Assign an IPv6 address
   (deixar DESMARCADO - não é necessário)
```

**AÇÃO:** Role a página para baixo para continuar

---

### PASSO 7: CONFIGURAR CHAVES SSH (CRÍTICO)

Esta seção é chamada "Add SSH keys"

#### 7.1 Selecionar método de SSH

```
⚠️ OBRIGATÓRIO: Você DEVE configurar SSH keys!

Escolha UMA das opções:

OPÇÃO RECOMENDADA:
◉ Generate a key pair for me

PASSOS:
1. Selecione "Generate a key pair for me"
2. ☑ Marque: "Save private key"
3. ☑ Marque: "Save public key" (opcional mas recomendado)
4. Clique em "Save Private Key" para baixar
5. Clique em "Save Public Key" para baixar (se marcou)

⚠️ CRÍTICO: Salve os arquivos baixados em local seguro!
   - Nome do arquivo privado: ssh-key-YYYY-MM-DD.key
   - Local sugerido: C:\Users\SeuUsuario\.ssh\
   - NUNCA compartilhe a chave privada!

OUTRAS OPÇÕES (se preferir):
○ Upload public key files (.pub)
   - Se você já tem uma chave SSH
   - Faça upload do arquivo .pub

○ Paste public keys
   - Cole o conteúdo da sua chave pública
```

**AÇÃO:** Role a página para baixo para continuar

---

### PASSO 8: CONFIGURAR BOOT VOLUME (ARMAZENAMENTO)

```
Seção: Boot volume
⚠️ RECOMENDAÇÃO: Mantenha todas as configurações padrão

Configuração padrão esperada:
   - Boot volume size: 47 GB (padrão Always Free)
   - Use in-transit encryption: ☑ (padrão)
   - Encryption: Oracle-managed keys (padrão)
```

**NÃO altere nada nesta seção!**

**AÇÃO:** Role a página para baixo para finalizar

---

### PASSO 9: OPÇÕES AVANÇADAS (OPCIONAL)

```
Seção: Advanced options

⚠️ PODE IGNORAR todas estas seções:
   - Management (Migração ao vivo já está ativada por padrão)
   - Oracle Cloud Agent (plugins já ativados por padrão)
   - Initialization script (não precisamos)
   - Tags (não necessário)
```

**AÇÃO:** Pule para o botão "Create" no final da página

---

### PASSO 10: REVISAR E CRIAR

#### 10.1 Checklist Final (IMPORTANTE!)

Antes de clicar em "Create", CONFIRME:

```
☑ Nome: whatsapp-bot
☑ Compartimento: henriquercz (root)
☑ Região: Brazil East (São Paulo)
☑ Image: Ubuntu 22.04
☑ Shape: VM.Standard.E2.1.Micro (Always Free)
☑ VCN: Criada ou selecionada
☑ Subnet: PUBLIC SUBNET ✓
☑ IP Público: ATIVADO ✓✓✓
☑ SSH Keys: Configurado e chaves SALVAS ✓
☑ Boot Volume: Padrão (47GB)
```

#### 10.2 Criar a Instância

```
Botão: "Create" (azul, no final da página)

1. Clique em "Create"
2. Aguarde o provisionamento (Status: PROVISIONING)
3. Aguarde status mudar para: RUNNING (1-3 minutos)
```

---

### PASSO 11: AGUARDAR PROVISIONAMENTO

#### 11.1 Status da Instância

```
Status inicial: PROVISIONING (laranja)
   ↓ (aguarde 1-3 minutos)
Status final: RUNNING (verde) ✓

⚠️ NÃO saia da página até ver status RUNNING!
```

#### 11.2 Informações Importantes

Quando o status for RUNNING, ANOTE:

```
1. Instance OCID: (começará com ocid1.instance...)
2. Public IP Address: XXX.XXX.XXX.XXX ⚠️ IMPORTANTE!
3. Private IP Address: 10.0.X.X
4. Username: ubuntu (padrão para Ubuntu)
```

**VOCÊ VAI PRECISAR DO IP PÚBLICO PARA CONECTAR VIA SSH!**

---

## ✅ CHECKLIST PÓS-CRIAÇÃO

```
☑ Instância criada com sucesso
☑ Status: RUNNING
☑ IP Público anotado
☑ Chave SSH privada salva em local seguro
☑ Username anotado: ubuntu
```

---

## 🔥 PRÓXIMOS PASSOS (APÓS VM CRIADA)

### 1. Configurar Security List (Firewall)
### 2. Conectar via SSH
### 3. Instalar Node.js 20.x e PM2
### 4. Clonar repositório do bot
### 5. Configurar variáveis de ambiente
### 6. Iniciar bot com PM2

*(Estes passos serão executados manualmente após a VM estar RUNNING)*

---

## 📝 COMANDOS PARA CONECTAR VIA SSH (Depois da VM criada)

### Windows (PowerShell):
```powershell
# Ajustar permissões da chave
icacls "C:\Users\SeuUsuario\.ssh\ssh-key-YYYY-MM-DD.key" /inheritance:r
icacls "C:\Users\SeuUsuario\.ssh\ssh-key-YYYY-MM-DD.key" /grant:r "%username%:R"

# Conectar
ssh -i "C:\Users\SeuUsuario\.ssh\ssh-key-YYYY-MM-DD.key" ubuntu@SEU_IP_PUBLICO
```

### Linux/Mac:
```bash
# Ajustar permissões
chmod 400 ~/caminho/para/ssh-key.key

# Conectar
ssh -i ~/caminho/para/ssh-key.key ubuntu@SEU_IP_PUBLICO
```

---

## 🎯 RESUMO DOS VALORES CRÍTICOS

| Campo | Valor Obrigatório |
|-------|-------------------|
| **Name** | whatsapp-bot |
| **Image** | Ubuntu 22.04 |
| **Shape** | VM.Standard.E2.1.Micro |
| **Subnet Type** | PUBLIC ⚠️ |
| **Public IP** | ENABLED ⚠️⚠️⚠️ |
| **SSH Keys** | CONFIGURED ⚠️ |

---

## ⚠️ ERROS COMUNS A EVITAR

1. ❌ **Subnet privada** → Bot não funciona, você não consegue acessar
2. ❌ **IP público desativado** → Sem acesso SSH, bot não conecta WhatsApp
3. ❌ **Sem SSH key** → Impossível acessar a VM
4. ❌ **Não salvar chave privada** → Perde acesso permanentemente à VM
5. ❌ **Shape errado** → Pode ser cobrado!

---

## 🆘 SUPORTE

Se encontrar erros durante a criação:
- Verifique se tem recursos Always Free disponíveis na sua tenancy
- Confirme que a região Brazil East (São Paulo) está selecionada
- Verifique se o shape VM.Standard.E2.1.Micro está disponível
- Tente outro Availability Domain se o primeiro falhar

---

**Última atualização:** 28/10/2024
**Autor:** Capitão Henrique
**Repositório:** https://github.com/henriquercz/bot-whatsapp
