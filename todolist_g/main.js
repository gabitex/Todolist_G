const express = require('express');
const connectDB = require('./configBD/apN_mongo');
const Tarea = require('./modelo_datos/Tarea');
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

const storage = multer.diskStorage({
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

app.get('/listadetareas/appv1', async (req, res) =>{
    try {
        let tareas = cache.get('tareas');
        if (!tareas) {
            tareas = await Tarea.find().sort({ createdAt: -1 });
            cache.set('tareas', tareas);
        }

        const respuestaFinal ={
            meta: {
                total_tareas: tareas.length,
                version: "1.0.0",
                timestamp: new Date().toISOString()
            },
            data: tareas
        };
        // Forzamos al navegador a NO guardar caché para ver cambios al instante
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

//para drive
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