/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Image, SafeAreaView, TextStyle, Platform, Alert } from 'react-native';
import Text from '../../../components/Base/Text';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { useNavigation } from '@react-navigation/native';
import { listen } from '@ledgerhq/logs';
import Transport from '@ledgerhq/hw-transport';
import { getSystemVersion } from 'react-native-device-info';
import { mockTheme, useAppThemeFromContext } from '../../../util/theme';
import { fontStyles } from '../../../styles/common';
import {
	check,
	checkMultiple,
	PERMISSIONS,
	RESULTS,
	request as requestPermission,
	openSettings,
	Permission,
} from 'react-native-permissions';
import Scan from './Scan';
import Engine from '../../../core/Engine';
import { deviceHeight, deviceWidth } from '../../../util/scaling';
import { BleManager, State } from 'react-native-ble-plx';

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background.default,
			alignItems: 'center',
		},
		connectLedgerWrapper: {
			marginLeft: deviceWidth * 0.07,
			marginRight: deviceWidth * 0.07,
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
			flex: 1,
			marginTop: deviceHeight * 0.07,
		},
	});
const systemVersion = getSystemVersion();

const LedgerConnect = () => {
	const { KeyringController, AccountTrackerController } = Engine.context as any;
	const { colors } = useAppThemeFromContext() ?? mockTheme;

	const navigation = useNavigation();
	const styles = useMemo(() => createStyles(colors), [colors]);
	const [hasBluetoothPermission, setHasBluetoothPermission] = useState<boolean>(false);
	const [transport, setTransport] = useState(null);
	const [defaultAccount, setDefaultAccount] = useState<string | null>(null);

	useEffect(() => {
		listen((event) => {
			console.log('test', event);
		});
	}, []);

	const connectAndUnlockDevice = async (transport: Transport) => {
		try {
			const appName = await KeyringController.connectLedgerHardware(transport);
			if (appName !== 'Ethereum') {
				throw new Error('Please open the Ethereum app on your device.');
			}
			// const _accounts = await KeyringController.getDefaultLedgerAccount(transport);
			const _accounts = await KeyringController.unlockLedgerDefaultAccount();
			setDefaultAccount(_accounts[0]);

			navigation.navigate('WalletView');
		} catch (e) {
			Alert.alert(
				'Ledger unavailable',
				'Please make sure your device is unlocked and the Ethereum app is running'
			);
		}
	};

	const onDeviceSelected = async (_device) => {
		try {
			if (!transport) {
				const bleTransport = await TransportBLE.open(_device);

				bleTransport.on('disconnect', async () => {
					setTransport(null);
				});

				setTransport(bleTransport);
				connectAndUnlockDevice(bleTransport);
			}
		} catch (e) {
			Alert.alert(
				'Ledger unavailable',
				'Please make sure your Ledger is turned on and your Bluetooth is enabled'
			);
		}
	};

	useEffect(() => {
		AccountTrackerController.syncWithAddresses([defaultAccount]);
	}, [AccountTrackerController, defaultAccount]);

	const checkPermissions = async (result: string, permissionsToRequest: Permission) => {
		switch (result) {
			case RESULTS.UNAVAILABLE:
				if (Platform.OS === 'ios') {
					Alert.alert('Bluetooth unavailable', 'Bluetooth is not available for this device');
				} else if (Platform.OS === 'android') {
					const parsedSystemVersion = Number(systemVersion.split('.')[0]);
					if (parsedSystemVersion > 11) {
						Alert.alert('Bluetooth unavailable', 'Bluetooth is not available for this device');
					} else if (
						parsedSystemVersion <= 11 &&
						permissionsToRequest !== PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
					) {
						const currentState: State = await BleManager.state();
						if (currentState === State.PoweredOn) return true;
					} else {
						Alert.alert('Bluetooth unavailable', 'Bluetooth is not available for this device');
					}
				}

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
							await requestPermission(permissionsToRequest);
						},
					},
				]);
				break;
			case RESULTS.BLOCKED:
				Alert.alert(
					'Access blocked',
					'Bluetooth access was blocked by this device. Please enable access from settings.',
					[
						{
							text: 'Open Settings',
							onPress: async () => {
								await openSettings();
							},
						},
					]
				);
				break;
			case RESULTS.GRANTED:
				return true;
		}
	};

	useEffect(() => {
		if (Platform.OS === 'ios') {
			check(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL).then((result) => {
				const hasPermission = checkPermissions(result, PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
				hasPermission && setHasBluetoothPermission(true);
			});
		} else if (Platform.OS === 'android') {
			checkMultiple([
				PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
				PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
				PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
			]).then((statuses) => {
				const p1 = checkPermissions(
					statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION],
					PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
				);

				const p2 = checkPermissions(
					statuses[PERMISSIONS.ANDROID.BLUETOOTH_SCAN],
					PERMISSIONS.ANDROID.BLUETOOTH_SCAN
				);
				const p3 = checkPermissions(
					statuses[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT],
					PERMISSIONS.ANDROID.BLUETOOTH_CONNECT
				);

				p1 && p2 && p3 && setHasBluetoothPermission(true);
			});
		}
	}, []);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.connectLedgerWrapper}>
				<Image source={require('../../../images/ledger.png')} style={styles.ledgerImage} />
				<Text bold style={styles.connectLedgerText}>
					Connect Ledger
				</Text>
				<View style={styles.bodyContainer}>
					{hasBluetoothPermission && <Scan onDeviceSelected={onDeviceSelected} />}
					{!hasBluetoothPermission && <Text> Your Bluetooth is disabled</Text>}
				</View>
			</View>
		</SafeAreaView>
	);
};

export default LedgerConnect;
