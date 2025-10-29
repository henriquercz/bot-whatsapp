# 🔥 CONFIGURAÇÃO DE FIREWALL - ORACLE CLOUD VM

## ⚠️ PROBLEMA COMUM:
Bot funciona localmente mas não na VM Oracle Cloud → Firewall bloqueando WebSocket do WhatsApp

---

## 🛡️ PASSO 1: LIBERAR FIREWALL DA ORACLE CLOUD (PAINEL WEB)

### 1.1 Acessar Security List
1. Acesse o painel da Oracle Cloud
2. Navegue até: **Networking** → **Virtual Cloud Networks (VCN)**
3. Clique na sua VCN
4. Clique em **Security Lists**
5. Clique na Security List padrão (geralmente `Default Security List`)

### 1.2 Adicionar Regra de Ingress
1. Clique em **Add Ingress Rules**
2. Configure:
   - **Source Type:** CIDR
   - **Source CIDR:** `0.0.0.0/0` (permite todo tráfego)
   - **IP Protocol:** TCP
   - **Source Port Range:** deixe em branco
   - **Destination Port Range:** `All` ou `1-65535`
   - **Description:** `Allow WhatsApp WebSocket`
3. Clique em **Add Ingress Rules**

**⚠️ IMPORTANTE:** Isso libera TODAS as portas. Para produção, considere liberar apenas portas específicas.

---

## 🔧 PASSO 2: LIBERAR FIREWALL DO UBUNTU (iptables)

Execute na VM via SSH:

```bash
# Liberar TODO o tráfego de entrada (temporário para teste)
sudo iptables -I INPUT -j ACCEPT

# Instalar ferramenta para salvar regras permanentemente
sudo apt-get update
sudo apt-get install iptables-persistent -y

# Quando perguntar, selecione YES para salvar as regras atuais

# Salvar regras manualmente
sudo netfilter-persistent save

# Verificar regras ativas
sudo iptables -L -n
```

### Alternativa: UFW (Firewall mais simples)

```bash
# Desabilitar UFW temporariamente para teste
sudo ufw disable

# Verificar status
sudo ufw status

# Se funcionar, você pode reabilitar e liberar portas específicas:
# sudo ufw allow 22/tcp    # SSH
# sudo ufw allow 443/tcp   # HTTPS
# sudo ufw enable
```

---

## 🧪 PASSO 3: TESTAR APÓS CONFIGURAR FIREWALL

```bash
cd ~/bot-whatsapp
git pull
npm install
rm -rf data/auth/*
npm start
```

**Escaneie o QR Code e teste enviando mensagens!**

---

## 🔍 PASSO 4: VERIFICAR SE FIREWALL ESTÁ LIBERADO

```bash
# Ver regras do iptables
sudo iptables -L -n -v

# Ver status do UFW
sudo ufw status verbose

# Testar conectividade externa (ping)
ping -c 3 google.com

# Verificar portas abertas
sudo netstat -tulpn | grep LISTEN
```

---

## 🚨 TROUBLESHOOTING

### Se ainda não funcionar:

1. **Reiniciar a VM:**
   ```bash
   sudo reboot
   ```

2. **Verificar logs de firewall:**
   ```bash
   sudo tail -f /var/log/syslog | grep -i firewall
   ```

3. **Testar conexão direta (sem bot):**
   ```bash
   node test-events.js
   ```

4. **Verificar se há processos bloqueando:**
   ```bash
   ps aux | grep node
   sudo lsof -i -P -n | grep LISTEN
   ```

---

## 📋 CHECKLIST COMPLETO

- [ ] Security List da Oracle Cloud configurada
- [ ] Regra de Ingress adicionada permitindo tráfego
- [ ] iptables configurado e salvo
- [ ] UFW desabilitado ou configurado corretamente
- [ ] VM reiniciada após mudanças
- [ ] Código atualizado com configurações de Cloud
- [ ] Credenciais antigas deletadas
- [ ] Bot testado após configuração

---

## ✅ RESULTADO ESPERADO

Após seguir todos os passos:
1. Bot conecta sem erro 515
2. Mensagens aparecem nos logs
3. Bot responde normalmente
4. Conexão permanece estável

**Se funcionar, não esqueça de ajustar as regras de firewall para serem mais restritivas em produção!**
