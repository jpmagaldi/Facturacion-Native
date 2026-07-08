import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Surface, DataTable, Icon, ActivityIndicator, 
    Portal, Dialog, Button, TextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatePickerInput } from 'react-native-paper-dates';
import { useFocusEffect } from '@react-navigation/native';
import { useStore, apiClient } from './store'


export default function Stock({ navigation, route }) {
    const [fecha, setFecha] = useState(new Date());
    const usePtoventa = useStore.getString('usePtoventa')
    
    // Estados para las 7 tablas
    const [dataTabla1, setDataTabla1] = useState([]);
    const [dataTabla2, setDataTabla2] = useState([]);
    const [dataTabla3, setDataTabla3] = useState([]);
    const [dataTabla4, setDataTabla4] = useState([]);
    const [dataTabla5, setDataTabla5] = useState([]);
    const [dataTabla6, setDataTabla6] = useState([]);
    const [dataTabla7, setDataTabla7] = useState([]);
    const [importeVentas, setImporteVentas] = useState('Cargando..');
    const [ImporteColor, setImporteColor] = useState('#d37f00');

    const [loading, setLoading] = useState(false);

    const [visible, setVisible] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [texto, setTexto] = useState('');

    useFocusEffect(
        useCallback(() => {
            BuscarInfo();
        }, [fecha])
    );

    const BuscarInfo = async () => {
        setLoading(true)
        try { 
            let response = await apiClient.post(`getStockInfo`, {
                Fecha: fecha.toISOString().slice(0, 10),
                PtoVenta: usePtoventa
            })
            setDataTabla1(response.data.Tabla1)
            setDataTabla2(response.data.Tabla2)
            setDataTabla3(response.data.Tabla3)
            setDataTabla4(response.data.Tabla4)
            setDataTabla5(response.data.Tabla5)
            setDataTabla6(response.data.Tabla6)
            setDataTabla7(response.data.Tabla7)
            
            if (response.data.Total !== '0.00') {
                const formattedTotal = parseFloat(response.data.Total).toLocaleString('es-AR', { 
                    minimumFractionDigits: 1, 
                    maximumFractionDigits: 1 
                });
                setImporteVentas(`${formattedTotal}`);
                setImporteColor('#43a047');
            } else {
                setImporteVentas('0.00');
                setImporteColor('#43a047');
            }
            
            setLoading(false)
        } catch (e) {
            setTitulo('Error')
            setTexto('Error al conectar con el servidor')
            setVisible(true)
            setLoading(false)
            console.error(e);
        }
    }

    // Componentes reutilizable para las secciones de tabla
    const TablaSeccion = ({ titulo, icono, data }) => (
        <Surface style={styles.tableSurface} elevation={1}>
            <View style={styles.sectionHeader}>
                <Icon source={icono} size={24} color="#663399" />
                <Text variant="titleMedium" style={styles.sectionTitle} maxFontSizeMultiplier={1.1}>{titulo}</Text>
            </View>
            
            <ScrollView >
                <View>
                    <DataTable style={[styles.table, { width: 300 }]}>
                        <DataTable.Header style={styles.tableHeader}>
                            <DataTable.Title style={styles.widthComp}>
                                <Text style={styles.headerText} maxFontSizeMultiplier={1.1}>Producto.</Text>
                            </DataTable.Title>
                            <DataTable.Title style={styles.widthTotal}>
                                <Text style={styles.headerText} maxFontSizeMultiplier={1.1}>Cantidad</Text>
                            </DataTable.Title>
                        </DataTable.Header>

                        {data.length === 0 ? (
                            <DataTable.Row>
                                <DataTable.Cell style={{ flex: 1, justifyContent: 'center' }}>
                                    <Text variant="bodySmall" style={{ color: '#999' }}>Sin datos disponibles</Text>
                                </DataTable.Cell>
                            </DataTable.Row>
                        ) : (
                            data.map((item, index) => (
                                <DataTable.Row key={index} style={styles.tableRow}>
                                    <DataTable.Cell style={styles.widthComp}>
                                        <Text style={styles.cellText} maxFontSizeMultiplier={1.1} numberOfLines={2}>{item[0]}</Text>
                                    </DataTable.Cell>
                                    <DataTable.Cell style={styles.widthTotal}>
                                        <Text style={styles.valueText} maxFontSizeMultiplier={1.1}>{Math.round(parseFloat(item[1]) * 10) / 10}</Text>
                                    </DataTable.Cell>
                                </DataTable.Row>
                            ))
                        )}
                    </DataTable>
                </View>
            </ScrollView>
        </Surface>
    );

    const TablaSeccionVenta = ({ titulo, icono, data }) => (
        <Surface style={styles.tableSurface} elevation={1}>
            <View style={styles.sectionHeader}>
                <Icon source={icono} size={24} color="#663399" />
                <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>{titulo}</Text>
                    <Text variant="bodySmall" style={{ color: '#888', fontStyle: 'italic', marginTop: 2 }}>Deslizar para ver cambios</Text>
                </View>
                <View style={styles.scrollIndicatorBadge}> 
                    <Icon source="arrow-left-bold" size={14} color="#663399" />
                    <Text style={styles.scrollIndicatorText}>Deslizar</Text>
                </View>
            </View>
            
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
                <View>
                    <DataTable style={[styles.table, { width: 460 }]}>
                        <DataTable.Header style={styles.tableHeader}>
                            <DataTable.Title style={styles.widthComp}>
                                <Text style={styles.headerText} maxFontSizeMultiplier={1.1}>Producto.</Text>
                            </DataTable.Title>
                            <DataTable.Title style={styles.widthTotal}>
                                <Text style={styles.headerText} maxFontSizeMultiplier={1.1}>Cantidad</Text>
                            </DataTable.Title>
                            <DataTable.Title style={styles.widthTotal}>
                                <Text style={styles.headerText} maxFontSizeMultiplier={1.1}>Cambios</Text>
                            </DataTable.Title>
                        </DataTable.Header>

                        {data.length === 0 ? (
                            <DataTable.Row>
                                <DataTable.Cell style={{ flex: 1, justifyContent: 'center' }}>
                                    <Text variant="bodySmall" style={{ color: '#999' }}>Sin datos disponibles</Text>
                                </DataTable.Cell>
                            </DataTable.Row>
                        ) : (
                            data.map((item, index) => (
                                <DataTable.Row key={index} style={styles.tableRow}>
                                    <DataTable.Cell style={styles.widthComp}>
                                        <Text style={styles.cellText} maxFontSizeMultiplier={1.1} numberOfLines={2}>{item.Producto}</Text>
                                    </DataTable.Cell>
                                    <DataTable.Cell style={styles.widthTotal}>
                                        <Text style={styles.valueText} maxFontSizeMultiplier={1.1}>{Math.round(parseFloat(item.Cantidad_Total) * 10) / 10}</Text>
                                    </DataTable.Cell>
                                    <DataTable.Cell style={styles.widthTotal}>
                                        <Text style={styles.valueText} maxFontSizeMultiplier={1.1}>{Math.round(parseFloat(item.Cambio_Total) * 10) / 10}</Text>
                                    </DataTable.Cell>
                                </DataTable.Row>
                            ))
                        )}
                    </DataTable>
                </View>
            </ScrollView>
        </Surface>
    );   
    
    const Alerta = () => {
        const isSuccess = titulo.toLowerCase().includes('exito') || titulo.toLowerCase().includes('éxito');
        //lo dejo expresado por si en algun momento es necesario un aviso
        //const isWarning = titulo.toLowerCase().includes('cae') || titulo.toLowerCase().includes('aviso');
        
        let headerColor = '#BD1C10'; // Default a Rojo de Error
        let bgColor = '#FFEBEE';
        let iconName = 'alert-circle-outline';

        if (isSuccess) {
            headerColor = '#4CAF50';
            bgColor = '#E8F5E9';
            iconName = 'check-circle-outline';
        } /*else if (isWarning) {
            headerColor = '#FF9800';
            bgColor = '#FFF3E0';
            iconName = 'alert-outline';
        }*/

        return (
            <Portal>
                <Dialog 
                    visible={visible} 
                    onDismiss={() => setVisible(false)}
                    style={{ borderRadius: 28, backgroundColor: '#fff', overflow: 'hidden' }}
                >
                    {/* Línea decorativa superior */}
                    <View style={{ backgroundColor: headerColor, height: 6 }} />
                    
                    <View style={{ alignItems: 'center', marginTop: 24 }}>
                        <View style={{ 
                            backgroundColor: bgColor, 
                            width: 72, 
                            height: 72, 
                            borderRadius: 36, 
                            justifyContent: 'center', 
                            alignItems: 'center' 
                        }}>
                            <Icon source={iconName} color={headerColor} size={40} />
                        </View>
                    </View>

                    <Dialog.Title style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 22, paddingTop: 16 }}>
                        {titulo}
                    </Dialog.Title>

                    <Dialog.Content>
                        <Text variant="bodyLarge" style={{ textAlign: 'center', color: '#555', lineHeight: 24 }}>
                            {texto}
                        </Text>
                    </Dialog.Content>

                    <Dialog.Actions style={{ flexDirection: 'column', paddingHorizontal: 20, paddingBottom: 20 }}>
                        <Button 
                            mode="contained" 
                            onPress={() => setVisible(false)}
                            style={{ width: '100%', borderRadius: 12, backgroundColor: headerColor }}
                            contentStyle={{ height: 48 }}
                            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                        >
                            Aceptar
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        );
    }


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <Icon source="package-variant-closed" size={40} color="#663399" />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text variant="headlineMedium" style={styles.title} maxFontSizeMultiplier={1.1}>Control de Stock</Text>
                        {loading && <ActivityIndicator animating={true} color="#663399" size="small" style={{ marginLeft: 10, marginTop: 8 }} />}
                    </View>
                </View>

                {/* Filters Section */}
                <Surface style={styles.filterSurface} elevation={1}>
                    <View style={styles.sectionHeader}>
                        <Icon source="calendar-month" size={24} color="#663399" />
                        <Text variant="titleMedium" style={styles.sectionTitle}>Selección de Fecha</Text>
                    </View>
                    <DatePickerInput
                        locale="es"
                        label="Fecha de consulta"
                        value={fecha}
                        onChange={(d) => setFecha(d)}
                        inputMode="start"
                        mode="outlined"
                        activeOutlineColor="#663399"
                        style={styles.dateInput}
                    />
                </Surface>

                {/* Secciones de Tablas */}
                {dataTabla1.length > 0 ? (
                    <TablaSeccion 
                        titulo="Stock inicial" 
                        icono="archive" 
                        data={dataTabla1} 
                    />
                ) : null}
                
                {dataTabla2.length > 0 ? (
                    <TablaSeccion 
                        titulo="Carga en Fabrica" 
                        icono="archive-arrow-up" 
                        data={dataTabla2} 
                    />
                ) : null}

                {dataTabla3.length > 0 ? (
                    <TablaSeccion 
                        titulo="Bajada en Negocio" 
                        icono="archive-arrow-down" 
                        data={dataTabla3} 
                    />
                ) : null}

                {dataTabla4.length > 0 ? (
                    <TablaSeccionVenta 
                        titulo="Venta" 
                        icono="clipboard-edit-outline" 
                        data={dataTabla4} 
                    />
                ) : null}
                {dataTabla6.length > 0 ? (
                    <TablaSeccion 
                        titulo="Carga en Negocio" 
                        icono="archive-arrow-up" 
                        data={dataTabla6}
                    />
                ) : null}
                {dataTabla7.length > 0 ? (
                    <TablaSeccion 
                        titulo="Cambios sin ventas" 
                        icono="cash-off" 
                        data={dataTabla7}
                    />
                ) : null}
                {dataTabla5.length > 0 ? (
                    <TablaSeccion 
                        titulo="Stock Final" 
                        icono="warehouse" 
                        data={dataTabla5} 
                    />
                ) : null}

                <Surface style={[styles.totalSurface, { backgroundColor: ImporteColor, marginTop: 16 }]} elevation={2}>
                    <View style={styles.totalHeader}>
                        <Icon source="currency-usd" size={24} color="#fff" />
                        <Text variant="titleMedium" style={styles.totalLabel} maxFontSizeMultiplier={1.1}>TOTAL VENTAS</Text>
                    </View>
                    <TextInput
                        mode="flat"
                        value={importeVentas}
                        style={styles.totalInput}
                        textColor="#fff"
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        readOnly
                    />
                </Surface>

            </ScrollView>
            <Alerta></Alerta>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    headerContainer: {
        alignItems: 'center',
        marginVertical: 24,
    },
    title: {
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginTop: 8,
    },
    filterSurface: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    tableSurface: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#333',
    },
    dateInput: {
        backgroundColor: '#fff',
    },
    table: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    tableHeader: {
        backgroundColor: '#f3e5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerText: {
        color: '#663399',
        fontWeight: 'bold',
        fontSize: 14,
    },
    tableRow: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        minHeight: 56,
    },
    cellText: {
        fontSize: 14,
        color: '#1a1a1a',
    },
    valueText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#663399',
    },
    widthComp: {
        width: 200,
        flex: 0,
        
    },
    widthTotal: {
        width: 75,
        flex: 0,
        justifyContent: 'center'
    },
    totalSurface: {
        padding: 20,
        borderRadius: 20,
        backgroundColor: '#663399',
        marginTop: 8,
    },
    totalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 10,
    },
    totalLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    totalInput: {
        backgroundColor: 'transparent',
        fontSize: 28,
        fontWeight: 'bold',
        height: 50,
        paddingHorizontal: 0,
    },
    scrollIndicatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3e5f5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    scrollIndicatorText: {
        fontSize: 11,
        color: '#663399',
        fontWeight: 'bold',
    },
});
