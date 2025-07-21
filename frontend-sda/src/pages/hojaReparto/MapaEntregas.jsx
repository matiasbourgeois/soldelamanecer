import React, { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    Polyline,
} from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet-polylinedecorator";

// Ícono profesional con sombra
const iconoEntrega = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/756/756940.png", // ícono amarillo moderno
    iconSize: [34, 34],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
});


// 🔁 Componente para flechas direccionales
const FlechasDireccionales = ({ posiciones }) => {
    const map = useMap();

    useEffect(() => {
        if (!posiciones || posiciones.length < 2) return;

        const decorator = window.L.polylineDecorator(
            window.L.polyline(posiciones),
            {
                patterns: [
                    {
                        offset: "80%",
                        repeat: "25%",
                        symbol: window.L.Symbol.arrowHead({
                            pixelSize: 10,
                            polygon: false,
                            pathOptions: {
                                stroke: true,
                                color: "#5F5F5D",
                                weight: 2,
                            },
                        }),
                    },
                ],
            }
        );

        decorator.addTo(map);
        return () => map.removeLayer(decorator);
    }, [posiciones, map]);

    return null;
};

// 🔁 Componente para línea animada separada
const LineaAnimada = ({ posiciones }) => {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setOffset((prev) => (prev + 1) % 100);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <Polyline
            positions={posiciones}
            pathOptions={{
                color: "#5F5F5D",
                weight: 2,
                dashArray: "12 8",
                dashOffset: `${offset}`,
                opacity: 0.9,
                lineCap: "round",
            }}
        />
    );
};

const AjustarVista = ({ posiciones }) => {
    const map = useMap();
    useEffect(() => {
        if (posiciones.length > 0) {
            const bounds = L.latLngBounds(posiciones);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [posiciones, map]);
    return null;
};

const MapaEntregas = ({ envios }) => {
    const enviosConUbicacion = envios.filter(
        (e) =>
            e.ubicacionEntrega &&
            Array.isArray(e.ubicacionEntrega.coordinates) &&
            e.ubicacionEntrega.coordinates.length === 2
    );

    if (enviosConUbicacion.length === 0) {
        return <p className="text-muted">No hay entregas geolocalizadas aún.</p>;
    }

    const posiciones = enviosConUbicacion.map((e) => {
        const [lng, lat] = e.ubicacionEntrega.coordinates;
        return [lat, lng];
    });

    const invertirAnimacion = (() => {
        if (posiciones.length < 2) return false;
        const [, lngInicio] = posiciones[0];
        const [, lngFin] = posiciones[posiciones.length - 1];
        return lngFin < lngInicio;

    })();





    return (
        <div className="mb-4" style={{ height: "400px", width: "100%" }}>
            <MapContainer
                center={posiciones[0]}
                zoom={13}
                scrollWheelZoom={true}
                zoomControl={true}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                />

                <AjustarVista posiciones={posiciones} />

                {/* 🔶 Línea animada con dirección */}
                {posiciones.length > 1 && (
                    <>
                        <LineaAnimada
                            posiciones={invertirAnimacion ? [...posiciones].reverse() : posiciones}
                        />
                        <FlechasDireccionales posiciones={posiciones} />
                    </>
                )}


                <MarkerClusterGroup maxClusterRadius={10}>
                    {enviosConUbicacion.map((envio) => {
                        const [lng, lat] = envio.ubicacionEntrega.coordinates;
                        return (
                            <Marker
                                key={envio._id}
                                icon={iconoEntrega}
                                position={[lat, lng]}
                            >
                                <Popup>
                                    <div style={{ padding: "4px 8px", maxWidth: "200px" }}>
                                        <h6 style={{ margin: 0, color: "#343a40" }}>{envio.remitoNumero}</h6>
                                        <hr style={{ margin: "4px 0" }} />
                                        <strong>📍 Dirección:</strong> {envio.destinatario?.direccion || "-"}<br />
                                        <strong>👤 Receptor:</strong> {envio.nombreReceptor || "-"}<br />
                                        <strong>🆔 DNI:</strong> {envio.dniReceptor || "-"}<br />
                                        <strong>🌎 Localidad:</strong> {envio.localidadDestino?.nombre || "-"}<br />
                                        <strong>📅 Entregado:</strong>{" "}
                                        {(() => {
                                            const entrega = envio.historialEstados?.find(e => e.estado === "entregado");
                                            if (entrega?.fecha) {
                                                const fecha = new Date(entrega.fecha);
                                                return fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString();
                                            }
                                            return "Sin registro";
                                        })()}
                                    </div>
                                </Popup>


                            </Marker>
                        );
                    })}
                </MarkerClusterGroup>
            </MapContainer>

            {/* 🔽 Estilos de clusters incrustados */}
            <style>
                {`
          .marker-cluster-small {
            background-color: rgba(241, 211, 87, 0.6);
            color: white;
          }
          .marker-cluster-medium {
            background-color: rgba(240, 194, 12, 0.6);
            color: white;
          }
          .marker-cluster-large {
            background-color: rgba(255, 111, 0, 0.6);
            color: white;
          }
          .marker-cluster div {
            width: 30px;
            height: 30px;
            margin-left: -15px;
            margin-top: -15px;
            text-align: center;
            border-radius: 15px;
            font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
            line-height: 30px;
          }
        `}
            </style>
        </div>
    );
};

export default MapaEntregas;
