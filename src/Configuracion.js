import { useState, useEffect, useCallback} from 'react';
import { StyleSheet, View, PermissionsAndroid, Platform, ScrollView } from 'react-native';
import {
    Text, Button, Portal, Dialog,
    List, SegmentedButtons,
    TextInput,
    Divider, RadioButton, IconButton, Surface, TouchableRipple, Icon, Checkbox
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    BLEPrinter, ColumnAlignment, COMMANDS
} from 'react-native-thermal-receipt-printer-image-qr';
import { useFocusEffect } from '@react-navigation/native';

import { useStore, apiClient, changeBaseURL } from './store'



const InputFactura = ({ value, onchange }) => {
    const [currentvalue, setcurrentvalue] = useState(value);
    useEffect(() => { setcurrentvalue(value); }, [value]);
    return (
        <TextInput
            style={{ height: 48 }}
            mode="outlined"
            value={currentvalue}
            keyboardType='numeric'
            outlineColor="#e0e0e0"
            activeOutlineColor="#663399"
            placeholder="Nro Factura"
            onChangeText={v => {
                setcurrentvalue(v);
                onchange(v);
            }}
        />
    );
};

const InputIp = ({ value, onchange }) => {
    const [currentvalue1, setcurrentvalue1] = useState(value);
    useEffect(() => { setcurrentvalue1(value); }, [value]);

    return (
        <TextInput
            label="Dirección IP del Servidor"
            mode="outlined"
            keyboardType='numeric'
            outlineColor="#e0e0e0"
            activeOutlineColor="#663399"
            left={<TextInput.Icon icon="ip-network" color="#663399" />}
            onChangeText={v => {
                setcurrentvalue1(v);
                onchange(v);
            }}
            value={currentvalue1}
        />
    )
}

const InputPtoVenta = ({ value, onchange }) => {
    const [currentvalue, setcurrentvalue] = useState(value);
    useEffect(() => { setcurrentvalue(value); }, [value]);

    return <TextInput
        label="Punto de Venta"
        mode="outlined"
        keyboardType='numeric'
        outlineColor="#e0e0e0"
        activeOutlineColor="#663399"
        left={<TextInput.Icon icon="store-marker" color="#663399" />}
        onChangeText={v => {
            setcurrentvalue(v);
            onchange(v);
        }}
        value={currentvalue}
    />
}

export default function Configuracion({ navigation, route }) {
    const [value, setValue] = useState('Printer');
    const [poolPrinters, setPoolPrinters] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [radioSelect, setRadioSelect] = useState(1);
    const [Retext, setRetext] = useState('')

    //const [chkImp, setChkImp] = useState()
    const [usePrinter, setPrinter] = useState()
    const [useIp, setIp] = useState()
    const [usePtoventa, setPtoventa] = useState()

    const [useLista, setLista] = useState([])
    const [useOpc, setOpc] = useState("Seleccione una lista")
    const [duplicado, setDuplicado] = useState(true)

    // Status de conexión
    const [statusConexion, setStatusConexion] = useState('Login..');

    // Variables de Impresora
    // Variables de Impresora
    const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON
    const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF
    const CENTER = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT
    const LEFT = COMMANDS.TEXT_FORMAT.TXT_ALIGN_LT
    const DOUBLE_WIDTH_ON = COMMANDS.TEXT_FORMAT.TXT_2WIDTH
    const NORMAL = COMMANDS.TEXT_FORMAT.TXT_NORMAL
    const DOUBLE_HEIGHT_ON = COMMANDS.TEXT_FORMAT.TXT_2HEIGHT
    const HR3_80MM = COMMANDS.HORIZONTAL_LINE.HR3_80MM
    let waitTime = 0.5

    // Variables de Alerta
    const [titulo, setTitulo] = useState('');
    const [texto, setTexto] = useState('');
    const [visible, setVisible] = useState(false);

    const handlePress = () => {
        setExpanded(!expanded);
    }

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

    useEffect(() => {
        const Permisos = async () => {
            try {
                if (Platform.Version >= 31) {
                    const granted = await PermissionsAndroid.requestMultiple([
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    ]);

                    return (
                        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
                    );
                } else {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                    );
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                }
            } catch (err) {
                console.warn(err);
                return false;
            }
        };
        
        const ListarPrinters = async () => {
        try {
            await BLEPrinter.init()
            setPoolPrinters(await BLEPrinter.getDeviceList())
        } catch (e) {
            console.log(e)
        }
    }
    const Variables = async () => {
        //setChkImp(await useStore.getBoolAsync('chkImp'));
        setDuplicado(await useStore.getBoolAsync('useDuplicado') || '');
        setPrinter(await useStore.getMapAsync('usePrinter') || '');
        setIp(await useStore.getStringAsync('useIp') || '');
        setPtoventa(await useStore.getStringAsync('usePtoventa') || '');
        setLista(await useStore.getArrayAsync('useList') || []);
        //setProd(await useStore.getStringAsync('useProd') || '');
        //setCli(await useStore.getStringAsync('useCli') || '');
    }
    
    Permisos()
    Variables()
    ListarPrinters()
}, [])




