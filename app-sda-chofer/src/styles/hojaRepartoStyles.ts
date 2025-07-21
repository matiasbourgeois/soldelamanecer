// styles/hojaRepartoStyles.ts
import { StyleSheet } from "react-native";

export const crearHojaRepartoStyles = (modoOscuro: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: modoOscuro ? "#121212" : "#f5f5f5",
      paddingHorizontal: 5,
      paddingTop: 30,
      paddingBottom: 10,
    },

    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 10,
    },

    cardHojaRepartoUnificado: {
      flexDirection: "row",
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: 0,
      marginBottom: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: "hidden",
    },
    
    cardLine: {
      width: 6,
      backgroundColor: "#1e1e1e",
      height: "100%",
    },
    
    cardContent: {
      flex: 1,
      padding: 16,
    },

    cardInfoBlock: {
      marginTop: 8,
      alignItems: 'flex-start',
    },    
    
    cardTitle: {
      fontSize: 26,
      fontWeight: "bold",
      color: modoOscuro ? "#ffffff" : "#333",
      marginBottom: 12,
      textAlign: "center",
    },

    cardInfoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      marginTop: 10,
    },

    cardInfoText: {
      fontSize: 14,
      color: modoOscuro ? "#e0e0e0" : "#555",
      fontWeight: "500",
      marginHorizontal: 8,
      textAlign: "center",
    },

    enviosContainer: {
      marginTop: 10,
      width: "100%",
    },

    envioCard: {
      flexDirection: 'row',
      backgroundColor: '#fff',
      borderRadius: 10,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden',       // ✅ IMPORTANTE para que el border radius se aplique a todo
      padding: 0,               // ❌ SACÁ EL PADDING para que la rayita quede pegada
    },
    

    statusBar: {
      height: '100%',
      width: 6,
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
    },

    contenidoEnvio: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    
    remitoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center", // ✅ esto ya lo tenés
    },
    
    envioTitulo: {
      fontSize: 16,
      fontWeight: "700",
      color: modoOscuro ? "#ffffff" : "#333",
    },

    envioInfoText: {
      fontSize: 14,
      color: modoOscuro ? "#ffffff" : "#555",
      marginBottom: 2,
    },

    estadoChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      width: 110, // ✅ ancho fijo para todos
      alignItems: 'center',
      justifyContent: "center",
      marginLeft: 10,
    },
    
    

    estadoChipTexto: {
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    
    // Otros estilos usados por el selector de hoja
    containerSelector: {
      flex: 1,
      padding: 16,
      backgroundColor: modoOscuro ? "#121212" : "#f5f5f5",
    },

    tituloPrincipal: {
      fontSize: 18,
      fontWeight: "700",
      marginTop: 30,
      marginBottom: 14,
      textAlign: "center",
      color: modoOscuro ? "#ffffff" : "#222",
    },

    flatListContainer: {
      paddingBottom: 16,
    },

    hojaSelectorCard: {
      backgroundColor: "#ffffff",
      borderRadius: 10,
      marginBottom: 10,
      flexDirection: "row",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      overflow: "hidden",
    },

    hojaSelectorLine: {
      width: 6,
      backgroundColor: "#ffc107", // Amarillo pastel institucional
    },

    hojaSelectorContenido: {
      flex: 1,
      paddingTop: 20,
      padding: 10,
    },

    hojaSelectorNumero: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 4,
    },

    hojaSelectorTitulo: {
      fontSize: 16,
      fontWeight: "700",
      color: modoOscuro ? "#ffffff" : "#333",
    },
    hojaSelectorRuta: {
      fontSize: 14,
      color: "#555",
      marginBottom: 2,
    },

    sinHojasCard: {
      backgroundColor: modoOscuro ? "#1e1e1e" : "#fff",
      padding: 20,
      borderRadius: 12,
      marginTop: 40,
      marginHorizontal: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    sinHojasTitulo: {
      fontSize: 18,
      fontWeight: "bold",
      color: modoOscuro ? "#ffffff" : "#333",
      textAlign: "center",
      marginBottom: 10,
    },

    sinHojasTexto: {
      fontSize: 14,
      color: modoOscuro ? "#ccc" : "#555",
      textAlign: "center",
    },

    hojaSelectorEstado: {
      fontSize: 14,
      color: "#6c757d",
      fontWeight: "500",
      marginTop: 4,
    },

    hojaSelectorFecha: {
      fontSize: 14,
      color: "#555",
      marginBottom: 2,
    },
  });
