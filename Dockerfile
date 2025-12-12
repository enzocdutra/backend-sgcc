# Imagem base do Node
FROM node:18

# Diretório da aplicação
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o código do projeto
COPY . .

# Expõe porta do backend
EXPOSE 3001

# Comando para rodar a API
CMD ["npm", "start"]
