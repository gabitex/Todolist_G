const mongoose = require('mongoose');
const crypto = require('crypto');
const connectDB = require('./configBD/apN_mongo');
const Usuario = require('./modelo_datos/Usuario');
const Tarea = require('./modelo_datos/Tarea');

function encriptarPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

const usuariosPrueba = [
    { correo: 'admin@test.com', password: '1234' },
    { correo: 'wendy@test.com', password: '1234' },
    { correo: 'armando@test.com', password: '1234' }
];

const tareasPorUsuario = [
    'Revisar correos pendientes',
    'Entregar informe semanal',
    'Reunión con el equipo',
    'Actualizar documentación',
    'Hacer pruebas del sistema'
];

async function cargarDatos() {
    await connectDB();
    console.log('=> Conectado a MongoDB');

    // Limpiar datos anteriores de prueba
    await Usuario.deleteMany({ correo: { $in: usuariosPrueba.map(u => u.correo) } });
    console.log('=> Usuarios de prueba anteriores eliminados');

    for (const u of usuariosPrueba) {
        const nuevoUsuario = new Usuario({
            correo: u.correo,
            password: encriptarPassword(u.password)
        });
        await nuevoUsuario.save();
        console.log(`=> Usuario creado: ${u.correo}`);

        // Eliminar tareas anteriores de ese usuario
        await Tarea.deleteMany({ usuario: nuevoUsuario._id });

        // Crear tareas para ese usuario
        for (const texto of tareasPorUsuario) {
            const tarea = new Tarea({
                tarea: texto,
                finalizado: false,
                usuario: nuevoUsuario._id
            });
            await tarea.save();
        }
        console.log(`=> 5 tareas creadas para: ${u.correo}`);
    }

    console.log('\n✅ Datos de prueba cargados exitosamente');
    console.log('=> Usuarios disponibles:');
    usuariosPrueba.forEach(u => {
        console.log(`   correo: ${u.correo} | password: ${u.password}`);
    });

    mongoose.connection.close();
    process.exit(0);
}

cargarDatos().catch(err => {
    console.error('Error al cargar datos:', err);
    process.exit(1);
});
