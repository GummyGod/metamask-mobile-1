/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Image, SafeAreaView, TextStyle, Platform, Alert, Linking } from 'react-native';
import Text from '../../../components/Base/Text';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { useNavigation } from '@react-navigation/native';
import { listen } from '@ledgerhq/logs';
import Transport from '@ledgerhq/hw-transport';

import { mockTheme, useAppThemeFromContext } from '../../../util/theme';
import { fontStyles } from '../../../styles/common';
import { check, checkMultiple, PERMISSIONS, openSettings } from 'react-native-permissions';
import Scan from './Scan';
import Engine from '../../../core/Engine';
import { deviceHeight, deviceWidth } from '../../../util/scaling';
import { BleManager, State } from 'react-native-ble-plx';
import { handleAndroidBluetoothPermissions, handleIOSBluetoothPermission } from './ledgerUtils';

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
			marginTop: deviceHeight * 0.025,
		},
		textContainer: {
			marginTop: deviceHeight * 0.05,
		},

		instructionsText: {
			marginTop: deviceHeight * 0.02,
		},
		howItWorksText: {
			marginTop: deviceHeight * 0.02,
		},
		imageContainer: { alignItems: 'center', marginTop: deviceHeight * 0.02 },
	});

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
		const unsubscribe = listen((e) => console.log(e));

		return () => unsubscribe();
	}, []);

	const connectAndUnlockDevice = async (bleTransport: Transport) => {
		try {
			const appName = await KeyringController.connectLedgerHardware(bleTransport);
			if (appName !== 'Ethereum') {
				throw new Error('Please open the Ethereum app on your device.');
			}

			const _accounts = await KeyringController.unlockLedgerDefaultAccount();
			setDefaultAccount(_accounts[0]);

			await AccountTrackerController.syncWithAddresses([defaultAccount]);

			navigation.navigate('WalletView');
		} catch (e) {
			Alert.alert(
				'Ledger unavailable',
				'Please make sure your device is unlocked and the Ethereum app is running'
			);
		}
	};

	const onDeviceSelected = async (ledgerDevice: any) => {
		try {
			if (!transport) {
				const bleTransport = await TransportBLE.open(ledgerDevice);

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

			if (Platform.OS === 'android') {
				const requiredPermissions = await checkMultiple([
					PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
					PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
					PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
				]);

				const bluetoothAllowed = handleAndroidBluetoothPermissions(requiredPermissions);

				if (bluetoothAllowed) {
					setCanScanBluetoothDevices(true);
				} else {
					Alert.alert(
						'Missing permissions',
						'Make sure you enable Bluetooth and Location access in your device settings',
						[
							{
								text: 'Open Settings',
								onPress: async () => {
									await openSettings();
								},
							},
						]
					);
				}
			}
		};

		run();
	}, []);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.connectLedgerWrapper}>
				<Image source={require('../../../images/ledger.png')} style={styles.ledgerImage} />
				<Text bold style={styles.connectLedgerText}>
					Connect Ledger
				</Text>
				<View style={styles.imageContainer}>
					<Image source={require('../../../images/LedgerConnection.png')} />
				</View>
				<View style={styles.textContainer}>
					<Text bold>Looking for device</Text>
					<Text style={styles.instructionsText}>
						Please make sure your Ledger Nano X is unlocked and bluetooth is enabled.
					</Text>
					<Text bold blue style={{ ...styles.howItWorksText }}>
						How it works?
					</Text>
				</View>
				<View style={styles.bodyContainer}>
					{canScanBluetoothDevices && <Scan onDeviceSelected={onDeviceSelected} />}
					{!canScanBluetoothDevices && <Text> Your Bluetooth is disabled</Text>}
				</View>
			</View>
		</SafeAreaView>
	);
};

export default LedgerConnect;
