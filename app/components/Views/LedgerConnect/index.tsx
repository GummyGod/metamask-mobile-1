import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TextStyle, Dimensions, Platform, Alert } from 'react-native';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { mockTheme, useAppThemeFromContext } from '../../../util/theme';
import { fontStyles } from '../../../styles/common';
import { check, checkMultiple, PERMISSIONS, RESULTS, request as requestPermission } from 'react-native-permissions';
import Scan from './Scan';
import { deviceHeight, deviceWidth } from '../../../util/scaling';

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background.default,
		},
		connectLedgerWrapper: {
			marginLeft: deviceWidth * 0.07,
		},
		ledgerImage: {
			width: 68,
			height: 68,
		},
		connectLedgerText: {
			...(fontStyles.normal as TextStyle),
			fontSize: 24,
		},
		bodyContainer: {
			alignItems: 'center',
			marginTop: deviceHeight * 0.07,
		},
	});

const LedgerConnect = () => {
	const { colors } = useAppThemeFromContext() || mockTheme;
	const styles = createStyles(colors);
	const [hasBluetoothPermission, setHasBluetoothPermission] = useState<boolean>(false);
	const [transport, setTransport] = useState(null);

	const onDeviceSelected = useCallback(async (device) => {
		const bleTransport = await TransportBLE.open(device);

		bleTransport.on('disconnect', () => {
			setTransport(null);
		});

		setTransport(bleTransport);
	}, []);

	useEffect(() => {
		if (Platform.OS === 'ios') {
			check(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL).then((result) => {
				switch (result) {
					case RESULTS.UNAVAILABLE:
						Alert.alert('Bluetooth unavailable', 'Bluetooth is not available for this device');
						break;
					case RESULTS.DENIED:
						setHasBluetoothPermission(false);
						Alert.alert('Access denied', 'Bluetooth access was denied by this device', [
							{
								text: 'Cancel',
								style: 'cancel',
							},
							{
								text: 'Enable bluetooth access',
								onPress: async () => {
									await requestPermission(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
								},
							},
						]);
						break;
					case RESULTS.BLOCKED:
						Alert.alert(
							'Access blocked',
							'Bluetooth access was blocked by this device. Please enable access from settings.'
						);
						break;
					case RESULTS.GRANTED:
						setHasBluetoothPermission(true);
						break;
				}
			});
		} else if (Platform.OS === 'android') {
			checkMultiple([PERMISSIONS.ANDROID.BLUETOOTH_CONNECT, PERMISSIONS.ANDROID.BLUETOOTH_SCAN]).then(
				(statuses) => {
					//TODO
				}
			);
		}
	}, []);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.connectLedgerWrapper}>
				<Image source={require('../../../images/ledger.png')} style={styles.ledgerImage} />
				<Text style={styles.connectLedgerText}> Connect Ledger </Text>
				<View style={styles.bodyContainer}>
					{hasBluetoothPermission &&
						(transport ? (
							<Text> Open the Ethereum app</Text>
						) : (
							<Scan onDeviceSelected={onDeviceSelected} />
						))}
					{!hasBluetoothPermission && <Text> Your Bluetooth is disabled</Text>}
				</View>
			</View>
		</SafeAreaView>
	);
};

export default LedgerConnect;
