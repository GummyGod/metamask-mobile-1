/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, View, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native';
import { Observable, Subscription } from 'rxjs';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { Device } from '@ledgerhq/react-native-hw-transport-ble/lib/types';
import { check, checkMultiple, PERMISSIONS, openSettings } from 'react-native-permissions';
import { BleManager, State } from 'react-native-ble-plx';

import SelectComponent from '../../UI/SelectComponent';
import { deviceWidth } from '../../../util/scaling';
import { mockTheme, useAppThemeFromContext } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import { handleAndroidBluetoothPermissions, handleIOSBluetoothPermission } from './ledgerUtils';

const createStyles = (colors: Colors) =>
	StyleSheet.create({
		container: {
			flex: 1,
			alignItems: 'center',
		},
		activityIndicatorContainer: {
			marginTop: 50,
		},
		picker: {
			borderColor: colors.border.default,
			borderRadius: 5,
			borderWidth: 2,
			height: 45,
			width: deviceWidth * 0.85,
		},
	});

const Scan = ({ onDeviceSelected }: { onDeviceSelected: (device: Device) => void }) => {
	const { colors } = useAppThemeFromContext() || mockTheme;
	const styles = useMemo(() => createStyles(colors), [colors]);
	const [devices, setDevices] = useState<Device[]>([]);
	const [canScan, setCanScan] = useState<boolean>(false);

	const options = devices?.map(({ id, name, ...rest }: Partial<Device>) => ({
		key: id,
		label: name,
		value: id,
		...rest,
	}));

	useEffect(() => {
		// Monitoring for the BLE adapter to be turned on
		const manager = new BleManager();
		const subscription = manager.onStateChange((state) => {
			console.log('>>>> WE ARE HERE', state);
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
		}, true);

		return () => subscription.remove();
	}, []);

	useEffect(() => {
		// Checking if app has required permissions
		const run = async () => {
			if (Platform.OS === 'ios') {
				const bluetoothPermissionStatus = await check(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
				const bluetoothAllowed = handleIOSBluetoothPermission(bluetoothPermissionStatus);

				if (bluetoothAllowed) {
					setCanScan(true);
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
					setCanScan(true);
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

	useEffect(() => {
		// Initiate scanning and pairing if bluetooth is enabled
		let subscription: Subscription;

		if (canScan) {
			subscription = new Observable(TransportBLE.listen).subscribe({
				next: (e: any) => {
					const deviceFound = devices.some((d) => d.id === e.descriptor.id);

					if (e.type === 'add' && !deviceFound) {
						setDevices([...devices, e?.descriptor]);
						onDeviceSelected(e.descriptor);
					}
				},
				error: (_error) => {
					Alert.alert(
						'Error while scanning the device',
						'Please make sure your device is unlocked and the Ethereum app is running'
					);
				},
			});
		}

		return () => {
			subscription?.unsubscribe();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [canScan]);

	return (
		<View style={styles.container}>
			{devices.length > 0 && (
				<View style={styles.picker}>
					<SelectComponent
						options={options}
						label="Available devices"
						defaultValue={options[0]?.label}
						onValueChange={(ledger: Device) => onDeviceSelected(ledger)}
					/>
				</View>
			)}
			{devices.length === 0 && (
				<View style={styles.activityIndicatorContainer}>
					<ActivityIndicator />
				</View>
			)}
		</View>
	);
};

export default Scan;
