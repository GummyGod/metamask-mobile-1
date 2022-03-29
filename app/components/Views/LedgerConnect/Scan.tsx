/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { Observable } from 'rxjs';
import { Device } from '@ledgerhq/react-native-hw-transport-ble/lib/types';
import Text from '../../../components/Base/Text';
import { deviceHeight, deviceWidth } from '../../../util/scaling';
import { mockTheme, useAppThemeFromContext } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import SelectComponent from '../../UI/SelectComponent';
import StyledButton from '../../../components/UI/StyledButton';

const createStyles = (colors: Colors) =>
	StyleSheet.create({
		container: {
			flex: 1,
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
		picker: {
			borderColor: colors.border.default,
			borderRadius: 5,
			borderWidth: 2,
			marginTop: 15,
			height: 45,
		},
		buttonContainer: {
			position: 'absolute',
			bottom: deviceHeight * 0.025,
			left: 0,
		},
		button: {
			width: deviceWidth * 0.8,
		},
	});

const Scan = ({ onDeviceSelected }: { onDeviceSelected: (device: Device) => void }) => {
	const [devices, setDevices] = useState<Device[]>([]);
	const [currentDevice, setCurrentDevice] = useState<Device>(null);
	const [error, setError] = useState<unknown | null>(null);
	const { colors } = useAppThemeFromContext() || mockTheme;

	const styles = useMemo(() => createStyles(colors), [colors]);

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

	const options = devices?.map(({ id, name, ...rest }: Partial<Device>) => ({
		key: id,
		label: name,
		value: id,
		...rest,
	}));

	useEffect(() => {
		if (devices.length > 0 && !currentDevice) {
			setCurrentDevice(devices[0]);
		}
	}, [devices, currentDevice]);

	const onSelect = async () => {
		try {
			await onDeviceSelected(currentDevice);
		} catch (_error) {
			setError(_error);
		}
	};

	const onChange = async (_device: Device) => {
		setCurrentDevice(_device);
	};

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
				{devices.length > 0 && (
					<View style={styles.picker}>
						<SelectComponent
							options={options}
							label="Available devices"
							defaultValue={options[0]?.label}
							onValueChange={onChange}
						/>
					</View>
				)}

				{devices.length === 0 && (
					<View style={styles.activityIndicatorContainer}>
						<ActivityIndicator />
					</View>
				)}
			</View>
			{devices.length > 0 && (
				<View style={styles.buttonContainer}>
					<StyledButton type="confirm" onPress={onSelect} testID={'add-network-button'} style={styles.button}>
						Continue
					</StyledButton>
				</View>
			)}
		</View>
	);
};

export default Scan;