const VerificarConexion = async () => {
    setStatusConexion('Login..');
    try {
        await apiClient.get('getFecha', { timeout: 2000 });
        setStatusConexion('Online');
    } catch (error) {
        if (error.response) {
            setStatusConexion('Online');
        } else {
            setStatusConexion('Offline');
        }
    }   
}

useFocusEffect(
    useCallback(() => {
        VerificarConexion();
    }, [])
);

const Closeconnect = async () => {
    await BLEPrinter.closeConn()
    //await useStore.setBoolAsync('ChkImp', false)
    //setChkImp(false)
}

const connectPrinter = async () => {
    try {
        if (usePrinter) {
            await BLEPrinter.closeConn()
            await BLEPrinter.connectPrinter(usePrinter.inner_mac_address)
            await asyncPrintText(``, waitTime++)
            return true
        }
        return false
    }
    catch (e) {
        console.warn(e)
        return false
    }
}

const SyncClientes = async () => {
    try {
        const response = await apiClient.get(`/buscarCliente`)
        if (response.data.error === null) {
            await useStore.setArrayAsync('useCli', response.data.arr);
            setTitulo('¡Exito!')
            setTexto('Se sincronizó correctamente')
        } else {
            setTitulo('Error')
            setTexto(response.data.error)
        }
    } catch (error) {
        console.log(error)
        setTitulo('Error')
        if (error.code === "ERR_NETWORK") {
            setTexto('No se pudo conectar con el servidor, verifique su conexión a internet')
        } else if (error.code === "ERR_BAD_RESPONSE") {
            setTexto("Error interno del servidor\n" + error);
        } else if (error.request) {
            setTexto("No hubo respuesta del servidor");
        }
    }
    setVisible(true)
}

