import React, { useState, useMemo } from 'react';
import { Text, TouchableOpacity, ActivityIndicator, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../../util/theme/models';
import { deviceHeight } from '../../../util/scaling';
import { useAppThemeFromContext, mockTheme } from '../../../util/theme';

interface LedgerDeviceProps {
	id: string;
	isConnectable: boolean;
	localName: string;
	manufacturerData: unknown;
	mtu: number;
	name: string;
	overflowServiceUUIDs: unknown;
	rssi: number;
	serviceData: unknown;
	serviceUUIDs: string[];
	solicitedServiceUUIDs: unknown;
	txPowerLevel: unknown;
	_manager: unknown;
}

interface Props {
	onSelect: (device: LedgerDeviceProps) => void;
	device: LedgerDeviceProps;
}

const createStyles = (colors: Colors) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			marginTop: deviceHeight * 0.05,
			borderColor: colors.border.default,
			borderWidth: 1,
			height: 56,
			alignItems: 'center',
			justifyContent: 'space-between',
		},
		arrow: {
			fontWeight: 'bold',
			marginRight: 15,
		},
		buttonStyle: {
			flexDirection: 'row',
			alignItems: 'center',
			marginLeft: 10,
		},
	});

const LedgerDevice = ({ onSelect, device }: Props) => {
	const [pending, setPending] = useState(false);
	const { colors } = useAppThemeFromContext();

	const styles = useMemo(() => createStyles(colors), [colors]);

	const onPress = async () => {
		setPending(true);
		await onSelect(device);
		setPending(false);
	};

	return (
		<>
			{!pending ? (
				<TouchableOpacity onPress={onPress} disabled={pending} style={styles.container}>
					<>
						<View style={styles.buttonStyle}>
							<Text>{device?.name}</Text>
						</View>
						<Icon name={`ios-arrow-forward`} size={20} style={styles.arrow} />
					</>
				</TouchableOpacity>
			) : (
				<ActivityIndicator />
			)}
		</>
	);
};

export default React.memo(LedgerDevice);
