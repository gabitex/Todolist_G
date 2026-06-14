## TodoList y Drive 
Por:Gabriela Ticona Lima 2026
Aplicación web con autenticación JWT, lista de tareas y drive personal por usuario.

## Tecnologías
- Frontend: React + Vite
- Backend: Node.js + Express
- Base de datos: MongoDB Atlas
- Seguridad: JWT, HTTPS, SHA-256

## Requisitos previos para Instalar
- Node.js v18 o superior
- npm
- Cuenta en MongoDB Atlas(en caso que no funcione copiar archivo.env)
- Git
- visual studio code

## Inicio ##
## 1. Clonar el repositorio
```bash
git clone https://github.com/gabitex/Todolist_G.git
cd Todolist_G
```
## 2. Configurar el Backend

2.1.-Entrar a la carpeta del backend:
```bash o abrir en visual
cd todolist_g

2.2.-Instalar dependencias:
```bash o en visual
npm install

2.3.-Es variable de entorno y se crea manualmente -Crear el archivo `.env` en la carpeta `todolist_g/` con el siguiente contenido:
```
MONGO_URI=mongodb://gabrielaticonalima1_db_user:Ri5Cyyxu1jMxdOYL@ac-br8zmhr-shard-00-00.hlinkaq.mongodb.net:27017,ac-br8zmhr-shard-00-01.hlinkaq.mongodb.net:27017,ac-br8zmhr-shard-00-02.hlinkaq.mongodb.net:27017/?ssl=true&replicaSet=atlas-e8019j-shard-0&authSource=admin&appName=TodoListCluster
PORT=300


## 3. Generar certificados HTTPS (solo primera vez)

3.1.-Descargar `mkcert` para Windows desde:
```
https://github.com/FiloSottile/mkcert/releases
```
3.2.-Renombrar el archivo descargado a `mkcert.exe` y colocarlo en la raíz del proyecto (Todolist_G/).

3.3.-Ejecutar en PowerShell desde la raíz del proyecto:
```powershell
.\mkcert.exe -install
.\mkcert.exe -key-file key.pem -cert-file cert.pem localhost
```
3.4.-Mover los certificados al backend:
```powershell
move key.pem todolist_g\key.pem
move cert.pem todolist_g\cert.pem
```
## 4. Cargar datos de prueba
```bash
cd todolist_g
node seed.js
```
Esto crea los siguientes usuarios de prueba:

| Correo | Contraseña |
|--------|------------|
| admin@test.com | 1234 |
| wendy@test.com | 1234 |
| armando@test.com | 1234 |

## 5. Iniciar el Backend
1.-```bash o en la consola de visual
cd todolist_g
npm start

-debera salir el siguiente mensaje en la consola de visual:
Servidor HTTPS listo en puerto 3000
MongoDB conectado

### 6. Configurar el Frontend

Abrir otra terminal u otra ventana de visual y entrar a la carpeta del frontend:
```bash o visual
cd frontend_g
```
Instalar dependencias:
```bash o por visual
npm install
```

## 7. Iniciar el Frontend
```bash o consola de visual en la carpeta del frontend
npm run dev
```
debe mostrar este mensaje :
El frontend estará disponible en: `https://localhost:5173`

## Uso
1. Abrir el navegador en `https://localhost:5173`
2. Si aparece advertencia de seguridad, hacer clic en **Avanzado → Continuar a localhost**
3. Registrarse con un correo y contraseña o usar los usuarios de prueba o crear nuevos
4. Completar la verificación de 2 pasos con el PIN que aparece en pantalla

## Estructura del proyecto
```
Todolist_G/
├── frontend_g/          # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── TodoList.jsx
│   │   │   └── Drive.jsx
│   │   ├── App.jsx
│   │   └── App.css
│   └── vite.config.js
│
└── todolist_g/          # Node.js + Express
    ├── configBD/        # Conexión MongoDB
    ├── modelo_datos/    # Modelos Mongoose
    ├── uploads/         # Archivos del Drive (no se sube al repo)
    ├── main.js          # Servidor principal
    ├── seed.js          # Carga de datos de prueba
    ├── key.pem          # Certificado HTTPS (no se sube al repo)
    └── cert.pem         # Certificado HTTPS (no se sube al repo)
```

## importante--
- Los archivos `.env`, `key.pem`, `cert.pem` y la carpeta `uploads/` están en `.gitignore` y no se suben al repositorio
- Los certificados HTTPS deben generarse localmente en cada máquina donde se despliegue
- La carpeta `uploads/` se crea automáticamente al subir el primer archivo
