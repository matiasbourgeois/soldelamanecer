export interface Usuario {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    tipoContrato?: string;
}

export interface Ubicacion {
    type: string;
    coordinates: number[];
}

export interface Localidad {
    nombre: string;
    codigoPostal?: string;
}

export interface Destinatario {
    nombre: string;
    direccion: string;
    telefono?: string;
}

export interface Encomienda {
    cantidad: number;
    descripcion?: string;
}

export interface Envio {
    _id: string;
    remitoNumero: string;
    estado: string;
    destinatario: Destinatario;
    localidadDestino: Localidad;
    encomienda: Encomienda;
    fechaCreacion: string;
    motivoNoEntrega?: string;
    ubicacionEntrega?: Ubicacion;
}

export interface Ruta {
    _id: string;
    codigo: string;
    origen: string;
    destino: string;
}

export interface Vehiculo {
    _id: string;
    patente: string;
    modelo?: string;
}

export interface HojaReparto {
    _id: string;
    numeroHoja: string;
    fecha: string;
    chofer: Usuario;
    vehiculo: Vehiculo;
    ruta: Ruta;
    envios: Envio[];
    estado: string;
}
