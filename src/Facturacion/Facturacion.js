import { useState, useEffect} from 'react';
import { StyleSheet, View, ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Surface, Text, Divider, Button, Portal, Dialog,
    TouchableRipple, SegmentedButtons, Modal, TextInput,
    ActivityIndicator,
    Icon
} from 'react-native-paper';

import {
    BLEPrinter, ColumnAlignment, COMMANDS
} from 'react-native-thermal-receipt-printer-image-qr';



import { useStore, apiClient } from '../store'


export default function Facturacion({ navigation, route }) {
    // States del programa
    const [cliente, setCliente] = useState('');
    const [itemsF, setItemsF] = useState([]);
    const [itemsC, setItemsC] = useState([]);
    const [fecha, setFecha] = useState("")
    const [factura, setFactura] = useState("")
    const [internet, setNoInternet] = useState(false);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState('0.00')
    const [precios, setPrecios] = useState([]);
    const [tipo, setTipo] = useState(1)
    const [duplicado, setDuplicado] = useState(true)
    const [visibleNC, setVisibleNC] = useState(false);
    const [usePrinter, setPrinter] = useState(useStore.getMap('usePrinter') || '')
    const [usePtoventa, setPtoventa] = useState(useStore.getString('usePtoventa'))

    const [useProd, setProd] = useState()
    const [useCli, setCli] = useState()
    const [NroFact, setNroFact] = useState('')
    const [visibleImprimir, setVisibleImprimir] = useState(false);
    const [preImprimir, setPreImprimir] = useState([]);

    // States de la Alerta
    const [visible, setVisible] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [texto, setTexto] = useState('');

    // States de Edición de Cantidad
    const [visibleEditCant, setVisibleEditCant] = useState(false);
    const [editItemIndex, setEditItemIndex] = useState(null);
    const [editItemCant, setEditItemCant] = useState('');
    const [editItemName, setEditItemName] = useState('');

    // Variables de Impresora
    const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON
    const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF
    const CENTER = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT
    const LEFT = COMMANDS.TEXT_FORMAT.TXT_ALIGN_LT
    const DOUBLE_WIDTH_ON = COMMANDS.TEXT_FORMAT.TXT_2WIDTH
    const NORMAL = COMMANDS.TEXT_FORMAT.TXT_NORMAL
    const DOUBLE_HEIGHT_ON = COMMANDS.TEXT_FORMAT.TXT_2HEIGHT
    const HR3_80MM = COMMANDS.HORIZONTAL_LINE.HR3_80MM

    let waitTime = 1
    BLEPrinter.init()


    const showModal = () => {
        setVisibleNC(true)
    };

    const hideModal = () => {
        if (NroFact) { setVisibleNC(false); }
    }

    const hideModalImprimir = () => {
        setVisibleImprimir(false);
        MetodoReiniciar();
    }

    const connectPrinter = async () => {
         try {
            if (usePrinter) {
                await BLEPrinter.closeConn()
                await new Promise(resolve => setTimeout(resolve, 1000)); 
                try{
                    BLEPrinter.connectPrinter(usePrinter.inner_mac_address)
                } catch (e) {
                    console.warn("Bluetooth connection error:", e)
                    return false
                }
                return true
            }
            return false
        }
        catch (e) {
            console.warn("Bluetooth connection error:", e)
            return false
        }
    }
    
    useEffect(() => {
        const Iniciar = async () => {
            try {
                if (usePrinter) {
                    //await connectPrinter();
                }
            } catch (err) {
                console.error("Error during setup:", err);
                setTitulo('Impresora desconectada')
                setTexto('Error al conectar con la impresora,\n¿Bluetooth activado?')
                setVisible(true)
            }
        }

        const Variables = async () => {
            setProd(await useStore.getArrayAsync('useProd') || '');
            setCli(await useStore.getStringAsync('useCli') || '');
            setDuplicado(await useStore.getBoolAsync('useDuplicado'));
        }
        Variables()
        Iniciar()
        connectPrinter()
    }, [])

    useEffect(() => {
        const auxiliar = async () => {
            setLoading(true)
            if (navigation && navigation.setParams) {
                navigation.setParams({ productos: [], cliente: [], cambios: [], tipo: '' });
            }
            await fetchDate();
            await fetchInvoice();
            setCliente('');
            setItemsF([]);
            setItemsC([]);
            setTotal('0.00');
            setNroFact('')
            setPreImprimir([])
            setLoading(false)
        }

        auxiliar()
    }, [tipo])


    useEffect(() => {
        if (!route.params) return;

        const conIVA = tipo != 99;

        // Procesar Productos (Venta)
        if (route.params.productos && route.params.productos.length > 0) {
            const nuevosProcesados = calcularItems(route.params.productos, conIVA);
            setItemsF(prev => [...prev, ...nuevosProcesados]);
            navigation.setParams({ productos: [] });
        }

        // Procesar Cambios
        if (route.params.cambios && route.params.cambios.length > 0) {
            const nuevosCambiosProcesados = calcularItems(route.params.cambios, conIVA);
            setItemsC(prev => [...prev, ...nuevosCambiosProcesados]);
            navigation.setParams({ cambios: [] });
        }

        // Procesar Cliente
        if (route.params.cliente && route.params.cliente.length !== 0) {
            setCliente(route.params.cliente);
            setListaPrecios();
            navigation.setParams({ cliente: [] });
        }
    }, [route.params]);

    // Función auxiliar para calcular precios sin mutar estado global directamente
    const calcularItems = (rawItems, conIVA) => {
        let arr = []
        rawItems.forEach(e => {
            precios.forEach(a => {
                if (a[0] === e[0]) {
                    if (conIVA) {
                        let preciu = (parseFloat(a[2]) / (1 + parseFloat(a[3]) / 100)).toFixed(6)
                        let itemTotal = (parseFloat(preciu) * Number(e[1])).toFixed(2)
                        arr.push([e[0], e[1], preciu, itemTotal, a[2]])
                    } else {
                        let itemTotal = (parseFloat(a[2]) * Number(e[1])).toFixed(2)
                        arr.push([e[0], e[1], a[2], itemTotal, a[2]])
                    }
                }
            })
        })
        return arr
    }
    
    useEffect(() => {
        let totF = 0.00;

        if (tipo != 99) {
            itemsF.forEach(e => {
                const precioConIVA = parseFloat(e[4] !== undefined ? e[4] : (parseFloat(e[2]) * 1.21));
                totF += precioConIVA * parseFloat(e[1]);
            });
            setTotal(totF.toFixed(2));
        } else {
            itemsF.forEach(e => {
                totF += parseFloat(e[3]);
            });
            setTotal(totF.toFixed(2));
        }
    }, [itemsF, tipo]);

    
    const setListaPrecios = () => {
        if (useProd) {
            let aux = useProd.filter(item => item.includes(route.params.cliente[6])).sort()
            setPrecios(aux)
        }
    }
   
    const handleDisable = () => {
        if (itemsC.length !== 0) {
            return false
        } else if (itemsF.length !== 0 && total !== '0.00') {
            return false
        } else {
            return true
        }
    }
    
    const BorrarItem = (index, tipo) => {
        if (tipo == '1') {
            setItemsF(prev => prev.filter((_, i) => i !== index));
        } else {
            setItemsC(prev => prev.filter((_, i) => i !== index));
        }
    };

    const editarCantidad = (index, nuevaCantidad) => {
        const cant = parseFloat(nuevaCantidad);
        if (isNaN(cant) || cant <= 0) return;
        
        setItemsF(prev => {
            const copy = [...prev];
            const item = copy[index];
            const unitPrice = parseFloat(item[2]);
            const nuevoTotal = (unitPrice * cant).toFixed(2);
            copy[index] = [item[0], cant.toString(), item[2], nuevoTotal, item[4]];
            return copy;
        });
    };

    const fetchDate = async () => {
        try {
            const e = await apiClient.get(`/getFecha`)
            setFecha(e.data)

            setNoInternet(false)
        }
        catch (error) {
            console.log(error)
            if (!visible) {
                if (error.response) {
                    // The server responded with a status code outside the 2xx range
                    setTitulo('Error desconocido')
                    setTexto(typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
                    setNoInternet(true)
                } else if (error.request) {
                    // The request was made but no response was received
                    setTitulo('No hay respuesta del servidor')
                    setTexto('Puede que el servidor no tenga internet, reintente.')
                    setNoInternet(true)
                } else {
                    // Something happened in setting up the request that triggered an error
                    setTitulo('Error desconocido')
                    setTexto('Error desconocido')
                    setNoInternet(true)
                }
                setVisible(true)
            }
        }
    }

    const fetchInvoice = async () => {
        try {
            const e = await apiClient.post(`/getLastVoucher`,
                {
                    tipo: tipo,
                    ptoventa: usePtoventa
                })
            
            if (e.data == null) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return await fetchInvoice();
            }
            
            setFactura(parseInt(e.data))
            setNoInternet(false)
        } catch (error) {
            if (!visible) {
                if (error.response) {
                    // The server responded with a status code outside the 2xx range
                    setTitulo('Error desconocido')
                    //setTexto(typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
                    console.log(typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
                    setNoInternet(true)
                } else if (error.request) {
                    // The request was made but no response was received
                    setTitulo('No hay respuesta del servidor')
                    setTexto('Puede ser que no este conectado el servidor o la ip haya cambiado')
                    setNoInternet(true)
                } else {
                    // Something happened in setting up the request that triggered an error
                    setTitulo('Error desconocido')
                    setTexto('Error desconocido')
                    setNoInternet(true)
                }
                setVisible(true)
            }
        }
    }

    const SeccionFactura = () => (
        <Surface style={styles.surfaceCard} elevation={2}>
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderTitle}>
                    <Icon source="receipt-text-outline" size={24} color="#663399" />
                    <Text variant="titleMedium" style={styles.cardTitle}>Comprobante</Text>
                </View>
                <Text variant="titleMedium" style={styles.facturaBadge}>A - {factura}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 4 }}>
                <SegmentedButtons
                    style={{ flex: 1 }}
                    value={tipo}
                    onValueChange={setTipo}
                    theme={{ colors: { secondaryContainer: '#f3e5f5' } }}
                    buttons={[
                        { value: 1, label: 'Fact.', icon: 'file-document-outline' },
                        { value: 3, label: 'N. C.', icon: 'file-undo-outline' },
                        { value: 99, label: 'Pres.', icon: 'file-hidden' }
                    ]}
                />
            </View>
            
            <View style={styles.infoRowContainer}>
                <View style={styles.infoBlock}>
                    <Text variant="bodySmall" style={styles.infoLabel}>FECHA</Text>
                    <Text variant="titleSmall" style={styles.infoValue}>{fecha}</Text>
                </View>
                <View style={styles.dividerVertical} />
                <View style={styles.infoBlockRight}>
                    {tipo == '3' ? (
                        <Text variant="bodySmall" style={styles.infoLabel}>TOTAL A DEVOLVER</Text>
                    ) : (
                        <Text variant="bodySmall" style={styles.infoLabel}>TOTAL A COBRAR</Text>
                    )}
                    <Text variant="titleLarge" style={styles.totalAmount}>$ {total}</Text>
                </View>
            </View>
        </Surface>
    )

    const DatosCliente = () => (
        <View style={styles.clienteInfoContainer}>
            <View style={styles.clienteAvatar}>
                <Icon source="account" size={32} color="#663399" />
            </View>
            <View style={styles.clienteTextContainer}>
                <Text variant="titleMedium" style={styles.clienteNombre}>{cliente[1]}</Text>
                <Text variant="bodyMedium" style={styles.clienteDoc}>CUIT: <Text style={{fontWeight: 'bold'}}>{cliente[0]}</Text></Text>
                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>Lista {cliente[6]}</Text>
                </View>
            </View>
        </View>
    )

    const SeccionCliente = () => (
        <Surface style={styles.surfaceCard} elevation={2}>
            <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderTitle}>
                    <Icon source="account-tie" size={24} color="#663399" />
                    <Text variant="titleMedium" style={styles.cardTitle}>Cliente</Text>
                </View>
                {cliente !== '' && (
                    <Button 
                        mode="text" 
                        compact 
                        onPress={MetodoReiniciar}
                        textColor="#F44336"
                        icon="close-circle-outline"
                    >
                        Quitar
                    </Button>
                )}
            </View>
            <Divider style={styles.dividerMinimal} />
            {cliente === '' ? 
                <View style={styles.emptyStateContainer}>
                    <Icon source="account-search-outline" size={48} color="#e0e0e0" />
                    <Text style={styles.emptyStateText}>Ningún cliente seleccionado</Text>
                    {loading ? (
                        <ActivityIndicator style={{ marginTop: 15 }} size={35} color="#663399" />
                    ) : (
                        <Button 
                            mode="contained-tonal" 
                            icon="account-search" 
                            disabled={internet} 
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('StackCliente')}
                        >
                            Buscar Cliente
                        </Button>
                    )}
                </View>
                : 
                <DatosCliente />
            }
        </Surface>
    )

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

    const GenerarFactura = async () => {
        try {
            if (itemsF.length === 0 && total === '0.00') {
                try {
                    let response = await apiClient.post(`cambio`, 
                        { itemsC: itemsC, cliente: cliente })
                    
                    if (response.data['error'] == null) {
                        setTitulo('¡Exito!')
                        setTexto('Cambios registrados correctamente!')
                        setVisible(true)
                        MetodoReiniciar();
                        return
                    } else
                        if (response.data['error'] == 'Cambios error') {
                            setTitulo('Error')
                            setTexto('Error al registrar los cambios, no seran contabilizados')
                            setVisible(true)
                            return
                    } else {
                        setTitulo('Error')
                        setTexto('Error interno del servidor, avisar a administracion')
                        setVisible(true)
                        return
                    }
                } catch (error) {
                    setTitulo('Error')
                    if (error.code === "ERR_NETWORK") {
                        setTexto('No se pudo conectar con el servidor, verifique su conexión a internet')
                    } else if (error.code === "ERR_BAD_RESPONSE") {
                        setTexto("Error interno del servidor\n" + error);
                    } else if (error.request) {
                        setTexto("No hubo respuesta del servidor");
                    }
                    setVisible(true)
                    return
                }
            } else {
                if (tipo === 3 && !NroFact) {                
                    showModal(true)
                    return
                }
                else if (tipo === 99) {
                    try {
                        let response = await apiClient.post(`presupuesto`, {
                            cliente: cliente,
                            N_Presu: factura,
                            PtoVta: usePtoventa,
                            Total: total,
                            items: itemsF,
                            itemsC: itemsC
                        })
                        if (response.data['error'] == null) {
                            setPreImprimir([tipo, usePtoventa,
                                String(factura), String(fecha), cliente, itemsF, total])
                            setVisibleImprimir(true)
                            return
                        }
                        else if (response.data['error'] == 'Duplicado') {
                            setTitulo('Error')
                            setTexto('El presupuesto ya existe, avisar a administracion')
                            setVisible(true)
                            return
                        } else {
                            setTitulo('Error')
                            setTexto('Error interno del servidor, avisar a administracion')
                            setVisible(true)
                            return
                        }
                    } catch (error) {
                        setTitulo('Error')
                        if (error.code === "ERR_NETWORK") {
                            setTexto('No se pudo conectar con el servidor, verifique su conexión a internet')
                        } else if (error.code === "ERR_BAD_RESPONSE") {
                            setTexto("Error interno del servidor\n" + error);
                        } else if (error.request) {
                            setTexto("No hubo respuesta del servidor");
                        }
                        setVisible(true)
                        return
                    }
                }
                else {
                    try {
                        let response = await apiClient.post(`facturacion`,
                            {
                                cliente: cliente,
                                total: total,
                                tipo: tipo,
                                NroFact: factura,
                                ptoventa: usePtoventa,
                                items: itemsF,
                                itemsC: itemsC,
                                NroFactD: NroFact
                        })
                        if (response.data['error'] == 'Exento error') {
                            setTitulo('Error en facturacion')
                            setTexto('No es posible hacer facturas B. Reintente con el cliente correcto.')
                            setVisible(true)
                            MetodoReiniciar();
                            return
                        }
                        else if (response.data['error'] == 'CAE error') {
                            setTitulo('Error')
                            setTexto('Error al generar al generar factura en AFIP, reintentar')
                            setVisible(true)
                            return
                        }
                        else if (response.data['error'] == 'BD error') {
                            setTitulo('Error')
                            setTexto('LA FACTURA FUE GENERADA, SI NO LA VE EN EL SISTEMA AVISAR A JUAN')
                            setVisible(true)
                            MetodoReiniciar();
                            return
                        }
                        else if (response.data['error'] == 'Error desconocido') {
                            setTitulo('Error')
                            setTexto('Error interno del servidor, avisar a administracion')
                            setVisible(true)
                            return
                        }
                        else {
                            setPreImprimir([tipo, usePtoventa,
                                String(factura), String(fecha), cliente, itemsF,
                                String(response.data['neto']), String(response.data['iva']),
                                response.data['qr_base64'], response.data['cae'], response.data['fecha_vto']])
                            setVisibleImprimir(true)
                            return
                        }
                    } catch (error) {
                        setTitulo('Error')
                        if (error.code === "ERR_NETWORK") {
                            setTexto('No se pudo conectar con el servidor, verifique su conexión a internet')
                        } else if (error.code === "ERR_BAD_RESPONSE") {
                            setTexto("Error interno del servidor\n" + error);
                        } else if (error.request) {
                            setTexto("No hubo respuesta del servidor");
                        }
                        setVisible(true)
                        return
                    }
                }
            }
        }
        catch (error) {
            setTitulo('Error')
            if (error.code === "ERR_NETWORK") {
                setTexto('No se pudo conectar con el servidor, verifique su conexión a internet')
            } else if (error.code === "ERR_BAD_RESPONSE") {
                setTexto("Error interno del servidor\n" + error);
            } else if (error.request) {
                setTexto("No hubo respuesta del servidor");
            }
            setVisible(true)
        }
    };

    const ModalImprimir = () => (
        <Portal>
            <Dialog 
                visible={visibleImprimir} 
                onDismiss={hideModalImprimir} 
                style={{ borderRadius: 28, backgroundColor: '#fff', overflow: 'hidden' }}
            >
                {/* Línea decorativa superior */}
                <View style={{ backgroundColor: '#663399', height: 6 }} />
                
                <View style={{ alignItems: 'center', marginTop: 30 }}>
                    <View style={{ 
                        backgroundColor: '#f3e5f5', 
                        width: 80, 
                        height: 80, 
                        borderRadius: 40, 
                        justifyContent: 'center', 
                        alignItems: 'center' 
                    }}>
                        <Icon source="check-circle" color="#4CAF50" size={50} />
                    </View>
                </View>
                
                <Dialog.Title style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 24, paddingVertical: 10 }}>
                    {(() => {
                        switch (tipo) {
                        case 1:
                            return '¡Venta Exitosa!';
                        case 3:
                            return '¡Nota de C. Emitida!';
                        case 99:
                            return '¡Presupuesto Emitido!';
                        default:
                            return '¡Acción Completada!';
                        }
                    })()}
                </Dialog.Title>
                
                <Dialog.Content>
                    <Text variant="bodyLarge" style={{ textAlign: 'center', color: '#555', lineHeight: 24 }}>
                        El comprobante ha sido generado correctamente.
                    </Text>
                    <Text variant="bodySmall" style={{ textAlign: 'center', color: '#555', lineHeight: 24 }}>
                        Recuerde estar cerca de la impresora, de otro modo la app se cerrará.
                    </Text>
                    <View style={{ height: 10 }} />
                </Dialog.Content>

                <Dialog.Actions style={{ 
                    flexDirection: 'column', 
                    paddingHorizontal: 20, 
                    paddingBottom: 25,
                    gap: 12
                }}>
                    <Button 
                        mode="contained" 
                        icon="printer"
                        onPress={handleImprimir}
                        style={{ width: '100%', borderRadius: 12, backgroundColor: '#663399' }}
                        contentStyle={{ height: 48 }}
                        labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                    >
                        IMPRIMIR AHORA
                    </Button>
                    <Button 
                        mode="outlined" 
                        onPress={() => {
                            hideModalImprimir();
                            MetodoReiniciar();
                        }}
                        style={{ width: '100%', borderRadius: 12, borderColor: '#663399' }}
                        textColor="#663399"
                        contentStyle={{ height: 48 }}
                    >
                        Continuar sin imprimir
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    )  
    
    const handleImprimir = async () => {
        try{
            if (preImprimir[0] == 99) {
                await ImprimirP(duplicado, preImprimir[1], preImprimir[2],
                preImprimir[3], preImprimir[4], preImprimir[5], preImprimir[6])
            } else {
                await Imprimir(preImprimir[0], preImprimir[1],
                preImprimir[2], preImprimir[3], preImprimir[4], preImprimir[5],
                preImprimir[6], preImprimir[7], preImprimir[8], preImprimir[9], preImprimir[10])
            }
            MetodoReiniciar();
        }catch (error) {
            console.log(error)
        }
        
    }
    
    const MetodoReiniciar = async () => {
        hideModalImprimir()
        setLoading(true);
        if (navigation && navigation.setParams) {
            navigation.setParams({ productos: [], cliente: '' , cambios: [], tipo: '' });
        }
        setCliente('');
        setItemsF([]);
        setItemsC([]);
        setTotal('0.00');
        setNroFact('')
        await fetchDate();
        await fetchInvoice();
        setPreImprimir([])
        setTipo(1)
        setLoading(false);
    }

    const asyncPrintText = async (text, waitTime) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                BLEPrinter.printText(text);
                resolve();
            }, waitTime * 50);
        })
    };

    const asyncPrintBill = (text, waitTime) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                BLEPrinter.printBill(text);
                resolve();
            }, waitTime * 50);
        });
    };

    const asyncPrintColumnsText = (
        columnHeader,
        columnWidth,
        columnAliment,
        columnStyle,
        waitTime,
    ) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                BLEPrinter.printColumnsText(
                    columnHeader,
                    columnWidth,
                    columnAliment,
                    columnStyle,
                );
                resolve();
            }, waitTime * 50);
        });
    };

    const asyncPrintQr = (text, waitTime) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                BLEPrinter.printImageBase64(text);
                resolve();
            }, waitTime * 50);
        });
    };

    const Imprimir = async (tipo, ptoVta, nroCmp, fecha, cliente, itemsF, neto, iva, qr, cae, caevto) => {
        let title = ''
        let tpp = tipo
        let ppt = String(ptoVta).padStart(4, '0')
        let pptcmt = String(nroCmp).padStart(8, '0')
        let duplicado = Number(cliente[9])

        
        if (tpp === 1) {
            title = 'Cod. 001 - FACTURA A'
        } else {
            title = 'Cod. 003 - NOTA DE CREDITO A'
            duplicado = 0
        }


        for (let i = 0; i <= duplicado; i++) {
            await Promise.all([
                asyncPrintText(`LA PRIMERA SA`, waitTime++),
                asyncPrintText('DIRECCION: PELLEGRINI 701', waitTime++),
                asyncPrintText('CUIT: 30-67020652-8', waitTime++),
                asyncPrintText('INICIO DE ACTIVIDADES: 22/12/1994', waitTime++),
                asyncPrintText('IVA RESPONSABLE INSCRIPTO', waitTime++),
                //SETEAR SI ES IMPRESORA DE 50 O 80MM
                asyncPrintText(
                    `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                asyncPrintText(`${CENTER}${BOLD_ON}${title}\n${BOLD_OFF}`, waitTime++),
                asyncPrintColumnsText(
                    [`Fecha: ${fecha}`, `Nro: ${ppt}-${pptcmt}`],
                    [23, 23],
                    [ColumnAlignment.LEFT, ColumnAlignment.RIGHT],
                    ['', ''],
                    waitTime++,
                ),
                asyncPrintText(
                    `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                asyncPrintText(`${LEFT}${cliente[1]}`, waitTime++),
                asyncPrintText(`CUIT Nro. ${cliente[0]}`, waitTime++),
                asyncPrintText(`IVA ${cliente[5]}`, waitTime++),
                asyncPrintText(`${cliente[4]}`, waitTime++),
                asyncPrintText(
                    `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                itemsF.forEach(e => {
                    let totalLength = 48
                    let spaces = totalLength - e[0].length - e[3].length;
                    let result = e[0] + ' '.repeat(spaces) + e[3];
                    asyncPrintText(`${LEFT}${e[1]} X ${e[2]}`, waitTime++),
                        asyncPrintText(result, waitTime++)
                }),
                asyncPrintText(
                    `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                asyncPrintText(`Subtotal: ${neto}`, waitTime++),
                asyncPrintText(`IVA 21%: ${iva}`, waitTime++),
                asyncPrintText(
                    `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR_80MM}`, waitTime++),
                asyncPrintColumnsText(
                    ['', 'TOTAL $', '', `${total}`],
                    [9, 9, 9, 9],
                    [ColumnAlignment.LEFT, ColumnAlignment.CENTER, ColumnAlignment.CENTER, ColumnAlignment.RIGHT],
                    ['', `${BOLD_ON}`, '', ''],
                    waitTime++,
                ),
                asyncPrintText(
                    `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR_80MM}`, waitTime++),
                asyncPrintQr(qr, waitTime++),
                asyncPrintBill(`${CENTER}CAE: ${cae}     CAE Vto: ${caevto}`, waitTime++)
            ]).catch(e => { console.log(e); });
        }
    }

    const ImprimirP = async (duplicado, ptoventa, factura, fecha, cliente, itemsF, total) => {
        let title = 'PRESUPUESTO X'
        let waitTime = 1
        const dd = duplicado ? 1 : 0
        

        for (let i = 0; i <= dd; i++) {
            await Promise.all([
            asyncPrintText(`${CENTER}${DOUBLE_WIDTH_ON}${DOUBLE_HEIGHT_ON}${BOLD_ON}${title}\n${BOLD_OFF}${NORMAL}`, waitTime++),
            asyncPrintText(`${CENTER}${fecha}`, waitTime++),
            asyncPrintText(`${CENTER}NRO. ${ptoventa} - ${factura}`, waitTime++),
            asyncPrintText(`${CENTER}${HR3_80MM}`, waitTime++),
            asyncPrintText(`${LEFT}${cliente[1]}`, waitTime++),
            asyncPrintText(`${LEFT}DOC. ${cliente[0]}`, waitTime++),
            asyncPrintText(
                `${CENTER}${HR3_80MM}`, waitTime++),
            itemsF.forEach(e => {
                let totalLength = 48
                let spaces = totalLength - e[0].length - e[3].length;
                let result = e[0] + ' '.repeat(spaces) + e[3];
                asyncPrintText(`${LEFT}${e[1]} X ${e[2]}`, waitTime++),
                    asyncPrintText(result, waitTime++)
            }),
            asyncPrintText(
                `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR_80MM}`, waitTime++),
            asyncPrintColumnsText(
                ['', 'TOTAL $', '', `${total}`],
                [9, 9, 9, 9],
                [ColumnAlignment.LEFT, ColumnAlignment.CENTER, ColumnAlignment.CENTER, ColumnAlignment.RIGHT],
                ['', `${BOLD_ON}${DOUBLE_WIDTH_ON}${DOUBLE_HEIGHT_ON}`, '', `${BOLD_ON}${DOUBLE_WIDTH_ON}${DOUBLE_HEIGHT_ON}`],
                waitTime++,
            ),
            asyncPrintBill('', waitTime++)
        ])
        }
    
    }
 
    const SeccionItems = () => (
        <Surface style={styles.surfaceCard} elevation={2}>
            <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderTitle}>
                    <Icon source="cart-outline" size={24} color="#663399" />
                    <Text variant="titleMedium" style={styles.cardTitle}>Items ({itemsF.length})</Text>
                </View>
            </View>
            <Divider style={styles.dividerMinimal} />
            
            {itemsF.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <Icon source="basket-off-outline" size={48} color="#e0e0e0" />
                    <Text style={styles.emptyStateText}>No hay productos en el carrito</Text>
                    <Button
                        disabled={cliente === ''}
                        icon="plus-circle-outline" 
                        mode="contained-tonal"
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('StackProducto', {
                            lista: cliente[6],
                            productos: itemsF,
                            tipo: 1
                        })}
                    >
                        Agregar Producto
                    </Button>
                </View>
            ) : (
                <TableItemsF />
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <Button
                    disabled={handleDisable()}
                    icon='check-decagram'
                    mode='contained'
                    buttonColor={(handleDisable()) ? '#e0e0e0' : '#4CAF50'}
                    textColor='white'
                    style={{ flex: 2, borderRadius: 12, elevation: 2 }}
                    contentStyle={{ height: 48 }}
                    labelStyle={{ fontWeight: 'bold' }}
                    onPress={GenerarFactura}
                >
                    Generar
                </Button>
            </View>
        </Surface>
    )

    const SeccionCambios = () => (
        <Surface style={styles.surfaceCard} elevation={2}>
            <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderTitle}>
                    <Icon source="swap-horizontal" size={24} color="#663399" />
                    <Text variant="titleMedium" style={styles.cardTitle}>Cambios ({itemsC.length})</Text>
                </View>
            </View>
            <Divider style={styles.dividerMinimal} />
            
            {itemsC.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <Icon source="close-outline" size={48} color="#e0e0e0" />
                    <Text style={styles.emptyStateText}>No hay Cambios </Text>
                    <Button
                        disabled={cliente === '' || tipo === 3}
                        icon="plus-circle-outline" 
                        mode="contained-tonal"
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('StackProducto', {
                            lista: cliente[6],
                            productos: itemsC,
                            tipo: 2
                        })}
                    >
                        Agregar Cambios
                    </Button>
                </View>
            ) : (
                <TableItemsC />
            )}
        </Surface>
    )

    const renderModalNC = () => {
        const isValid = NroFact && NroFact.trim().length > 0;
        
        return (
            <Portal>
                <Dialog 
                    visible={visibleNC} 
                    onDismiss={hideModal} 
                    style={{ borderRadius: 28, backgroundColor: '#fff', overflow: 'hidden' }}
                    dismissable={false}
                >
                    {/* Línea decorativa superior */}
                    <View style={{ backgroundColor: '#663399', height: 6 }} />
                    
                    <View style={{ alignItems: 'center', marginTop: 24 }}>
                        <View style={{ 
                            backgroundColor: '#f3e5f5', 
                            width: 72, 
                            height: 72, 
                            borderRadius: 36, 
                            justifyContent: 'center', 
                            alignItems: 'center' 
                        }}>
                            <Icon source="file-document-edit-outline" color="#663399" size={40} />
                        </View>
                    </View>

                    <Dialog.Title style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 22, paddingTop: 16 }}>
                        Referencia de Factura
                    </Dialog.Title>

                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#666', marginBottom: 24, paddingHorizontal: 10 }}>
                            Para emitir una Nota de Crédito, es necesario referenciar la factura original.
                        </Text>
                        <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#666', marginBottom: 24, paddingHorizontal: 10 }}>
                            INGRESAR EL NUMERO DE FACTURA SIN CEROS
                        </Text>
                        <View style={{ gap: 16 }}>
                            <TextInput
                                mode="outlined"
                                label="Número de Factura"
                                placeholder="Ej: 6123"
                                value={NroFact}
                                keyboardType='numeric'
                                onChangeText={setNroFact}
                                autoFocus={true}
                                outlineColor="#e0e0e0"
                                activeOutlineColor="#663399"
                                left={<TextInput.Icon icon="receipt" color="#663399" />}
                                style={{ backgroundColor: '#fff' }}
                            />
                            
                            <TextInput
                                mode="outlined"
                                label="CUIT del Cliente"
                                value={cliente ? cliente[0] : ''}
                                editable={false}
                                outlineColor="#e0e0e0"
                                activeOutlineColor="#663399"
                                left={<TextInput.Icon icon="card-account-details-outline" color="#663399" />}
                                style={{ backgroundColor: '#f5f5f5' }}
                            />
                        </View>
                    </Dialog.Content>

                    <Dialog.Actions style={{ flexDirection: 'column', paddingHorizontal: 20, paddingBottom: 25 }}>
                        <Button 
                            mode="contained" 
                            onPress={hideModal}
                            disabled={!isValid}
                            style={{ width: '100%', borderRadius: 12, backgroundColor: isValid ? '#663399' : '#e0e0e0' }}
                            contentStyle={{ height: 48 }}
                            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                        >
                            Confirmar y Cerrar
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        );
    }

    const renderModalEditCant = () => {
        const isValid = editItemCant && editItemCant.trim().length > 0 && !isNaN(parseFloat(editItemCant)) && parseFloat(editItemCant) > 0;
        
        const handleConfirm = () => {
            if (isValid && editItemIndex !== null) {
                editarCantidad(editItemIndex, editItemCant);
                setVisibleEditCant(false);
            }
        };

        return (
            <Portal>
                <Dialog 
                    visible={visibleEditCant} 
                    onDismiss={() => setVisibleEditCant(false)} 
                    style={{ borderRadius: 28, backgroundColor: '#fff', overflow: 'hidden' }}
                >
                    {/* Línea decorativa superior */}
                    <View style={{ backgroundColor: '#663399', height: 6 }} />
                    
                    <View style={{ alignItems: 'center', marginTop: 24 }}>
                        <View style={{ 
                            backgroundColor: '#f3e5f5', 
                            width: 72, 
                            height: 72, 
                            borderRadius: 36, 
                            justifyContent: 'center', 
                            alignItems: 'center' 
                        }}>
                            <Icon source="pencil-outline" color="#663399" size={40} />
                        </View>
                    </View>

                    <Dialog.Title style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 22, paddingTop: 16 }}>
                        Modificar Cantidad
                    </Dialog.Title>

                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#666', marginBottom: 24, paddingHorizontal: 10 }}>
                            {editItemName}
                        </Text>
                        <View style={{ gap: 16 }}>
                            <TextInput
                                mode="outlined"
                                label="Cantidad"
                                placeholder="Ej: 5"
                                value={editItemCant}
                                keyboardType='numeric'
                                onChangeText={setEditItemCant}
                                autoFocus={true}
                                outlineColor="#e0e0e0"
                                activeOutlineColor="#663399"
                                left={<TextInput.Icon icon="numeric" color="#663399" />}
                                style={{ backgroundColor: '#fff' }}
                            />
                        </View>
                    </Dialog.Content>

                    <Dialog.Actions style={{ flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 25, gap: 12 }}>
                        <Button 
                            mode="outlined" 
                            onPress={() => setVisibleEditCant(false)}
                            style={{ flex: 1, borderRadius: 12, borderColor: '#663399' }}
                            textColor="#663399"
                            contentStyle={{ height: 48 }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            mode="contained" 
                            onPress={handleConfirm}
                            disabled={!isValid}
                            style={{ flex: 1, borderRadius: 12, backgroundColor: isValid ? '#663399' : '#e0e0e0' }}
                            contentStyle={{ height: 48 }}
                            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                        >
                            Confirmar
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        );
    }

    const TableItemsF = () => {
        const renderItem = ({ item, index }) => (
            <View style={styles.itemRowModern}>
                <View style={styles.itemContentModern}>
                    <TouchableRipple
                        onLongPress={() => {
                            setEditItemIndex(index);
                            setEditItemCant(item[1].toString());
                            setEditItemName(item[0]);
                            setVisibleEditCant(true);
                        }}
                        style={{ flex: 1 }}
                        rippleColor="rgba(102, 51, 153, 0.1)"
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.itemQuantityBadge}>
                                <Text style={styles.itemQuantityText}>{item[1]}</Text>
                            </View>
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemProductoModern} numberOfLines={2}>{item[0]}</Text>
                            </View>
                        </View>
                    </TouchableRipple>
                    <TouchableRipple 
                        onPress={() => BorrarItem(index, '1')}
                        style={styles.itemActions}
                        rippleColor="rgba(244, 67, 54, 0.2)"
                    >
                        <Icon source="delete-empty-outline" color="#F44336" size={22} />
                    </TouchableRipple>
                </View>
            </View>
        );

        return (
            <View style={styles.itemsContainer}>
                {itemsF.map((item, index) => (
                        <View key={index.toString()} style={{ marginBottom: 10 }}>
                            {renderItem({ item, index })}
                        </View>
                    ))}
                
                <Button
                    mode="outlined"
                    icon="plus"
                    style={styles.addMoreButton}
                    textColor="#663399"
                    onPress={() =>
                        navigation.navigate('StackProducto', {
                            lista: cliente[6],
                            productos: itemsF,
                            tipo: '1'
                        })
                    }
                >
                    Agregar más productos
                </Button>
            </View>
        );
    };

    const TableItemsC = () => {
        const renderItem = ({ item, index }) => (
            <TouchableRipple
                onLongPress={() => BorrarItem(index, '2')}
                style={styles.itemRowModern}
                rippleColor="rgba(102, 51, 153, 0.1)"
            >
                <View style={styles.itemContentModern}>
                    <View style={styles.itemQuantityBadge}>
                        <Text style={styles.itemQuantityText}>{item[1]}</Text>
                    </View>
                    <View style={styles.itemDetails}>
                        <Text style={styles.itemProductoModern} numberOfLines={2}>{item[0]}</Text>
                    </View>
                    <View style={styles.itemActions}>
                        <Icon source="delete-empty-outline" color="#9e9e9e" size={22} />
                    </View>
                </View>
            </TouchableRipple>
        );

        return (
            <View style={styles.itemsContainer}>
                {itemsC.map((item, index) => (
                        <View key={index.toString()} style={{ marginBottom: 10 }}>
                            {renderItem({ item, index })}
                        </View>
                    ))}
                
                <Button
                    mode="outlined"
                    icon="plus"
                    style={styles.addMoreButton}
                    textColor="#663399"
                    onPress={() =>
                        navigation.navigate('StackProducto', {
                            lista: cliente[6],
                            productos: itemsC,
                            tipo: '2'
                        })
                    }
                >
                    Agregar más cambios
                </Button>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
            <ScrollView style={{ backgroundColor: '#f2f2f2' }} contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 4 }}>
                <SeccionFactura />
                <SeccionCliente />
                <SeccionItems />
                <SeccionCambios />
            </ScrollView>
            <Alerta></Alerta>
            {renderModalNC()}
            {renderModalEditCant()}
            <ModalImprimir></ModalImprimir>
        </SafeAreaView>
    )
}



