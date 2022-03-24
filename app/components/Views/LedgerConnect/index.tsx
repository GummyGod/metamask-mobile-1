import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Image, SafeAreaView, TextStyle, Platform, Alert } from 'react-native';
import Text from '../../../components/Base/Text';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { useNavigation } from '@react-navigation/native';
import { listen } from '@ledgerhq/logs';
import { useAppThemeFromContext } from '../../../util/theme';
import { fontStyles } from '../../../styles/common';
import { check, checkMultiple, PERMISSIONS, RESULTS, request as requestPermission } from 'react-native-permissions';
import Scan from './Scan';
import Engine from '../../../core/Engine';
import { deviceHeight, deviceWidth } from '../../../util/scaling';

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background.default,
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
			alignItems: 'center',
			marginTop: deviceHeight * 0.07,
		},
	});

const LedgerConnect = () => {
	const { KeyringController, AccountTrackerController } = Engine.context as any;
	const { colors } = useAppThemeFromContext();
	const [rerender, setRerender] = useState<boolean>(false);

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

	const onDeviceSelected = async (_device) => {
		try {
			if (!transport) {
				const bleTransport = await TransportBLE.open(_device);

				bleTransport.on('disconnect', async () => {
					setTransport(null);
				});

				setTransport(bleTransport);
			}
		} catch (e) {
			Alert.alert(
				'Ledger unavailable',
				'Please make sure your Ledger is turned on and your Bluetooth is enabled'
			);
		}
	};

	useEffect(() => {
		const connectAndUnlockDevice = async () => {
			try {
				if (transport) {
					const appName = await KeyringController.connectLedgerHardware(transport);
					if (appName !== 'Ethereum') {
						throw new Error('Please open the Ethereum app on your device.');
					}
					// const _accounts = await KeyringController.getDefaultLedgerAccount(transport);
					const _accounts = await KeyringController.unlockLedgerDefaultAccount();
					setDefaultAccount(_accounts[0]);
					setRerender(!rerender);

					navigation.navigate('WalletView');
				}
			} catch (e) {
				Alert.alert(
					'Ledger unavailable',
					'Please make sure your device is unlocked and the Ethereum app is running'
				);
			}
		};

		connectAndUnlockDevice();
	}, [KeyringController, navigation, rerender, transport]);

	useEffect(() => {
		AccountTrackerController.syncWithAddresses([defaultAccount]);
	}, [AccountTrackerController, defaultAccount]);

	useEffect(() => {
		if (Platform.OS === 'ios') {
			check(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL).then((result) => {
				switch (result) {
					case RESULTS.UNAVAILABLE:
						Alert.alert('Bluetooth unavailable', 'Bluetooth is not available for this device');
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
									await requestPermission(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
								},
							},
						]);
						break;
					case RESULTS.BLOCKED:
						Alert.alert(
							'Access blocked',
							'Bluetooth access was blocked by this device. Please enable access from settings.'
						);
						break;
					case RESULTS.GRANTED:
						setHasBluetoothPermission(true);
						break;
				}
			});
		} else if (Platform.OS === 'android') {
			checkMultiple([PERMISSIONS.ANDROID.BLUETOOTH_CONNECT, PERMISSIONS.ANDROID.BLUETOOTH_SCAN]).then(
				(statuses) => {
					//TODO
				}
			);
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
