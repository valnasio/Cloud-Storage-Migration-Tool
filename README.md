# Cloud Migrator

[Leia em Português (PT-BR)](#português-pt-br) | [Read in English (EN-US)](#english-en-us)

---

## Português (PT-BR)

Um utilitário de linha de comando seguro e de alta performance desenhado para migrar dados de forma massiva entre provedores de armazenamento em nuvem (Object Storage).

*Nota técnica: Este projeto é construído em ambiente Node.js utilizando TypeScript, fazendo o uso das SDKs oficiais em fluxos de leitura e escrita (streams). Isso impede o vazamento de memória em grandes arquivos e garante que os dados fluam da origem ao destino com máxima integridade.*

### Estrutura do Projeto

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

### Tecnologias e Bibliotecas

A estabilidade e segurança da aplicação residem na sua stack de componentes:

- **TypeScript / Node.js**: Proporcionam controle rigoroso contra quebras inesperadas no código e facilidade de sustentação.
- **Inquirer.js / Ora / Chalk / CLI-Progress**: Módulo de front-end responsável pela ótima experiência visual e de acompanhamento contínuo da jornada via barras de progresso.
- **Pacotes Nativos (AWS, Google, Azure)**: As SDKs originais dos fabricantes fornecem comunicação criptografada TLS e eficiência garantida.
- **Pkg**: Utilitário transformador (compilador) que empacota o código-fonte num executável binário. Ele abstrai dependências do sistema operacional.

### Análise de Risco Operacional

Como o Cloud Migrator lidará com o cerne de seus dados, desenhamos salvaguardas essenciais de operação:

1. **Modo Dry Run (Modo Simulação):** Se ativado pelo usuário, o software lista as ações a tomar porém cancela o gatilho da execução. *Nota técnica: Trata-se de uma validação das chamadas de API do provedor (Read/List), mitigando potenciais erros catastróficos em credenciais antes de afetar pacotes de rede e horas de transferências.*
2. **Segurança de Memória Interna:** O processamento interno passa diretamente via memória. Os arquivos não são salvos fisicamente no seu computador para depois serem enviados; minimizamos assim riscos de roubo local ou disco lotado (No Disk Caching).
3. **Validação de Sobreposição (Skip Existing):** Validação técnica em *Metadata/Headers* via protocolo HTTP (`HEAD Object`). Garante economia extrema de tempo e rede ao ignorar e não sobrescrever arquivos idênticos já migrados.

### Credenciais Necessárias (Como Obter)

Antes de iniciar a migração, você precisará coletar alguns dados de acesso diretamente no painel administrativo de cada provedor. Abaixo está o caminho rápido:

- **AWS S3 e Compatíveis (R2, MinIO, DigitalOcean, etc):**
  Você precisará do **Nome do Bucket**, **Access Key ID** e **Secret Access Key**. Na AWS, você gera essas chaves no painel IAM. Em plataformas como Cloudflare R2 ou DigitalOcean, gere-as na tela de API/Tokens. Caso não seja a AWS, você também precisará da URL de **Endpoint S3** fornecida pelo seu provedor.
  
- **Google Cloud Storage (GCS):**
  Tenha em mãos o **Nome do Bucket**, o **Project ID** e o seu **Arquivo JSON de Credenciais**. Crie uma *Service Account* com permissão de Storage Admin no console do Google Cloud (IAM & Admin) e exporte a chave em formato JSON.

- **Azure Blob Storage:**
  Você precisará do nome do **Container (Bucket)** e do **Storage Account Name**. Como senha, você pode usar uma **Account Key**, um **SAS Token** ou uma **Connection String**, todos localizados na aba *Security + networking > Access keys* do seu portal Azure.

- **Oracle Cloud (OCI):**
  A OCI possui o sistema mais estrito. Além do **Bucket**, você precisará do **Namespace** (presente nos detalhes do seu bucket) e das suas credenciais de usuário: **Tenancy OCID**, **User OCID**, **Região**, **Fingerprint** e a sua **Chave Privada PEM**. Você os gera no console da Oracle, indo no seu Perfil de Usuário > *API Keys*.

### Como Baixar e Usar (Release v1.0.0)

A aplicação foi feita para rodar sozinha. Você **não** precisa ser desenvolvedor para utilizá-la; basta baixar e iniciar no terminal.

#### Links de Download da Versão Atual

- [Baixar versão para Linux](https://github.com/valnasio/cloud-migrator/releases/download/v1.0.0/cloud-migrator-linux)
- [Baixar versão para Windows](https://github.com/valnasio/cloud-migrator/releases/download/v1.0.0/cloud-migrator-win.exe)

*(Nota: Caso ainda não exista uma área de releases vinculada a este repositório do Github, você poderá gerar os pacotes utilizando as instruções contidas na sessão a seguir)*

#### Como Executar

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

### Instruções para Desenvolvedores (Build)

Se você precisa modificar regras de segurança, realizar validações no sistema e gerar uma release em sua infraestrutura fechada:

1. Baixe o repositório e na pasta principal, instale as bibliotecas usando: `npm install`
2. Para executar em tempo real no terminal sem a necessidade de build: `npm run dev`
3. Para emitir e empacotar arquivos finais (Release): Execute `./build.sh` (ou via pacote usando `npm run package`). Isto processará todo o código TypeScript até gerar os binários compatíveis na pasta principal do projeto.

### Possíveis Melhorias Futuras

O sistema é construído como uma fundação modular. Algumas integrações benéficas mapeadas:

- **Suporte Expandido a Protocolos:** Implementação nativa de IBM Cloud, Alibaba Cloud, e protocolos base como FTP, SFTP ou SCP.
- **Sistema de Relatórios Locais:** Geração mandatória de um CSV/JSON físico após cada ciclo da automação na pasta do usuário para logs permanentes e análises de auditoria (Tracking Compliance).
- **Mecanismos de Sincronia Inteligentes (Sync):** Identificar não somente o tamanho, mas o ETag (Hashes de versão) e Modified-Time para refletir deleções e substituições, equiparando ao modelo de arquitetura *Active-Standby* ou *Fail-Over*.
- **Pausa Automática (Resumable Mode):** Persistir um arquivo do estado atual da máquina localmente em formato criptografado, para permitir interrupções físicas de força e posterior retomada da fila de onde parou.

---

## English (EN-US)

A secure, high-performance command-line utility designed to massively migrate data between cloud storage providers (Object Storage).

*Technical note: This project is built in a Node.js environment using TypeScript, leveraging official SDKs in read and write flows (streams). This prevents memory leaks on large files and ensures that data flows from origin to destination with maximum integrity.*

### Project Structure

The source code follows separation of concerns principles. Below is the purpose of each system segment for easy technical and functional understanding:

- `src/index.ts`: System entry point. Responsible for initiating the journey, receiving parameters, and orchestrating the transfer engine rules.
- `src/cli/`: Visual interface and terminal interaction.
  - `menu.ts`: Main system menu.
  - `prompts.ts`: Interactive screens responsible for collecting account credentials (ensuring visual masking in the console for security).
  - `display.ts`: Informational panels, ASCII logo, and post-execution numerical summaries.
- `src/migrator/`: Processing and logic core.
  - `engine.ts`: The main data migration engine. It maps the entire remote folder architecture and implements stabilized concurrent work queues (uploading multiple items in parallel).
- `src/providers/`: Adapter layer (direct communication with clouds).
  - `types.ts`: Interface contracts that dictate the stability and standardization of calls between different platforms.
  - `s3-compatible.ts`: Connections for AWS S3 and several equivalent market options (Cloudflare R2, MinIO, DigitalOcean, etc.).
  - `gcs.ts`: Specific communication for Google Cloud Storage.
  - `azure.ts`: Specific communication for Azure Blob Storage.
  - `oracle.ts`: Highly secure connections for Oracle Cloud (OCI), implementing the mandatory encrypted Oracle signature (OCI Signing).
- `src/utils/logger.ts`: Centralizes the display of notifications during the process, improving traceability and visual differentiation of alert priorities.
- `build.sh`: Automation that consolidates this entire project into small final executable files, ensuring immutable versions reach client machines.

### Technologies and Libraries

The application's stability and security reside in its component stack:

- **TypeScript / Node.js**: Provide strict control against unexpected code breaks and ease of maintenance.
- **Inquirer.js / Ora / Chalk / CLI-Progress**: Front-end module responsible for the great visual experience and continuous journey tracking via progress bars.
- **Native Packages (AWS, Google, Azure)**: The official manufacturer SDKs provide TLS encrypted communication and guaranteed efficiency.
- **Pkg**: Transformer utility (compiler) that packages the source code into a binary executable. It abstracts operating system dependencies.

### Operational Risk Analysis

Because Cloud Migrator will handle the core of your data, we have designed essential operational safeguards:

1. **Dry Run Mode (Simulation Mode):** If enabled by the user, the software lists the actions to take but cancels the execution trigger. *Technical note: This is a validation of the provider's API calls (Read/List), mitigating potential catastrophic credential errors before affecting network packets and hours of transfers.*
2. **Internal Memory Security:** Internal processing passes directly through memory. Files are not physically saved on your computer before being sent; thus, we minimize local theft risks or full disks (No Disk Caching).
3. **Overwrite Validation (Skip Existing):** Technical validation on *Metadata/Headers* via HTTP protocol (`HEAD Object`). It guarantees extreme time and network savings by ignoring and not overwriting identical already-migrated files.

### Required Credentials (How to Get Them)

Before starting the migration, you will need to gather some access data directly from each provider's administrative panel. Here is the quick path:

- **AWS S3 and Compatibles (R2, MinIO, DigitalOcean, etc):**
  You will need the **Bucket Name**, **Access Key ID**, and **Secret Access Key**. On AWS, generate these keys in the IAM panel. On platforms like Cloudflare R2 or DigitalOcean, generate them on the API/Tokens screen. If it is not AWS, you will also need the provided **S3 Endpoint** URL.
  
- **Google Cloud Storage (GCS):**
  Have your **Bucket Name**, **Project ID**, and your **JSON Credentials File** ready. Create a *Service Account* with Storage Admin permissions in the Google Cloud console (IAM & Admin) and export the key in JSON format.

- **Azure Blob Storage:**
  You will need the **Container (Bucket)** name and the **Storage Account Name**. For the password, you can use an **Account Key**, a **SAS Token**, or a **Connection String**, all located in the *Security + networking > Access keys* tab of your Azure portal.

- **Oracle Cloud (OCI):**
  OCI has the strictest system. Besides the **Bucket**, you will need the **Namespace** (found in your bucket details) and your user credentials: **Tenancy OCID**, **User OCID**, **Region**, **Fingerprint**, and your **Private Key PEM**. You generate these in the Oracle console by going to your User Profile > *API Keys*.

### How to Download and Use (Release v1.0.0)

The application was built to run standalone. You do **not** need to be a developer to use it; simply download and start it in the terminal.

#### Current Version Download Links

- [Download version for Linux](https://github.com/valnasio/cloud-migrator/releases/download/v1.0.0/cloud-migrator-linux)
- [Download version for Windows](https://github.com/valnasio/cloud-migrator/releases/download/v1.0.0/cloud-migrator-win.exe)

*(Note: If there is not yet a release area linked to this Github repository, you can generate the packages using the instructions in the following section)*

#### How to Execute

**On Windows:**
Open the `Command Prompt` or `PowerShell` inside the folder where the download was made:
```cmd
.\cloud-migrator-win.exe
```

**On Linux:**
Open your terminal in the file's folder, grant software execution permissions to Linux, and start it:
```bash
chmod +x cloud-migrator-linux
./cloud-migrator-linux
```

Upon opening, follow interactively:
1. **Step 1:** Select the *Origin* cloud, entering your passwords, local or API keys (typing passwords are automatically protected on screen).
2. **Step 2:** Enter the configurations for the *Destination* cloud.
3. **Step 3:** Adjust the Concurrency level (how many multiple uploads you want). *Technical note: Higher concurrencies use more local processor and network bandwidth; adjust to your provider's physical limit.*

### Instructions for Developers (Build)

If you need to modify security rules, perform system validations, and generate a release in your closed infrastructure:

1. Download the repository and in the main folder, install the libraries using: `npm install`
2. To run in real-time in the terminal without needing to build: `npm run dev`
3. To output and package final files (Release): Execute `./build.sh` (or via package using `npm run package`). This will process all TypeScript code until it generates compatible binaries in the main project folder.

### Possible Future Improvements

The system is built as a modular foundation. Some beneficial mapped integrations:

- **Expanded Protocol Support:** Native implementation of IBM Cloud, Alibaba Cloud, and core protocols like FTP, SFTP, or SCP.
- **Local Reporting System:** Mandatory generation of a physical CSV/JSON after each automation cycle in the user folder for permanent logs and audit analysis (Tracking Compliance).
- **Intelligent Synchronization Mechanisms (Sync):** Identifying not only the size, but the ETag (Version hashes) and Modified-Time to reflect deletions and replacements, equating to the *Active-Standby* or *Fail-Over* architecture model.
- **Automatic Pause (Resumable Mode):** Persist a file of the machine's current state locally in encrypted format, allowing physical power interruptions and later resumption of the queue from where it stopped.
