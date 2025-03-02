FROM node:latest 

# Crea y cambia al directorio de trabajo 
WORKDIR /usr/src/app 

# Copia package.json y package-lock.json (si existe) 
COPY package*.json ./ 

# Instala las dependencias 
RUN npm install 

# Copia el resto de los archivos del proyecto 
COPY . . 

# Expon la aplicación en el puerto 3003 
EXPOSE 3004 

# Comando para ejecutar la aplicación 
CMD [ "node", "index.js" , "nodemon"] 