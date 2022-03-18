import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TextStyle, Dimensions } from 'react-native';
import { mockTheme, useAppThemeFromContext } from '../../../util/theme';
import { fontStyles } from '../../../styles/common';

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background.default,
		},
		connectLedgerWrapper: {
			marginLeft: Dimensions.get('screen').width * 0.07,
		},
		ledgerImage: {
			width: 68,
			height: 68,
		},
		connectLedgerText: {
			...(fontStyles.normal as TextStyle),
			fontSize: 24,
		},
	});

const LedgerConnect = () => {
	const { colors } = useAppThemeFromContext() || mockTheme;
	const styles = createStyles(colors);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.connectLedgerWrapper}>
				<Image source={require('../../../images/ledger.png')} style={styles.ledgerImage} />
				<Text style={styles.connectLedgerText}> Connect Ledger </Text>
			</View>
		</SafeAreaView>
	);
};

export default LedgerConnect;
