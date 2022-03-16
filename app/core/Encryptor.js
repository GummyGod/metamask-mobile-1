import { NativeModules } from 'react-native';

/**
 * Class that exposes two public methods: Encrypt and Decrypt
 * This is used by the KeyringController to encrypt / decrypt the state
 * which contains sensitive seed words and addresses
 */
export default class Encryptor {
	key = null;

	_generateSalt(byteCount = 32) {
		const view = new Uint8Array(byteCount);
		global.crypto.getRandomValues(view);
		// eslint-disable-next-line no-undef
		const b64encoded = btoa(String.fromCharCode.apply(null, view));
		return b64encoded;
	}

	_generateKey = (password, salt, lib) =>
		lib === 'original'
			? NativeModules.Aes.pbkdf2(password, salt, 5000, 256)
			: NativeModules.AesForked.pbkdf2(password, salt);

	_keyFromPassword = (password, salt, lib) => this._generateKey(password, salt, lib);

	_encryptWithKey = async (text, keyBase64) => {
		const iv = await NativeModules.Aes.randomKey(16);
		return NativeModules.Aes.encrypt(text, keyBase64, iv).then((cipher) => ({ cipher, iv }));
	};

	_decryptWithKey = (encryptedData, key, lib) =>
		lib === 'original'
			? NativeModules.Aes.decrypt(encryptedData.cipher, key, encryptedData.iv)
			: NativeModules.AesForked.decrypt(encryptedData.cipher, key, encryptedData.iv);

	/**
	 * Encrypts a JS object using a password (and AES encryption with native libraries)
	 *
	 * @param {string} password - Password used for encryption
	 * @param {object} object - Data object to encrypt
	 * @returns - Promise resolving to stringified data
	 */
	encrypt = async (password, object) => {
		const salt = this._generateSalt(16);
		console.log('salt', salt);
		const key = await this._keyFromPassword(password, salt, 'original');
		console.log('key', salt);
		const result = await this._encryptWithKey(JSON.stringify(object), key);
		result.salt = salt;
		result.lib = 'original';
		return JSON.stringify(result);
	};

	/**
	 * Decrypts an encrypted JS object (encryptedString)
	 * using a password (and AES deccryption with native libraries)
	 *
	 * @param {string} password - Password used for decryption
	 * @param {string} encryptedString - String to decrypt
	 * @returns - Promise resolving to decrypted data object
	 */
	decrypt = async (password, encryptedString) => {
		console.log('decrypt is called');
		const encryptedData = JSON.parse(encryptedString);
		const key = await this._keyFromPassword(password, encryptedData.salt, encryptedData.lib);
		console.log('key', key);
		const data = await this._decryptWithKey(encryptedData, key, encryptedData.lib);
		// ^ this is the issue
		console.log('data', data);
		return JSON.parse(data);
	};
}
