# Cloud Migrator

Um utilitário de linha de comando seguro e de alta performance desenhado para migrar dados de forma massiva entre provedores de armazenamento em nuvem (Object Storage).

*Nota técnica: Este projeto é construído em ambiente Node.js utilizando TypeScript, fazendo o uso das SDKs oficiais em fluxos de leitura e escrita (streams). Isso impede o vazamento de memória em grandes arquivos e garante que os dados fluam da origem ao destino com máxima integridade.*

---

## 🏗️ Estrutura do Projeto

O código-fonte segue princípios de isolamento de responsabilidades. Abaixo, o propósito de cada segmento do sistema para fácil compreensão técnica e funcional:

- `src/index.ts`: Ponto de entrada do sistema. Responsável por iniciar a jornada, receber os parâmetros e orquestrar as demais regras do motor de transferência.
- `src/cli/`: Interface visual e de interação no terminal.
  - `menu.ts`: Menu principal do sistema.
  - `prompts.ts`: Telas interativas responsáveis por coletar as credenciais das contas (garantindo o mascaramento visual no console por segurança).
  - `display.ts`: Painéis informativos, logotipo em ASCII e sumários numéricos pós-execução.
- `src/migrator/`: Núcleo de processamento e lógica.
  - `engine.ts`: O motor principal da migração de dados. Ele mapeia toda a arquitetura de pastas remotamente e implementa filas de trabalho concorrentes (upload de múltiplos itens em paralelo) de forma estabilizada.
- `src/providers/`: Camada de adaptadores (comunicação direta com as nuvens).
  - `types.ts`: Contratos de interface que ditam a estabilidade e a padronização das chamadas entre plataformas diferentes.
  - `s3-compatible.ts`: Conexões para a AWS S3 e diversas opções equivalentes do mercado (Cloudflare R2, MinIO, DigitalOcean, etc).
  - `gcs.ts`: Comunicação específica do Google Cloud Storage.
  - `azure.ts`: Comunicação específica do Azure Blob Storage.
  - `oracle.ts`: Conexões de extrema segurança para a Oracle Cloud (OCI), implementando a assinatura criptografada obrigatória da Oracle (OCI Signing).
- `src/utils/logger.ts`: Centraliza a exibição de notificações durante o processo, melhorando a rastreabilidade e diferenciação visual das prioridades de alerta.
- `build.sh`: Automação que consolida todo este projeto em pequenos arquivos finais executáveis, garantindo que versões imutáveis cheguem até as máquinas clientes.

---

## 🛠️ Tecnologias e Bibliotecas

A estabilidade e segurança da aplicação residem na sua stack de componentes:

- **TypeScript / Node.js**: Proporcionam controle rigoroso contra quebras inesperadas no código e facilidade de sustentação.
- **Inquirer.js / Ora / Chalk / CLI-Progress**: Módulo de front-end responsável pela ótima experiência visual e de acompanhamento contínuo da jornada via barras de progresso.
- **Pacotes Nativos (AWS, Google, Azure)**: As SDKs originais dos fabricantes fornecem comunicação criptografada TLS e eficiência garantida.
- **Pkg**: Utilitário transformador (compilador) que empacota o código-fonte num executável binário. Ele abstrai dependências do sistema operacional.

---

## 🛡️ Análise de Risco Operacional

Como o Cloud Migrator lidará com o cerne de seus dados, desenhamos salvaguardas essenciais de operação:

1. **Modo Dry Run (Modo Simulação):** Se ativado pelo usuário, o software lista as ações a tomar porém cancela o gatilho da execução. *Nota técnica: Trata-se de uma validação das chamadas de API do provedor (Read/List), mitigando potenciais erros catastróficos em credenciais antes de afetar pacotes de rede e horas de transferências.*
2. **Segurança de Memória Interna:** O processamento interno passa diretamente via memória. Os arquivos não são salvos fisicamente no seu computador para depois serem enviados; minimizamos assim riscos de roubo local ou disco lotado (No Disk Caching).
3. **Validação de Sobreposição (Skip Existing):** Validação técnica em *Metadata/Headers* via protocolo HTTP (`HEAD Object`). Garante economia extrema de tempo e rede ao ignorar e não sobrescrever arquivos idênticos já migrados.

---

## 🚀 Como Baixar e Usar (Release v1.0.0)

A aplicação foi feita para rodar sozinha. Você **não** precisa ser desenvolvedor para utilizá-la; basta baixar e iniciar no terminal.

### 📥 Links de Download da Versão Atual

- [Baixar versão para Linux](https://github.com/valnasio/cloud-migrator/releases/download/v1.0.0/cloud-migrator-linux)
- [Baixar versão para Windows](https://github.com/valnasio/cloud-migrator/releases/download/v1.0.0/cloud-migrator-win.exe)

*(Nota: Caso ainda não exista uma área de releases vinculada a este repositório do Github, você poderá gerar os pacotes utilizando as instruções contidas na sessão a seguir)*

### Como Executar

**No Windows:**
Abra o `Prompt de Comando` ou o `PowerShell` dentro da pasta em que foi feito o download:
```cmd
.\cloud-migrator-win.exe
```

**No Linux:**
Abra seu terminal na pasta do arquivo, conceda as permissões de software ao Linux e inicie:
```bash
chmod +x cloud-migrator-linux
./cloud-migrator-linux
```

Ao abrir, siga interativamente:
1. **Passo 1:** Selecione a nuvem de *Origem*, inserindo suas senhas, chaves locais ou de API (as senhas de digitação ficam protegidas na tela).
2. **Passo 2:** Insira as configurações para a nuvem de *Destino*.
3. **Passo 3:** Ajuste o nível de Concorrência (quantos envios múltiplos você deseja). *Nota técnica: Concorrências maiores utilizam mais processador local e largura de banda da rede; ajuste ao limite físico da sua operadora.*

---

## 💻 Instruções para Desenvolvedores (Build)

Se você precisa modificar regras de segurança, realizar validações no sistema e gerar uma release em sua infraestrutura fechada:

1. Baixe o repositório e na pasta principal, instale as bibliotecas usando: `npm install`
2. Para executar em tempo real no terminal sem a necessidade de build: `npm run dev`
3. Para emitir e empacotar arquivos finais (Release): Execute `./build.sh` (ou via pacote usando `npm run package`). Isto processará todo o código TypeScript até gerar os binários compatíveis na pasta principal do projeto.

---

## 🔮 Possíveis Melhorias Futuras

O sistema é construído como uma fundação modular. Algumas integrações benéficas mapeadas:

- **Suporte Expandido a Protocolos:** Implementação nativa de IBM Cloud, Alibaba Cloud, e protocolos base como FTP, SFTP ou SCP.
- **Sistema de Relatórios Locais:** Geração mandatória de um CSV/JSON físico após cada ciclo da automação na pasta do usuário para logs permanentes e análises de auditoria (Tracking Compliance).
- **Mecanismos de Sincronia Inteligentes (Sync):** Identificar não somente o tamanho, mas o ETag (Hashes de versão) e Modified-Time para refletir deleções e substituições, equiparando ao modelo de arquitetura *Active-Standby* ou *Fail-Over*.
- **Pausa Automática (Resumable Mode):** Persistir um arquivo do estado atual da máquina localmente em formato criptografado, para permitir interrupções físicas de força e posterior retomada da fila de onde parou.
