import { getSystemVersion } from 'react-native-device-info';
import { PERMISSIONS, PermissionStatus, RESULTS } from 'react-native-permissions';

type RequiredAndroidPermission =
	| 'android.permission.ACCESS_FINE_LOCATION'
	| 'android.permission.BLUETOOTH_CONNECT'
	| 'android.permission.BLUETOOTH_SCAN';

export const handleIOSBluetoothPermission = (bluetoothPermissionStatus: PermissionStatus) => {
	switch (bluetoothPermissionStatus) {
		case RESULTS.GRANTED:
			return true;
		default:
			return false;
	}
};

export const handleAndroidBluetoothPermissions = (
	bluetoothPermissionStatuses: Record<RequiredAndroidPermission, PermissionStatus>
) => {
	const requiredPermissions = [];
	const parsedSystemVersion = Number(getSystemVersion().split('.')[0]);

	if (parsedSystemVersion > 11) {
		requiredPermissions.push(
			PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
			PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
			PERMISSIONS.ANDROID.BLUETOOTH_CONNECT
		);
	} else if (parsedSystemVersion <= 11) {
		requiredPermissions.push(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
	}

	const permissionStatuses = requiredPermissions.map(
		(permission) => bluetoothPermissionStatuses[permission as RequiredAndroidPermission]
	);

	if (!permissionStatuses.some((p) => p !== RESULTS.GRANTED)) {
		return true;
	}

	return false;
};
