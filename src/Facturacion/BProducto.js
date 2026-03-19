import { useState, useEffect } from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Button, ActivityIndicator, Portal, Modal, TouchableRipple, Divider, Surface, IconButton } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';


import { useStore } from '../store'

export default function BProducto({ navigation, route }) {
    const [indicator, setIndicator] = useState(true)
    const [seaproductos, setSeaProductos] = useState([])
    const [visible, setVisible] = useState(false)
    const [focus, setFocus] = useState(false)
    const [seleccion, setSeleccion] = useState('')
    const [valor, setValor] = useState('1')
    const [productos, setProductos] = useState([])
    const [cambios, setCambios] = useState([])

    const [useProd, setProd] = useState(useStore.getArray('useProd') || '')

    const params = route.params;


    useEffect(() => {
        fetchDataProd()
    }, [])

    useEffect(() => { setValor('1') }, [!visible])

    const showModal = (name) => {
        setVisible(true)
        setSeleccion(name)
    };

    const hideModal = () => {
        setVisible(false)
    }


    const fetchDataProd = async () => {
        try {
            if (useProd) {
                let aux = useProd.filter(item => item.includes(params.lista)).sort()
                params.productos.forEach((item) => {
                    for (let index in aux) {
                        if (aux[index][0] == item[0]) {
                            aux.splice(index, 1);
                        }
                    }
                })
                setSeaProductos(aux)
                setIndicator(false)
            }
            else { console.log('tiro null') }   
        } catch (e) {
            console.log(e)
        }
    }

    const Finalizar = () => {
        if (params.tipo == '1') {
            navigation.navigate({
                name: 'StackFacturacion',
                params: { productos: productos, tipo: params.tipo }    
            })
        } else {
            navigation.navigate({
                name: 'StackFacturacion',
                params: { cambios: productos, tipo: params.tipo }    
            })
        }
    }

    const ModalCant = () => {
        const [valor, setValor] = useState('1');

        return (
            <Portal>
                <Modal
                    visible={visible}
                    onDismiss={hideModal}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Surface style={styles.modalSurface} elevation={4}>

                        <View style={styles.modalHeader}>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                                Cantidad
                            </Text>

                            <Text
                                variant="bodyMedium"
                                numberOfLines={1}
                                style={styles.modalSubtitle}
                            >
                                {seleccion}
                            </Text>
                        </View>

                        <Divider style={{ marginVertical: 12 }} />

                        <InputCantidad
                            value={valor}
                            onChange={setValor}
                        />

                        <View style={styles.modalButtons}>
                            <Button
                                mode="outlined"
                                onPress={() => hideModal()}
                                style={{ flex: 1, marginRight: 10 }}
                            >
                                Cancelar
                            </Button>

                            <Button
                                mode="contained"
                                onPress={() => handleAceptar(valor, productos)}
                                style={{ flex: 1 }}
                            >
                                Aceptar
                            </Button>
                        </View>

                    </Surface>
                </Modal>
            </Portal>
        )
    };


    const handleAceptar = (currentValue, aux) => {
        if (currentValue > 0) {
            let index = seaproductos.indexOf(
                seaproductos.find(arr => arr.includes(seleccion)))
            setSeaProductos([
                ...seaproductos.slice(0, index),
                ...seaproductos.slice(index + 1)
            ])
            aux.push([seleccion, currentValue])
            setProductos(aux)
            setValor('1')

            hideModal()
        }
    }

    const InputCantidad = ({ value, onChange }) => {

        const aumentar = () => {
            const nuevo = (parseInt(value) || 0) + 1;
            onChange(String(nuevo));
        };

        const disminuir = () => {
            const nuevo = Math.max(1, (parseInt(value) || 1) - 1);
            onChange(String(nuevo));
        };

        return (
            <View style={styles.cantidadContainer}>
                <IconButton
                    icon="minus"
                    size={22}
                    mode="contained-tonal"
                    onPress={disminuir}
                />

                <TextInput
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    mode="outlined"
                    dense
                    style={styles.inputCantidad}
                    contentStyle={{ textAlign: 'center', fontSize: 18 }}
                />

                <IconButton
                    icon="plus"
                    size={22}
                    mode="contained-tonal"
                    onPress={aumentar}
                />
            </View>
        );
    };


    const renderItem = ({ item }) => {
        return (
            <TouchableRipple
                style={styles.row}
                onPress={() => {
                    showModal(item[0])
                    setFocus(true)
                }}
                rippleColor="rgba(0, 0, 0, .15)"
            >
                <Text style={styles.rowText}>
                    {item[0]}
                </Text>
            </TouchableRipple>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ModalCant />

            {indicator ? (
                <ActivityIndicator
                    style={{ marginTop: 20 }}
                    size='large'
                    animating={indicator}
                />
            ) : (
                <>
                    <View style={styles.headerProfessional}>
                        <View style={styles.headerTitleContainer}>
                            <IconButton icon="magnify" size={24} iconColor="#663399" style={{ margin: 0 }} />
                            <Text variant="titleMedium" style={styles.titleProfessional}>
                                Catálogo
                            </Text>
                        </View>

                        <Button
                            mode="contained"
                            buttonColor="#4CAF50"
                            onPress={Finalizar}
                            style={styles.confirmButton}
                            labelStyle={{ fontWeight: 'bold' }}
                            icon="check-circle-outline"
                        >
                            Confirmar
                        </Button>
                    </View>

                    <FlatList
                        data={seaproductos}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderItem}
                        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                        contentContainerStyle={{
                            paddingHorizontal: 20,
                            paddingBottom: 20
                        }}
                    />


                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    title: {
        textAlign: 'center',
        marginVertical: 15
    },
    row: {
        backgroundColor: '#E7E6E1',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8
    },
    rowText: {
        fontSize: 16
    },
    finalizarBtn: {
        marginHorizontal: 20,
        marginBottom: 20,
        height: 45,
        justifyContent: 'center'
    },
    cantidadContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6
    },

    inputCantidad: {
        width: 80,
        height: 50,
        backgroundColor: 'white'
    },

    modalContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },

    modalSurface: {
        width: '100%',
        borderRadius: 20,
        padding: 20,
        backgroundColor: 'white'
    },

    modalHeader: {
        alignItems: 'center'
    },

    modalSubtitle: {
        marginTop: 6,
        opacity: 0.7
    },

    modalButtons: {
        flexDirection: 'row',
        marginTop: 25
    },
    headerProfessional: {
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 8
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleProfessional: {
        fontWeight: 'bold',
        color: '#663399',
        marginLeft: -4
    },
    confirmButton: {
        borderRadius: 12,
        elevation: 0
    }

});