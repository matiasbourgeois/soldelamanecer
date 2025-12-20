import React, { useEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    Polyline,
    ZoomControl
} from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { ThemeIcon, Text, Badge, ScrollArea, Divider, Group } from "@mantine/core";
import { IconPackage, IconTruck, IconUser } from "@tabler/icons-react";
import "leaflet/dist/leaflet.css";
import "leaflet-polylinedecorator";
import "../../../../styles/ClusterStyles.css"; // Custom cluster styles

// 🎨 Marcador Premium Vectorial
const createCustomIcon = (index, isLast) => {
    // Colores manuales para evitar dependencia de MantineTheme context
    const backgroundColor = isLast ? "#be4bdb" : "#228be6"; // Grape vs Blue

    const iconHtml = renderToStaticMarkup(
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: backgroundColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    border: '3px solid white',
                    zIndex: 10
                }}
            >
                <span style={{ fontWeight: 800, fontSize: '16px', fontFamily: 'sans-serif' }}>{index + 1}</span>
            </div>
            <div style={{
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: `10px solid ${backgroundColor}`,
            }} />
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-icon',
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -50],
    });
};

const FlechasDireccionales = ({ posiciones }) => {
    const map = useMap();
    useEffect(() => {
        if (!posiciones || posiciones.length < 2) return;
        const decorator = window.L.polylineDecorator(
            window.L.polyline(posiciones),
            {
                patterns: [
                    {
                        offset: "100%",
                        repeat: 0,
                        symbol: window.L.Symbol.arrowHead({
                            pixelSize: 15,
                            polygon: true,
                            pathOptions: { stroke: true, color: "#1971c2", fillOpacity: 1, weight: 0 },
                        }),
                    },
                    {
                        offset: "50%",
                        repeat: "20%",
                        symbol: window.L.Symbol.arrowHead({
                            pixelSize: 10,
                            polygon: false,
                            pathOptions: { stroke: true, color: "#1971c2", weight: 2 },
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

const AjustarVista = ({ posiciones }) => {
    const map = useMap();
    useEffect(() => {
        if (posiciones.length > 0) {
            const bounds = L.latLngBounds(posiciones);
            map.fitBounds(bounds, { padding: [60, 60] }); // Más padding
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
        return (
            <div style={{ height: "400px", width: "100%", display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
                <Text c="dimmed">No hay entregas geolocalizadas disponibles.</Text>
            </div>
        );
    }

    const posiciones = enviosConUbicacion.map((e) => {
        const [lng, lat] = e.ubicacionEntrega.coordinates;
        return [lat, lng];
    });

    return (
        <div className="mb-4" style={{ height: "100%", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid #e9ecef" }}>
            <MapContainer
                center={posiciones[0]}
                zoom={13}
                scrollWheelZoom={true}
                zoomControl={false} // Custom positioning
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                />

                <ZoomControl position="bottomright" />
                <AjustarVista posiciones={posiciones} />

                {/* Ruta Principal */}
                {posiciones.length > 1 && (
                    <>
                        <Polyline
                            positions={posiciones}
                            pathOptions={{
                                color: "#228be6", // Mantine Blue
                                weight: 5,
                                opacity: 0.8,
                                lineJoin: 'round',
                                lineCap: 'round'
                            }}
                        />
                        <FlechasDireccionales posiciones={posiciones} />
                    </>
                )}

                <MarkerClusterGroup
                    maxClusterRadius={30}
                    showCoverageOnHover={false}
                >
                    {enviosConUbicacion.map((envio, index) => {
                        const [lng, lat] = envio.ubicacionEntrega.coordinates;
                        const isLast = index === enviosConUbicacion.length - 1;

                        return (
                            <Marker
                                key={envio._id}
                                icon={createCustomIcon(index, isLast)}
                                position={[lat, lng]}
                            >
                                <Popup closeButton={false} minWidth={220} className="custom-popup">
                                    <div style={{ padding: "8px 4px" }}>
                                        {/* Header: Remito + Badge */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#212529' }}>
                                                {envio.remitoNumero}
                                            </span>
                                            <span style={{
                                                backgroundColor: envio.historialEstados?.some(h => h.estado === 'entregado') ? '#e6fcf5' : '#f1f3f5',
                                                color: envio.historialEstados?.some(h => h.estado === 'entregado') ? '#0ca678' : '#868e96',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                textTransform: 'uppercase'
                                            }}>
                                                {envio.historialEstados?.some(h => h.estado === 'entregado') ? 'ENTREGADO' : 'PENDIENTE'}
                                            </span>
                                        </div>

                                        <div style={{ borderTop: '1px solid #dee2e6', marginBottom: '10px' }}></div>

                                        {/* Row 1: Dirección */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <div style={{ minWidth: '24px', color: '#868e96', display: 'flex', marginTop: '2px' }}>
                                                <IconTruck size={16} />
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#495057', lineHeight: '1.4' }}>
                                                {envio.destinatario?.direccion || "Sin dirección"}
                                            </span>
                                        </div>

                                        {/* Row 2: Receptor */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <div style={{ minWidth: '24px', color: '#868e96', display: 'flex', marginTop: '2px' }}>
                                                <IconUser size={16} />
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#495057', lineHeight: '1.4' }}>
                                                {envio.nombreReceptor || envio.destinatario?.nombre || "Sin receptor"}
                                            </span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
};

export default MapaEntregas;