const SyncProductos = async () => {
    try {
        const response = await apiClient.get(`/buscarProductos`)
        if (response.data.error === null) {
            await useStore.setArrayAsync('useProd', response.data.arr);

            const valoresUnicos = [...new Set(response.data.arr.map(subArray => subArray[1]))];
            await useStore.setArrayAsync('useList', valoresUnicos);
            setTitulo('¡Exito!')
            setTexto('Se sincronizó correctamente')
        } else {
            setTitulo('Error')
            setTexto(response.data.error)
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
    }
    setVisible(true)
}

const Guardar = async () => {
    try {
        await useStore.setStringAsync('useIp', useIp);
        await useStore.setStringAsync('usePtoventa', usePtoventa);
        await changeBaseURL()
        VerificarConexion();
        setTitulo('¡Exito!')
        setTexto('Se guardó correctamente')

    } catch (e) {
        setTitulo('Error')
        setTexto('Error interno: ' + String(e))
    }
    setVisible(true)
}

const handleDuplicado = async (e) => {
    setDuplicado(e)
    await useStore.setBoolAsync('useDuplicado', e)
}

const Reimprimir = async (num = null) => {
    if (await connectPrinter()) {
        try {
            let aux = num || Retext
            if (radioSelect === 99) {
                let response = await apiClient.post(`/reImprimirPres`,
                {
                    nro: String(aux),
                    pto: usePtoventa,
                    tipo: radioSelect
                })
                if (response.data.error !== 'Vacio') {
                    let arrC = response.data[0]
                    let arrP = response.data[1]
                    let arrF = response.data[2]

                    await Promise.all([
                        asyncPrintText(`${CENTER}${DOUBLE_WIDTH_ON}${DOUBLE_HEIGHT_ON}${BOLD_ON}${'PRESUPUESTO X'}\n${BOLD_OFF}${NORMAL}`, waitTime++),
                        asyncPrintText(`${CENTER}${arrF[0]}`, waitTime++),
                        asyncPrintText(`${CENTER}NRO. ${usePtoventa} - ${arrF[1]}`, waitTime++),
                        asyncPrintText(`${CENTER}${HR3_80MM}`, waitTime++),
                        asyncPrintText(`${LEFT}${arrC[0]}`, waitTime++),
                        asyncPrintText(`${LEFT}${arrC[1]}`, waitTime++),
                        asyncPrintText(
                            `${CENTER}${HR3_80MM}`, waitTime++),
                        arrP.forEach(e => {
                            let totalLength = 48
                            let spaces = totalLength - e[0].length - e[3].length;
                            let result = e[0] + ' '.repeat(spaces) + e[3];
                            asyncPrintText(`${LEFT}${e[1]} X ${e[2]}`, waitTime++),
                                asyncPrintText(result, waitTime++)
                        }),
                        asyncPrintText(
                            `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR_80MM}`, waitTime++),
                        asyncPrintColumnsText(
                            ['', 'TOTAL $', '', `${arrF[2]}`],
                            [9, 9, 9, 9],
                            [ColumnAlignment.LEFT, ColumnAlignment.CENTER, ColumnAlignment.CENTER, ColumnAlignment.RIGHT],
                            ['', `${BOLD_ON}${DOUBLE_WIDTH_ON}${DOUBLE_HEIGHT_ON}`, '', `${BOLD_ON}${DOUBLE_WIDTH_ON}${DOUBLE_HEIGHT_ON}`],
                            waitTime++,
                        ),
                        asyncPrintBill('', waitTime++)
                    ])
                    setRetext('')
                } else {
                    setTitulo('Error')
                    setTexto('No se encontró el presupuesto')
                    setVisible(true)
                }
            } else {
                let response = await apiClient.post(`/reImprimir`,
                {
                    nro: String(aux),
                    pto: usePtoventa,
                    tipo: radioSelect
                })
                if (response.data.error !== 'Vacio') {
                    let arrC = response.data[0]
                    let arrP = response.data[1]
                    let arrF = response.data[2]
                
                    let title = ''
                    if (radioSelect === 1) {
                        title = 'Cod. 001 - FACTURA A'
                    } else {
                        title = 'Cod. 003 - NOTA DE CREDITO A'
                    }

                    Promise.all([
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
                            [`Fecha: ${arrF[0]}`, `Nro: ${arrF[1]}`],
                            [23, 23],
                            [ColumnAlignment.LEFT, ColumnAlignment.RIGHT],
                            ['', ''],
                            waitTime++,
                        ),
                        asyncPrintText(
                            `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                        asyncPrintText(`${LEFT}${arrC[0]}`, waitTime++),
                        asyncPrintText(`CUIT Nro. ${arrC[1]}`, waitTime++),
                        asyncPrintText(`IVA ${arrC[3]}`, waitTime++),
                        asyncPrintText(`${arrC[2]}`, waitTime++),
                        asyncPrintText(
                            `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                        arrP.forEach(e => {
                            let totalLength = 48
                            let spaces = totalLength - e[0].length - e[3].length;
                            let result = e[0] + ' '.repeat(spaces) + e[3];
                            asyncPrintText(`${LEFT}${e[1]} X ${e[2]}`, waitTime++),
                                asyncPrintText(result, waitTime++)
                        }),
                        asyncPrintText(
                            `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                        asyncPrintText(`Subtotal: ${arrF[2]}`, waitTime++),
                        asyncPrintText(`IVA 21%: ${arrF[3]}`, waitTime++),
                        asyncPrintText(
                            `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR_80MM}`, waitTime++),
                        asyncPrintColumnsText(
                            ['', 'TOTAL $', '', `${arrF[4]}`],
                            [9, 9, 9, 9],
                            [ColumnAlignment.LEFT, ColumnAlignment.CENTER, ColumnAlignment.CENTER, ColumnAlignment.RIGHT],
                            ['', `${BOLD_ON}`, '', ''],
                            waitTime++,
                        ),
                        asyncPrintText(
                            `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR_80MM}`, waitTime++),
                        asyncPrintQr(arrF[7], waitTime++),
                        asyncPrintBill(`${CENTER}CAE: ${arrF[5]}     CAE Vto: ${arrF[6]}`, waitTime++)
                    ])
                    setRetext('')
                } else {
                    setTitulo('Comprobante inexistente')
                    setTexto('El comprobante no existe')
                }
            }
        }
        catch (error) {
            if (!visible) {
                if (error.request) {
                    // The request was made but no response was received
                    setTitulo('No hay respuesta del servidor')
                    setTexto('Puede ser que no este conectado el servidor o la ip haya cambiado')
                } else {
                    // Something happened in setting up the request that triggered an error
                    setTitulo('Error desconocido')
                    setTexto(String(error))
                }
                setVisible(true)
            }
        }
    } else {
        setTitulo('Error')
        setTexto('No se pudo imprimir, trate de volver a conectar la impresora')
        setVisible(true)
    }
}

const UltimoFactura = async () => {
    try {            
        const e = await apiClient.post(`/getLastVoucher`,
                {
                    tipo: radioSelect,
                    ptoventa: usePtoventa
                })
        Reimprimir(parseInt(e.data) - 1)
    } catch (error) {
        console.log(error)
    }
}

const ListaPrecios = async (aux) => {
    try {
        const response = await apiClient.post(`/listaPrecios`, {lista: aux })
        
        if (response.data.error === null) {
            let arr = response.data.arr
            let waitTime = 1
            
            Promise.all([
                asyncPrintText(`${CENTER}${BOLD_ON}LISTA DE PRECIOS - ${aux}${BOLD_OFF}`, waitTime++),
                asyncPrintText(`${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                arr.forEach(e => {
                    let totalLength = 48
                    let spaces = totalLength - e[0].length - e[1].length;
                    let result = e[0] + ' '.repeat(spaces) + e[1];
                    asyncPrintText(result, waitTime++)
                }),
                asyncPrintBill(`${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
            ])
        } else {
            setTitulo('Error')
            setTexto('Error interno.')
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


function Impresora() {
    return (
        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            <Surface style={styles.sectionSurface} elevation={1}>
                <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Icon source="printer-wireless" size={24} color="#663399" />
                        <Text variant="titleMedium" style={styles.sectionTitle}>Ajustes de Impresora</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text variant="labelSmall" style={{ color: '#663399' }}>Duplicado</Text>
                        <Checkbox
                            status={duplicado ? 'checked' : 'unchecked'}
                            onPress={() => handleDuplicado(!duplicado)}
                            color="#663399"
                        />
                    </View>
                </View>
                
                <View style={styles.printerRow}>
                    <View style={{ flex: 1 }}>
                        <List.Accordion
                            title={usePrinter ? usePrinter.device_name : 'No seleccionada'}
                            titleStyle={{ color: usePrinter ? '#663399' : '#757575', fontWeight: '500' }}
                            left={props => <List.Icon {...props} icon="bluetooth" color="#663399" />}
                            expanded={expanded}
                            onPress={handlePress}>
                            {
                                poolPrinters.map(printer => (
                                    <List.Item key={printer.inner_mac_address}
                                        title={printer.device_name}
                                        description={printer.inner_mac_address}
                                        onPress={() => {
                                            setPrinter(printer)
                                            useStore.setMap('usePrinter', printer);
                                            setExpanded(false)
                                        }} />
                                ))
                            }
                        </List.Accordion>
                    </View>
                    <View style={styles.printerActions}>
                        <IconButton
                            icon="check-bold"
                            mode="contained"
                            containerColor="#f3e5f5"
                            iconColor="#663399"
                            size={20}
                            onPress={connectPrinter}
                        />
                        <IconButton
                            icon="close"
                            mode="contained"
                            containerColor="#ffebee"
                            iconColor="#c62828"
                            size={20}
                            onPress={Closeconnect}
                        />
                    </View>
                </View>

                <Divider style={{ marginVertical: 16 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="labelLarge">Reimprimir Facturas</Text>
                    <Button disabled={radioSelect === 99} onPress={UltimoFactura}>Imprimir ultimo</Button>
                </View>
                
                <SegmentedButtons
                    value={radioSelect}
                    onValueChange={setRadioSelect}
                    style={{ marginBottom: 20 }}
                    theme={{ colors: { secondaryContainer: '#f3e5f5' } }}
                    buttons={[
                        {
                            value: 1,
                            label: 'Factura A',
                            icon: 'file-document-outline',
                        },
                        {
                            value: 3,
                            label: 'Nota Cred. A',
                            icon: 'file-undo-outline',
                        },
                        {
                            value: 99,
                            label: 'Presup.',
                            icon: 'file-hidden',
                        },
                    ]}
                />
                
                <View style={styles.inputActionRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <InputFactura
                            value={Retext}
                            onchange={(e) => setRetext(e)}
                        />
                    </View>
                    <Button
                        mode="contained"
                        icon="printer"
                        onPress={() => Reimprimir(Retext)}
                        style={{ borderRadius: 8, height: 48, justifyContent: 'center' }}
                        buttonColor="#663399"
                    >
                        LISTO
                    </Button>
                </View>
            </Surface>

            <Surface style={[styles.sectionSurface, { marginTop: 16 }]} elevation={1}>
                <View style={styles.sectionHeader}>
                    <Icon source="format-list-bulleted" size={24} color="#663399" />
                    <Text variant="titleMedium" style={styles.sectionTitle}>Listado de Precios</Text>
                </View>
                
                <View style={styles.printerRow}>
                    <View style={{ flex: 1 }}>
                        <List.Accordion
                            title={useOpc}
                            titleStyle={{ fontWeight: '500' }}
                            left={props => <List.Icon {...props} icon="file-document-outline" color="#663399" />}>
                            {
                                useLista.map((rowData, index) => (
                                    <List.Item 
                                        key={index}
                                        title={rowData}
                                        onPress={() => { setOpc(rowData) }} 
                                    />
                                ))
                            }
                        </List.Accordion>
                    </View>
                    <IconButton
                        icon="printer"
                        mode="contained"
                        containerColor="#f3e5f5"
                        iconColor="#663399"
                        size={24}
                        onPress={() => ListaPrecios(useOpc)}
                        style={{ marginLeft: 8 }}
                    />
                </View>
            </Surface>
        </View>
    )
}

function Sync() {
    return (
        <View style={{ padding: 16 }}>
            <Surface style={styles.sectionSurface} elevation={1}>
                <View style={styles.sectionHeader}>
                    <Icon source="cloud-sync" size={24} color="#663399" />
                    <Text variant="titleMedium" style={styles.sectionTitle}>Sincronización de Datos</Text>
                </View>
                <Text variant="bodySmall" style={{ color: '#757575', marginBottom: 20, textAlign: 'center' }}>
                    Actualice la base de datos local con el servidor
                </Text>
                <View style={{ gap: 12, alignItems: 'center' }}>
                    <Button
                        style={styles.syncBtn}
                        icon="account-group" mode="outlined"
                        onPress={SyncClientes}
                        textColor="#663399"
                    >
                        Sincronizar Clientes
                    </Button>
                    <Button
                        style={styles.syncBtn}
                        icon="package-variant-closed" mode="outlined"
                        onPress={SyncProductos}
                        textColor="#663399"
                    >
                        Sincronizar Productos
                    </Button>
                </View>
            </Surface>
        </View>
    )
}

function Config() {
    return (
        <View style={{ padding: 16 }}>
            <Surface style={styles.sectionSurface} elevation={1}>
                <View style={styles.sectionHeader}>
                    <Icon source="server-network" size={24} color="#663399" />
                    <Text variant="titleMedium" style={styles.sectionTitle}>Conexión al Servidor</Text>
                    <View style={[styles.statusBadge, { 
                                backgroundColor: statusConexion === 'Online' ? '#E8F5E9' 
                                              : statusConexion === 'Login..' ? '#FFF3E0' 
                                              : '#FFEBEE',
                                borderColor: statusConexion === 'Online' ? '#A5D6A7' 
                                              : statusConexion === 'Login..' ? '#FFCC80' 
                                              : '#EF9A9A',
                            }]}>
                                <View style={[styles.statusDot, { 
                                    backgroundColor: statusConexion === 'Online' ? '#4CAF50' 
                                                  : statusConexion === 'Login..' ? '#FF9800' 
                                                  : '#F44336' 
                                }]} />
                                <Text style={[styles.statusText, { 
                                    color: statusConexion === 'Online' ? '#2E7D32' 
                                         : statusConexion === 'Login..' ? '#E65100' 
                                         : '#C62828' 
                                }]}>
                                    {statusConexion === 'Online' ? 'Online' 
                                   : statusConexion === 'Login..' ? 'Login..' 
                                   : 'Offline'}
                                </Text>
                            </View>
                </View>
                
                <View style={{ gap: 16, marginBottom: 24 }}>
                    <InputIp value={useIp} onchange={setIp} />
                    <InputPtoVenta value={usePtoventa} onchange={(e) => { setPtoventa(e) }} />
                </View>
                
                <Button
                    style={{ borderRadius: 12 }}
                    mode='contained'
                    contentStyle={{ height: 48 }}
                    onPress={() => Guardar()}
                    buttonColor="#663399"
                >
                    GUARDAR CAMBIOS
                </Button>
            </Surface>
        </View>
    )
}

function Cuerpo() {
    if (value === 'Printer') {
        return Impresora()
    } else if (value === 'Sync') {
        return Sync()
    } else if (value === 'Config') {
        return Config()
    }
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

return (
    <SafeAreaView style={{ flex: 1 }}>
        <View style={{paddingBottom: 8 }}>
            <SegmentedButtons
                style={{ margin: 16 }}
                value={value}
                onValueChange={setValue}
                theme={{ colors: { secondaryContainer: '#f3e5f5' } }}
                buttons={[
                    {
                        icon: 'printer',
                        value: 'Printer',
                        label: 'Impresora',
                    },
                    {
                        icon: 'cloud-sync',
                        value: 'Sync',
                        label: 'Sync',
                    },
                    {
                        icon: 'cog',
                        value: 'Config',
                        label: 'Servidor',
                    },
                ]}
            />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {Cuerpo()}
        </ScrollView>
        {Alerta()}
    </SafeAreaView>
)
}
const styles = StyleSheet.create({
    sectionSurface: {
        padding: 20,
        borderRadius: 16,
        backgroundColor: '#fff',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#333'
    },
    subTitle: {
        marginBottom: 12,
        color: '#663399',
        fontWeight: 'bold'
    },
    printerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
        statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    printerActions: {
        flexDirection: 'row',
        marginLeft: 8,
    },
    radioGroup: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        padding: 8,
        borderRadius: 12
    },
    radioOption: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8
    },
    inputActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    syncBtn: {
        width: '100%',
        maxWidth: 280,
        borderRadius: 12,
    },
    container: { flex: 1, padding: 16, paddingTop: 30, backgroundColor: '#fff' },
})