const styles = StyleSheet.create({
    surfaceCard: {
        borderRadius: 16,
        marginHorizontal: 12,
        marginTop: 16,
        padding: 16,
        backgroundColor: '#ffffff',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardHeaderTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardTitle: {
        fontWeight: 'bold',
        color: '#333',
    },
    facturaBadge: {
        fontWeight: 'bold',
        color: '#663399',
        backgroundColor: '#f3e5f5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    infoRowContainer: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    infoBlock: {
        flex: 1,
    },
    infoBlockRight: {
        flex: 2,
        alignItems: 'flex-end',
    },
    infoLabel: {
        color: '#888',
        fontWeight: 'bold',
        marginBottom: 4,
        fontSize: 11,
    },
    infoValue: {
        color: '#333',
        fontWeight: '600',
    },
    dividerVertical: {
        width: 1,
        height: '80%',
        backgroundColor: '#e0e0e0',
        marginHorizontal: 12,
    },
    totalAmount: {
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    dividerMinimal: {
        marginVertical: 12,
        backgroundColor: '#f0f0f0',
        height: 1,
    },
    emptyStateContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyStateText: {
        color: '#9e9e9e',
        marginTop: 8,
        marginBottom: 16,
        fontSize: 14,
    },
    actionButton: {
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    clienteInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 12,
        marginTop: 4,
    },
    clienteAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f3e5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    clienteTextContainer: {
        flex: 1,
    },
    clienteNombre: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    clienteDoc: {
        color: '#666',
        marginBottom: 4,
    },
    badgeContainer: {
        alignSelf: 'flex-start',
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 12,
        color: '#1976d2',
        fontWeight: 'bold',
    },
    itemsContainer: {
        marginTop: 8,
    },
    itemRowModern: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    itemContentModern: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemQuantityBadge: {
        backgroundColor: '#e0e0e0',
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemQuantityText: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 16,
    },
    itemDetails: {
        flex: 1,
    },
    itemProductoModern: {
        fontSize: 15,
        color: '#444',
        fontWeight: '500',
    },
    itemActions: {
        marginLeft: 8,
        padding: 4,
    },
    addMoreButton: {
        marginTop: 8,
        borderRadius: 8,
        borderStyle: 'dashed',
    },
});
