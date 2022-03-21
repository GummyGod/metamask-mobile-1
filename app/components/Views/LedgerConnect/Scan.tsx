import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { Observable } from 'rxjs';
import { Device } from '@ledgerhq/react-native-hw-transport-ble/lib/types';
import LedgerDevice from './LedgerDevice';

const createStyles = () =>
	StyleSheet.create({
		container: {
			alignItems: 'center',
		},
		flatList: {
			marginTop: 10,
		},
	});

const Scan = ({ onDeviceSelected }: { onDeviceSelected: (device: Device) => void }) => {
	const [devices, setDevices] = useState<Device>([]);
	const [error, setError] = useState(null);
	const styles = createStyles();

	const startScan = useCallback(() => {
		const subscription = new Observable(TransportBLE.listen).subscribe({
			next: (e: unknown) => {
				const deviceFound = devices.some((i: Device) => i?.id === device.id);
				e.type === 'add' && !deviceFound && setDevices([...devices, e.descriptor]);
			},
			error: () => {
				//todo
			},
		});

		return subscription;
	}, [devices]);

	const onSelect = useCallback(
		async (device) => {
			try {
				await onDeviceSelected(device);
			} catch (error) {
				setError(error);
			}
		},
		[onDeviceSelected]
	);

	useEffect(() => {
		const subscription = startScan();

		return () => {
			subscription?.unsubscribe();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<View style={styles.container}>
			<Image source={require('../../../images/LedgerConnection.png')} />
			<View>
				<Text>Scanning for Bluetooth...</Text>
				<Text>Power up your Ledger Nano X and enter your pin.</Text>
				{devices.map((d: Device) => (
					<LedgerDevice key={`Device-${d.name}`} device={d} onSelect={onSelect} />
				))}
			</View>
		</View>
	);
};

export default Scan;
