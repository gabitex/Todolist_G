const jwt = require('jsonwebtoken');
const SECRET_KEY = "MI_LLAVE";
const crypto = require('crypto');
const express = require('express');
const https = require('https');
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

let codigo2FA_servidor = "";

const storage = multer.diskStorage({//esta funcion, hecha con ia Claude-------------------------------
    destination: (req, file, cb) => {
        const dir = './uploads/temp';// todos los archivos los guarda ahi primero
        if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

function limpiarCache() {
    console.log("=> Limpiando caché");
    cache.del('tareas');
}

function encriptarPassword(password){
    return crypto.createHash('sha256').update(password).digest('hex');
}

function authMiddleware(req, res, next){
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'Token requerido' });
    const token = authHeader.split(' ')[1];
    try {//verifica y decodifica el token
        const decoded = jwt.verify(token, SECRET_KEY);
        req.userId = decoded.id;// saca el ID del usuario del token
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
}
//rutas de autenticacion
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
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) =>{
    try {
        const { usuario, password } = req.body;

        const userEncontrado = await Usuario.findOne({ correo: usuario });
        if (!userEncontrado) return res.status(401).json({ message: 'Credenciales incorrectas' });

        const hashInput = encriptarPassword(password);
        if (userEncontrado.password !== hashInput) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        codigo2FA_servidor = Math.floor(1000 + Math.random() * 9000).toString();
        console.log(`=> INTENTO DE LOGIN: ${usuario}`);
        console.log(`=> PIN 2FA GENERADO: [ ${codigo2FA_servidor} ]`);
        console.log(`========================================\n`);

        const token = jwt.sign(//crea el token
            { id: userEncontrado._id, correo: userEncontrado.correo },//guarda el id del usuario en el token
            SECRET_KEY,
            { expiresIn: '15m' }
        );

        return res.json({
            mensaje: "Paso 1 completado. Código aleatorio generado.",
            requiere2FA: true,
            tokenTemporal: token,
            codigoParaPrueba: codigo2FA_servidor
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el login' });
    }
});

app.post('/api/auth/verify-2fa', (req, res) =>{
    const { codigo, tokenTemporal } = req.body;

    if (codigo === codigo2FA_servidor) {
        try {
            const verificado = jwt.verify(tokenTemporal, SECRET_KEY);
            codigo2FA_servidor = "";
            return res.json({ autorizado: true, tokenFinal: tokenTemporal, user: verificado.correo });
        } catch (error) {
            return res.status(401).json({ message: 'Token expirado o inválido' });
        }
    }
    res.status(400).json({ message: 'Código PIN incorrecto o expirado' });
});//---Hecho con ayuda de la ia claude hasta aca ----------------------------------------------

//rutas actualizadas y protegidas
app.get('/listadetareas/appv1', authMiddleware, async (req, res) =>{//ahora las rutas usan el id
    try {
        const tareas = await Tarea.find({ usuario: req.userId }).sort({ createdAt: -1 });
        const respuestaFinal = {
            meta: {
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
    } catch (error) {
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

app.post('/listadetareas/appv1', authMiddleware, async (req, res) =>{
    try {
        const { tarea } = req.body;
        if (!tarea) return res.status(400).json({ message: 'Tarea vacía' });
        const nueva = new Tarea({ tarea, usuario: req.userId });
        await nueva.save();
        limpiarCache();
        res.status(201).json(nueva);
    } catch (error) {
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

app.put('/listadetareas/appv1/:id', authMiddleware, async (req, res) =>{
    try {
        const { tarea, finalizado } = req.body;
        console.log(`=> Editando tarea ID: ${req.params.id}`);

        const actualizada = await Tarea.findOneAndUpdate(
            { _id: req.params.id, usuario: req.userId },
            { tarea, finalizado },
            { new: true }
        );
        if (!actualizada) return res.status(404).json({ message: 'No encontrada' });
        limpiarCache();
        res.json(actualizada);
    } catch (error) {
        console.error("Error en PUT:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.delete('/listadetareas/appv1/:id', authMiddleware, async (req, res) =>{
    try {
        console.log(`=> Intentando eliminar tarea ID: ${req.params.id}`);
        const eliminada = await Tarea.findOneAndDelete({ _id: req.params.id, usuario: req.userId });

        if (!eliminada) {
            console.log("Tarea no encontrada");
            return res.status(404).json({ message: 'No encontrada' });
        }
        limpiarCache();
        res.json({ message: 'Tarea eliminada' });
    } catch (error) {
        console.error("Error en DELETE:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// RUTAS DRIVE ahora separadas por usuario
app.post('/drive/upload', authMiddleware, upload.single('archivo'), (req, res) =>{
    try {
        if (!req.file) return res.status(400).json({ message: 'Sin archivo' });

        const userDir = path.join(__dirname, 'uploads', req.userId.toString());//carpeta del usuario
        if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

        const destino = path.join(userDir, req.file.filename);// mueve de temp a carpeta del usuario
        fs.renameSync(req.file.path, destino);

        res.status(201).json({ mensaje: 'Éxito', nombre: req.file.filename });
    } catch (error) {
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

app.get('/drive/files', authMiddleware, (req, res) => {
    const dir = path.join(__dirname, 'uploads', req.userId.toString());
    if (!fs.existsSync(dir)) return res.json([]);

    fs.readdir(dir, (err, files) => {
        if (err) return res.status(500).json({ message: 'Error' });
        const lista = files.map(file => {
            const stats = fs.statSync(path.join(dir, file));
            return {
                nombre: file,
                url: `https://localhost:300/uploads/${req.userId}/${file}`,
                size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
                fecha: stats.birthtime
            };
        });
        res.json(lista);
    });
});

app.delete('/drive/files/:name', authMiddleware, (req, res) =>{
    const filePath = path.join(__dirname, 'uploads', req.userId.toString(), req.params.name);
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) return res.status(500).json({ message: 'Error' });
            res.json({ message: 'Archivo borrado' });
        });
    } else {
        res.status(404).json({ message: 'No existe' });
    }
});

// SERVIDOR HTTPS
const PORT = process.env.PORT || 300;
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Servidor HTTPS listo en puerto ${PORT}`);
});
