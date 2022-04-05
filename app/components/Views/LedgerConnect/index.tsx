import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Image, SafeAreaView, TextStyle, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { Device } from '@ledgerhq/react-native-hw-transport-ble/lib/types';

import Engine from '../../../core/Engine';
import StyledButton from '../../../components/UI/StyledButton';
import Text from '../../../components/Base/Text';
import { mockTheme, useAppThemeFromContext } from '../../../util/theme';
import { fontStyles } from '../../../styles/common';
import { deviceHeight, deviceWidth } from '../../../util/scaling';
import Scan from './Scan';

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
		imageContainer: { alignItems: 'center', marginTop: deviceHeight * 0.02 },
		buttonContainer: {
			position: 'absolute',
			display: 'flex',
			bottom: deviceHeight * 0.025,
			left: 0,
			width: '100%',
		},
	});

const LedgerConnect = () => {
	const { KeyringController, AccountTrackerController } = Engine.context as any;
	const { colors } = useAppThemeFromContext() ?? mockTheme;
	const navigation = useNavigation();
	const styles = useMemo(() => createStyles(colors), [colors]);
	const [transport, setTransport] = useState(null);
	const [selectedDevice, setSelectedDevice] = useState<Device>(null);
	const [isRetry, setIsRetry] = useState(false);

	const onConnectToLedgerDevice = async () => {
		try {
			if (!transport && selectedDevice) {
				// Estabilish bluetooth connection to ledger
				const bleTransport = await TransportBLE.open(selectedDevice);
				setTransport(bleTransport);

				bleTransport.on('disconnect', () => setTransport(null));

				// Initialise the keyring and check for pre-conditions
				const appName = await KeyringController.connectLedgerHardware(bleTransport, selectedDevice.id);
				if (appName !== 'Ethereum') {
					Alert.alert('Ethereum app is not running', 'Please open the Ethereum app on your device.');
					setIsRetry(true);
					return;
				}

				// Retrieve the default account and sync the address with Metamask
				const defaultLedgerAccount = await KeyringController.unlockLedgerDefaultAccount();
				await AccountTrackerController.syncWithAddresses([defaultLedgerAccount]);

				navigation.navigate('WalletView');
			}
		} catch (e) {
			setIsRetry(true);

			Alert.alert('Ledger unavailable', 'Please make sure your Ledger is unlocked and your Bluetooth is enabled');
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.connectLedgerWrapper}>
				{/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
				<Image source={require('../../../images/ledger.png')} style={styles.ledgerImage} />
				<Text bold style={styles.connectLedgerText}>
					Connect Ledger
				</Text>
				<View style={styles.imageContainer}>
					{/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
					<Image source={require('../../../images/LedgerConnection.png')} />
				</View>
				<View style={styles.textContainer}>
					<Text bold>Looking for device</Text>
					<Text style={styles.instructionsText}>
						Please make sure your Ledger Nano X is unlocked and bluetooth is enabled.
					</Text>
				</View>
				<View style={styles.bodyContainer}>
					<Scan onDeviceSelected={(ledgerDevice) => setSelectedDevice(ledgerDevice)} />
					{selectedDevice && (
						<View style={styles.buttonContainer}>
							<StyledButton
								type="confirm"
								onPress={onConnectToLedgerDevice}
								testID={'add-network-button'}
							>
								{isRetry ? 'Retry' : 'Continue'}
							</StyledButton>
						</View>
					)}
				</View>
			</View>
		</SafeAreaView>
	);
};

export default LedgerConnect;
