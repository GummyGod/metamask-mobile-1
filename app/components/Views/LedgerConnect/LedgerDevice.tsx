import React, { useState } from 'react';
import { Text, TouchableOpacity, ActivityIndicator } from 'react-native';

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

const LedgerDevice = ({ onSelect, device }: Props) => {
	const [pending, setPending] = useState(false);

	const onPress = async () => {
		setPending(true);
		await onSelect(device);
		setPending(false);
	};

	return (
		<TouchableOpacity onPress={onPress} disabled={pending}>
			<Text>{device?.name}</Text>
			{pending ? <ActivityIndicator /> : null}
		</TouchableOpacity>
	);
};

export default LedgerDevice;
