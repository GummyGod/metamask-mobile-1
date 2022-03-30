/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Image, SafeAreaView, TextStyle, Platform, Alert, Linking } from 'react-native';
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
	// checkMultiple,
	PERMISSIONS,
	RESULTS,
	// request as requestPermission,
	openSettings,
	// Permission,
	PermissionStatus,
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
	const [canScanBluetoothDevices, setCanScanBluetoothDevices] = useState<boolean>(false);
	const [transport, setTransport] = useState(null);
	const [defaultAccount, setDefaultAccount] = useState<string | null>(null);

	useEffect(() => {
		// Monitoring for the BLE adapter to be turned on
		const manager = new BleManager();
		const subscription = manager.onStateChange((state) => {
			console.log('>>>>> STATE', state);
			if (state === State.PoweredOff) {
				Alert.alert('Bluetooth is off', 'Please turn on bluetooth for your device', [
					{
						text: 'Open Settings',
						onPress: async () => {
							Platform.OS === 'ios'
								? Linking.openURL('App-Prefs:Bluetooth')
								: Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
						},
					},
				]);
			}
		});

		return () => subscription.remove();
	}, []);

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

	// const checkPermissions = async (result: string, permissionsToRequest: Permission) => {
	// 	console.log('we are here >>>>>>> 0', systemVersion);
	// 	console.log('>>>>>> result', result, permissionsToRequest);

	// 	switch (result) {
	// 		case RESULTS.UNAVAILABLE: {
	// 			console.log('we are here >>>>>>> 0.0.1', Platform.OS);

	// 			if (Platform.OS === 'ios') {
	// 				Alert.alert('Bluetooth unavailable', 'Bluetooth is not available for this device');
	// 			} else if (Platform.OS === 'android') {
	// 				console.log('we are here >>>>>>> 0.1');
	// 				const parsedSystemVersion = Number(systemVersion.split('.')[0]);

	// 				console.log('we are here >>>>>>> 0.1.1', parsedSystemVersion);

	// 				if (parsedSystemVersion > 11) {
	// 					Alert.alert('Bluetooth unavailable', 'Bluetooth is not available for this device');
	// 				} else if (
	// 					parsedSystemVersion <= 11 &&
	// 					permissionsToRequest !== PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
	// 				) {
	// 					console.log('we are here >>>>>>> 1');
	// 					const manager = new BleManager();
	// 					const currentState: State = await manager.state();

	// 					console.log('we are here >>>>>>> 2', currentState);

	// 					if (currentState === State.PoweredOn) {
	// 						return true;
	// 					} else {
	// 						console.log('>>>>> trying to power on');
	// 						const res = await manager.enable();

	// 						console.log('>>>>> res', res);

	// 						return true;
	// 					}

	// 					Alert.alert('Bluetooth unavailable', 'Bluetooth is not available for this device');
	// 				}
	// 			}

	// 			break;
	// 		}
	// 		case RESULTS.DENIED:
	// 			setCanScanBluetoothDevices(false);
	// 			Alert.alert('Access denied', 'Bluetooth access was denied by this device', [
	// 				{
	// 					text: 'Cancel',
	// 					style: 'cancel',
	// 				},
	// 				{
	// 					text: 'Enable bluetooth access',
	// 					onPress: async () => {
	// 						await requestPermission(permissionsToRequest);
	// 					},
	// 				},
	// 			]);
	// 			break;
	// 		case RESULTS.BLOCKED:
	// 			Alert.alert(
	// 				'Access blocked',
	// 				'Bluetooth access was blocked by this device. Please enable access from settings.',
	// 				[
	// 					{
	// 						text: 'Open Settings',
	// 						onPress: async () => {
	// 							await openSettings();
	// 						},
	// 					},
	// 				]
	// 			);
	// 			break;
	// 		case RESULTS.GRANTED:
	// 			return true;
	// 	}
	// };

	const handleIOSBluetoothPermission = (bluetoothPermissionStatus: PermissionStatus) => {
		switch (bluetoothPermissionStatus) {
			case RESULTS.GRANTED:
				return true;
			default:
				return false;
		}
	};

	useEffect(() => {
		const run = async () => {
			if (Platform.OS === 'ios') {
				const bluetoothPermissionStatus = await check(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
				const bluetoothAllowed = handleIOSBluetoothPermission(bluetoothPermissionStatus);

				if (bluetoothAllowed) {
					setCanScanBluetoothDevices(true);
				} else {
					Alert.alert('Access blocked', 'Please enable bluetooth for you app', [
						{
							text: 'Open Settings',
							onPress: async () => {
								await openSettings();
							},
						},
					]);
				}
			}
		};

		run();
	}, []);

	// useEffect(() => {
	// 	if (Platform.OS === 'ios') {
	// 		check(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL).then((result) => {
	// 			const hasPermission = checkPermissions(result, PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
	// 			hasPermission && setCanScanBluetoothDevices(true);
	// 		});
	// 	} else if (Platform.OS === 'android') {
	// 		checkMultiple([
	// 			PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
	// 			'android.permission.BLUETOOTH_SCAN' as any,
	// 			'android.permission.BLUETOOTH_CONNECT',
	// 		]).then((statuses) => {
	// 			const p1 = checkPermissions(
	// 				statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION],
	// 				PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
	// 			);

	// 			const p2 = checkPermissions(
	// 				statuses['android.permission.BLUETOOTH_SCAN'],
	// 				'android.permission.BLUETOOTH_SCAN' as any
	// 			);
	// 			const p3 = checkPermissions(
	// 				statuses['android.permission.BLUETOOTH_CONNECT'],
	// 				'android.permission.BLUETOOTH_CONNECT' as any
	// 			);

	// 			p1 && p2 && p3 && setCanScanBluetoothDevices(true);
	// 		});
	// 	}
	// }, []);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.connectLedgerWrapper}>
				<Image source={require('../../../images/ledger.png')} style={styles.ledgerImage} />
				<Text bold style={styles.connectLedgerText}>
					Connect Ledger
				</Text>
				<View style={styles.bodyContainer}>
					{canScanBluetoothDevices && <Scan onDeviceSelected={onDeviceSelected} />}
					{!canScanBluetoothDevices && <Text> Your Bluetooth is disabled</Text>}
				</View>
			</View>
		</SafeAreaView>
	);
};

export default LedgerConnect;
