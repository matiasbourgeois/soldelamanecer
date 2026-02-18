
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Modelos
const Usuario = require('../models/Usuario');
const Chofer = require('../models/Chofer');
const HojaReparto = require('../models/HojaReparto');
const Envio = require('../models/Envio');
const Ruta = require('../models/Ruta');

const verificarHojaChofer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        const email = 'maticheto@hotmail.com';
        console.log(`\n🔍 Buscando usuario: ${email}`);

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            console.log('❌ Usuario no encontrado');
            process.exit(1);
        }
        console.log(`✅ Usuario encontrado: ${usuario.nombre} (${usuario._id})`);

        const chofer = await Chofer.findOne({ usuario: usuario._id });
        if (!chofer) {
            console.log('❌ Perfil de Chofer no encontrado');
            process.exit(1);
        }
        console.log(`✅ Chofer encontrado: ${chofer._id}`);

        // Definir rango de fecha HOY
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        console.log(`\n📅 Buscando hojas entre ${hoy.toISOString()} y ${manana.toISOString()}`);

        // Simular query del controlador
        const hojas = await HojaReparto.find({
            chofer: chofer._id,
            fecha: { $gte: hoy, $lte: manana }
            // Nota: Aquí ya eliminamos el filtro de estado 'pendiente' en el código real
        })
            .populate('ruta')
            .populate('envios');

        console.log(`\n📄 Hojas encontradas: ${hojas.length}`);

        if (hojas.length === 0) {
            console.log('⚠️ NO hay hojas asignadas para hoy.');

            // Buscar si hay alguna hoja para esa Ruta, aunque no tenga chofer
            if (chofer.rutaAsignada || hojas[0]?.ruta) { // Fallback check logic
                // ... logic logic ...
            }
        }

        hojas.forEach((hoja, i) => {
            console.log(`\n[Hoja ${i + 1}] ID: ${hoja._id}`);
            console.log(`   Ruta: ${hoja.ruta?.codigo} - ${hoja.ruta?.descripcion}`);
            console.log(`   Estado: ${hoja.estado}`);
            console.log(`   Envíos asignados (IDs): ${hoja.envios.length}`);

            hoja.envios.forEach((envio, j) => {
                console.log(`      ${j + 1}. ${envio._id} | Estado: ${envio.estado} | Destino: ${envio.domicilioDestino || 'Sin domicilio'}`);
            });
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Desconectado');
    }
};

verificarHojaChofer();
