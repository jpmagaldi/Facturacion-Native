import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { 
    Text, 
    Surface, 
    TextInput, 
    DataTable, 
    Icon,
    ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatePickerInput } from 'react-native-paper-dates';
import { useFocusEffect } from '@react-navigation/native';
import { useStore, apiClient } from './store'

export default function Ranking({ navigation, route }) {
    const [fecha, setFecha] = useState(new Date());
    const [importeVentas, setImporteVentas] = useState('Cargando..');
    const usePtoventa = useStore.getString('usePtoventa')
    const [ImporteColor, setImporteColor] = useState('#d37f00');
    const [rankingData, setRankingData] = useState([]);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            BuscarInfo();
        }, [fecha])
    );

    const BuscarInfo = async () => {
        setLoading(true)
        try {
            let response = await apiClient.post(`rankingFact`, {
                Fecha: fecha.toISOString().slice(0, 10),
                PtoVta: usePtoventa,
            })
            if (response.data.error === null) {
                const combined = [
                    ...(response.data.rowF || []).map(item => ({
                        tipo: item.Comprobante,
                        cliente: item['SUBSTRING(c.RazonS,1,26)'],
                        nro: item.N_fact.slice(6,13).replace(/^0+/, ''),
                        total: item.Total
                    })),
                    ...(response.data.rowP || []).map(item => ({
                        tipo: 'Presu.',
                        cliente: item['SUBSTRING(c.RazonS,1,26)'],
                        nro: item.N_Presu.slice(6,13).replace(/^0+/, ''),
                        total: item.Total
                    }))
                ];
                setRankingData(combined);
                if (response.data.total !== '0.00') {
                    const formattedTotal = parseFloat(response.data.total).toLocaleString('es-AR', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    });
                    setImporteVentas(`${formattedTotal}`);
                    setImporteColor('#43a047');
                } else {
                    setImporteVentas('0.00');
                    setImporteColor('#43a047');
                }
            } 
            else {
                setImporteVentas(response.data.error);
                setImporteColor('#8B0000');
            }
            setLoading(false)
        } catch (e) {
            setImporteVentas('ERROR INTERNO');
            setImporteColor('#8B0000');
            console.error(e);
        }
    }
    
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <Icon source="trophy-outline" size={40} color="#663399" />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text variant="headlineMedium" style={styles.title}>Ranking de Ventas</Text>
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

                {/* Rankings Table */}
                <Surface style={styles.tableSurface} elevation={1}>
                    <View style={styles.sectionHeader}>
                        <Icon source="format-list-numbered" size={24} color="#663399" />
                        <Text variant="titleMedium" style={styles.sectionTitle}>Clasificación de Facturas</Text>
                    </View>
                    
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
                        <View>
                            <DataTable style={[styles.table, { width: 440 }]}>
                                <DataTable.Header style={styles.tableHeader}>
                                    <DataTable.Title style={styles.widthComp} textStyle={styles.headerText}>Comp.</DataTable.Title>
                                    <DataTable.Title style={styles.widthCliente} textStyle={styles.headerText}>Cliente</DataTable.Title>
                                    <DataTable.Title style={styles.widthNro} textStyle={styles.headerText}>Nro.</DataTable.Title>
                                    <DataTable.Title numeric style={styles.widthTotal} textStyle={styles.headerText}>Total</DataTable.Title>
                                </DataTable.Header>

                                {rankingData.map((item, index) => (
                                    <DataTable.Row key={index} style={styles.tableRow}>
                                        <DataTable.Cell style={styles.widthComp} textStyle={styles.cellText}>{item.tipo}</DataTable.Cell>
                                        <DataTable.Cell style={styles.widthCliente} textStyle={styles.cellText}>{item.cliente}</DataTable.Cell>
                                        <DataTable.Cell style={styles.widthNro} textStyle={styles.cellText}>{item.nro}</DataTable.Cell>
                                        <DataTable.Cell numeric style={styles.widthTotal} textStyle={styles.valueText}>{parseFloat(item.total).toFixed(2)}</DataTable.Cell>
                                    </DataTable.Row>
                                ))}
                            </DataTable>
                        </View>
                    </ScrollView>
                </Surface>

                <Surface style={[styles.totalSurface, { backgroundColor: ImporteColor, marginTop: 16 }]} elevation={2}>
                    <View style={styles.totalHeader}>
                        <Icon source="currency-usd" size={24} color="#fff" />
                        <Text variant="titleMedium" style={styles.totalLabel}>IMPORTE DE VENTAS</Text>
                    </View>
                    <TextInput
                        mode="flat"
                        value={importeVentas}
                        onChangeText={setImporteVentas}
                        style={styles.totalInput}
                        textColor="#fff"
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        readOnly
                    />
                </Surface>
            </ScrollView>
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
    subtitle: {
        color: '#666',
        marginTop: 4,
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
        height: 56,
    },
    cellText: {
        fontSize: 15,
        color: '#1a1a1a',
    },
    valueText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#663399',
    },
    smallCol: {
        maxWidth: 40,
    },
    widthComp: {
        width: 70,
        flex: 0,
    },
    widthCliente: {
        width: 180,
        flex: 0,
    },
    widthNro: {
        width: 40,
        flex: 0,
    },
    widthTotal: {
        width: 105,
        flex: 0,
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
});