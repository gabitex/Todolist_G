const mongoose = require('mongoose');

const tareaSchema = new mongoose.Schema({
  tarea: { type: String, required: true, trim: true },
  finalizado: { type: Boolean, default: false },
  usuario:{type: mongoose.Schema.Types.ObjectId, ref:'Usuario',required: true}
}, { 
  timestamps: true//fechas de creacion
});
module.exports = mongoose.model('Tarea', tareaSchema);
