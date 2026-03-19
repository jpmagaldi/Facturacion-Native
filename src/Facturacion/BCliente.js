import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    StyleSheet,
    FlatList
} from 'react-native';
import {
    IconButton,
    ActivityIndicator,
    Text,
    Divider
} from 'react-native-paper';

import { useStore } from '../store';

export default function BCliente({ navigation }) {

    const [indicator, setIndicator] = useState(true);
    const [useCli, setCli] = useState(useStore.getArray('useCli') || []);

    useEffect(() => {
        if (useCli.length != 0) {
            setIndicator(false);
        }
    }, [useCli]);

    const renderItem = ({ item }) => {

        let razon = item[1];
        if (razon.length >= 35) {
            razon = razon.slice(0, 30) + '...';
        }

        return (
            <View style={styles.row}>
                <View style={styles.textContainer}>
                    <Text variant="bodyMedium">
                        {razon}
                    </Text>
                    <Text variant="bodySmall" style={styles.subText}>
                        {item[0]}
                    </Text>
                </View>

                <IconButton
                    icon="check"
                    onPress={() => {
                        navigation.navigate('StackFacturacion', {
                            cliente: item
                        });
                    }}
                />
            </View>
        );
    };

    if (indicator) {
        return (
            <SafeAreaView style={styles.center}>
                <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, paddingHorizontal: 20 }}>
                    <ActivityIndicator size="large" style={{ marginBottom: 15 }} />
                    <Text variant="titleMedium" style={{ textAlign: 'center', marginBottom: 5 }}>Cargando...</Text>
                    <Text variant="bodyMedium" style={{ textAlign: 'center', opacity: 0.6 }}>Si esto tarda mucho, sincronice en Configuración</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text
                variant="titleMedium"
                style={styles.title}
            >
                Buscar Cliente..
            </Text>

            <FlatList
                data={useCli}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <Divider />}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: '#fff'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        textAlign: 'center',
        marginVertical: 16
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12
    },
    textContainer: {
        flex: 1,
        paddingRight: 10
    },
    subText: {
        opacity: 0.6
    }
});
