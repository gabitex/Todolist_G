const jwt = require('jsonwebtoken');
const SECRET_KEY = "MI_LLAVE"; //para firmar los tokens
const crypto = require('crypto'); //mod para encriptar
const express = require('express');
const connectDB = require('./configBD/apN_mongo');
const Tarea = require('./modelo_datos/Tarea');
const Usuario = require('./modelo_datos/Usuario');
const NodeCache = require('node-cache');
const cors = require('cors'); 
const multer = require('multer'); 
const path = require('path'); 
const fs = require('fs'); 
require('dotenv').config();

const app = express();
const cache = new NodeCache({ stdTTL: 60 });

app.use(cors()); 
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();

let codigo2FA_servidor = ""; //para guardar el pin aleatorio
const storage = multer.diskStorage({// Configuración de almacenamiento físico para Multer (Drive)
    destination: (req, file, cb) =>{
        const dir = './uploads';
        if (!fs.existsSync(dir)) { fs.mkdirSync(dir); }
        cb(null, dir);
    },
    filename: (req, file, cb) =>{
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

function limpiarCache(){
    console.log("=> Limpiando caché de tareas...");
    cache.del('tareas');
}

//funcion aux para encriptar contraseñas usando Hashing SHA-256
function encriptarPassword(password){
    return crypto.createHash('sha256').update(password).digest('hex');
}
//rutas de autenticacion
//registro de Usuarios directamente en MongoDB con Clave Encriptada
app.post('/api/auth/register', async (req, res) =>{
    try {
        const { correo, password } = req.body;
        if (!correo || !password) return res.status(400).json({ message: 'Campos incompletos' });

        const existe = await Usuario.findOne({ correo });
        if (existe) return res.status(400).json({ message: 'El correo ya está registrado' });

        const passwordEncriptada = encriptarPassword(password);

        const nuevoUsuario = new Usuario({ correo, password: passwordEncriptada });
        await nuevoUsuario.save();

        res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
    } catch (error){
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});
//desde aca hecho con ia gemini-------------------------------
//login con MongoDB + Generación de 2FA Dinámico y Aleatorio
app.post('/api/auth/login', async (req, res) =>{
    try{
        const { usuario, password } = req.body;

        const userEncontrado = await Usuario.findOne({ correo: usuario });
        if (!userEncontrado) return res.status(401).json({ message: 'Credenciales incorrectas' });

        // Evaluamos el Hash de la contraseña ingresada
        const hashInput = encriptarPassword(password);
        if (userEncontrado.password !== hashInput) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }
        //pin aletorio generacion
        codigo2FA_servidor = Math.floor(1000 + Math.random() * 9000).toString();
        console.log(`=> INTENTO DE LOGIN: ${usuario}`);
        console.log(`=> PIN 2FA GENERADO: [ ${codigo2FA_servidor} ]`);
        console.log(`========================================\n`);
        // Limitación de alcance: El token expira en 15 min
        const token = jwt.sign(
            { id: userEncontrado._id, correo: userEncontrado.correo }, 
            SECRET_KEY, 
            { expiresIn: '15m' } 
        );
        return res.json({ 
            mensaje: "Paso 1 completado. Código aleatorio generado.",
            requiere2FA: true,
            tokenTemporal: token,
            codigoParaPrueba: codigo2FA_servidor //enviado al frontend para simular el SMS
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el login' });
    }
});

//validación de Segundo Paso 
app.post('/api/auth/verify-2fa', (req, res) =>{
    const { codigo, tokenTemporal } = req.body;

    if (codigo === codigo2FA_servidor){
        try {
            const verificado = jwt.verify(tokenTemporal, SECRET_KEY);
            
            // se restablece el código por seguridad
            codigo2FA_servidor = ""; 
            
            return res.json({ autorizado: true, tokenFinal: tokenTemporal, user: verificado.correo });
        } catch (error) {
            return res.status(401).json({ message: 'Token expirado o inválido' });
        }
    }
    res.status(400).json({ message: 'Código PIN incorrecto o expirado' });
});//----------hasta aca hecho con ia gemini//
//todolist
app.get('/listadetareas/appv1', async (req, res) =>{
    try {
        let tareas = cache.get('tareas');
        if (!tareas) {
            tareas = await Tarea.find().sort({ createdAt: -1 });
            cache.set('tareas', tareas);
        }
        const respuestaFinal ={
            meta:{
                total_tareas: tareas.length,
                version: "1.0.0",
                timestamp: new Date().toISOString()
            },
            data: tareas
        };

        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.json(respuestaFinal);
    }catch (error){
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

app.post('/listadetareas/appv1', async (req, res) =>{
    try{
        const { tarea } = req.body;
        if (!tarea) return res.status(400).json({ message: 'Tarea vacía' });
        const nueva = new Tarea({ tarea });
        await nueva.save();
        limpiarCache();
        res.status(201).json(nueva);
    }catch (error){
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

app.put('/listadetareas/appv1/:id', async (req, res) =>{
    try{
        const { tarea, finalizado } = req.body;
        console.log(`=> Editando tarea ID: ${req.params.id}`);
        
        const actualizada = await Tarea.findByIdAndUpdate(
            req.params.id, 
            { tarea, finalizado }, 
            { new: true }
        );
        if (!actualizada) return res.status(404).json({ message: 'No encontrada' });
        limpiarCache();
        res.json(actualizada);
    }catch (error){
        console.error("Error en PUT:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.delete('/listadetareas/appv1/:id', async (req, res) =>{
    try{
        console.log(`=> Intentando eliminar tarea ID: ${req.params.id}`);
        const eliminada = await Tarea.findByIdAndDelete(req.params.id);
        
        if (!eliminada){
            console.log("Tarea no encontrada");
            return res.status(404).json({ message: 'No encontrada' });
        }
        limpiarCache();
        res.json({ message: 'Tarea eliminada' });
    } catch (error){
        console.error("Error en DELETE:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});
//rutas para el drive
app.post('/drive/upload', upload.single('archivo'), (req, res) =>{
    try {
        if (!req.file) return res.status(400).json({ message: 'Sin archivo' });
        res.status(201).json({ mensaje: 'Éxito', nombre: req.file.filename });
    } catch (error) { res.status(500).json({ message: 'Error' }); }
});

app.get('/drive/files', (req, res) =>{
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) return res.json([]);
    fs.readdir(dir, (err, files) => {
        if (err) return res.status(500).json({ message: 'Error' });
        const lista = files.map(file => {
            const stats = fs.statSync(path.join(dir, file));
            return {
                nombre: file,
                url: `http://localhost:300/uploads/${file}`,
                size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
                fecha: stats.birthtime
            };
        });
        res.json(lista);
    });
});

app.delete('/drive/files/:name', (req, res) =>{
    const filePath = path.join(__dirname, 'uploads', req.params.name);
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) return res.status(500).json({ message: 'Error' });
            res.json({ message: 'Archivo borrado' });
        });
    } else { res.status(404).json({ message: 'No existe' }); }
});

const PORT = process.env.PORT || 300;
app.listen(PORT, () => console.log(`Servidor listo en puerto ${PORT}`));