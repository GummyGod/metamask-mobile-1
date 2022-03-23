import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { Observable } from 'rxjs';
import { Device } from '@ledgerhq/react-native-hw-transport-ble/lib/types';
import Text from '../../../components/Base/Text';
import LedgerDevice from './LedgerDevice';
import { deviceHeight } from '../../../util/scaling';

const createStyles = () =>
	StyleSheet.create({
		container: {
			alignItems: 'center',
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
		activityIndicatorContainer: {
			marginTop: 50,
		},
	});

const Scan = ({ onDeviceSelected }: { onDeviceSelected: (device: Device) => void }) => {
	const [devices, setDevices] = useState<Device>([]);
	const [error, setError] = useState<unknown | null>(null);

	const styles = useMemo(() => createStyles(), []);

	const startScan = useCallback(() => {
		const subscription = new Observable(TransportBLE.listen).subscribe({
			next: (e) => {
				const deviceFound = devices.some((i) => i.id === e.descriptor.id);
				e.type === 'add' && !deviceFound && setDevices([...devices, e?.descriptor]);
			},
			error: (_error) => {
				setError(_error);
			},
		});

		return subscription;
	}, [devices]);

	const onSelect = useCallback(
		async (_device) => {
			try {
				await onDeviceSelected(_device);
			} catch (_error) {
				setError(_error);
			}
		},
		[onDeviceSelected]
	);

	useEffect(() => {
		const subscription = startScan();

		return () => {
			subscription?.unsubscribe();
		};
	}, [startScan]);

	return (
		<View style={styles.container}>
			<Image source={require('../../../images/LedgerConnection.png')} />
			<View style={styles.textContainer}>
				<Text bold>Looking for device</Text>
				<Text style={styles.instructionsText}>
					Please make sure your Ledger Nano X is unlocked and bluetooth is enabled.
				</Text>
				<Text bold blue style={{ ...styles.howItWorksText }}>
					How it works?
				</Text>
				{devices.length > 0 ? (
					devices.map((d: Device) => <LedgerDevice key={`Device-${d.name}`} device={d} onSelect={onSelect} />)
				) : (
					<View style={styles.activityIndicatorContainer}>
						<ActivityIndicator />
					</View>
				)}
			</View>
		</View>
	);
};

export default Scan;
