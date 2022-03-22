import AppEth from '@ledgerhq/hw-app-eth';
import Transport from '@ledgerhq/hw-transport';
import ledgerService from '@ledgerhq/hw-app-eth/lib/services/ledger';
import { LedgerEthTransactionResolution } from '@ledgerhq/hw-app-eth/lib/services/types';
import { rlp, addHexPrefix } from 'ethereumjs-util';
import { TransactionFactory, TypedTransaction } from '@ethereumjs/tx';

const hdPathString = `m/44'/60'/0'/0/0`;
const type = 'Ledger';

interface SerializationOptions {
	hdPath?: string;
	accounts?: Account[];
}

interface Account {
	address: string;
	hdPath: string;
}

export interface EthereumApp {
	getAddress(
		path: string,
		boolDisplay?: boolean,
		boolChaincode?: boolean
	): Promise<{
		publicKey: string;
		address: string;
		chainCode?: string;
	}>;

	signTransaction(
		path: string,
		rawTxHex: string,
		resolution?: LedgerEthTransactionResolution | null
	): Promise<{
		s: string;
		v: string;
		r: string;
	}>;
}
export default class LedgerKeyring {
	public static readonly type = type;

	public readonly type = type;

	private hdPath: string = hdPathString;

	private accounts: Account[] = [];

	private app?: EthereumApp;

	constructor(opts: SerializationOptions = {}) {
		this.deserialize(opts);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	serialize = async (): Promise<SerializationOptions> => ({
		hdPath: this.hdPath,
		accounts: this.accounts,
	});

	// eslint-disable-next-line @typescript-eslint/require-await
	deserialize = async (opts: SerializationOptions): Promise<void> => {
		this.hdPath = opts.hdPath || hdPathString;
		this.accounts = opts.accounts || [];
	};

	// eslint-disable-next-line @typescript-eslint/require-await
	getAccounts = async (): Promise<string[]> => {
		const addresses = this.accounts.map(({ address }) => address);
		return addresses;
	};

	unlock = async (hdPath: string): Promise<string> => {
		const app = this._getApp();
		const account = await app.getAddress(hdPath, false, true);

		return account.address;
	};

	addAccounts = async (n = 1): Promise<string[]> => {
		// The current immplemenation of LedgerKeyring only supports one account
		if (n > 1) {
			throw new Error('LedgerKeyring only supports one account ' + n);
		}

		if (this.accounts.length === 0) {
			const address = await this.unlock(this.hdPath);
			this.accounts.push({
				address,
				hdPath: this.hdPath,
			});
		}

		return this.getAccounts();
	};

	getDefaultAccount = async (): Promise<string> => {
		let accounts = await this.getAccounts();

		if (this.accounts.length === 0) {
			accounts = await this.addAccounts(1);
		}

		return accounts[0];
	};

	signTransaction = async (address: string, tx: TypedTransaction) => {
		const hdPath = this._getHDPathFromAddress(address);

		// `getMessageToSign` will return valid RLP for all transaction types
		const messageToSign = tx.getMessageToSign(false);

		const rawTxHex = Buffer.isBuffer(messageToSign)
			? messageToSign.toString('hex')
			: rlp.encode(messageToSign).toString('hex');

		console.log('before resolveTransaction', rawTxHex);

		const resolution = await ledgerService.resolveTransaction(rawTxHex, {}, {});

		const app = this._getApp();
		const { r, s, v } = await app.signTransaction(hdPath, rawTxHex, resolution);

		console.log('after signTransaction', r, s, v);

		// Because tx will be immutable, first get a plain javascript object that
		// represents the transaction. Using txData here as it aligns with the
		// nomenclature of ethereumjs/tx.
		const txData = tx.toJSON();

		console.log('txData', txData);

		console.log(typeof tx.type);
		console.log(typeof txData.type);
		// console.log(tx.type);
		// console.log(parseInt(2));
		// The fromTxData utility expects a type to support transactions with a type other than 0
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore)
		txData.type = `0x${tx.type}`;

		// The fromTxData utility expects v,r and s to be hex prefixed
		txData.v = addHexPrefix(v);
		txData.r = addHexPrefix(r);
		txData.s = addHexPrefix(s);

		// Adopt the 'common' option from the original transaction and set the
		// returned object to be frozen if the original is frozen.
		const transaction = TransactionFactory.fromTxData(txData, {
			common: tx.common,
			freeze: Object.isFrozen(tx),
		});

		return transaction;
	};

	setTransport = (transport: Transport) => {
		this.app = new AppEth(transport);
	};

	setApp = (app: EthereumApp): void => {
		this.app = app;
	};

	private _getApp = (): EthereumApp => {
		if (!this.app) {
			throw new Error('Ledger app is not initialized. You must call setTransport first.');
		}

		return this.app;
	};

	private _getHDPathFromAddress = (address: string): string => {
		const account = this.accounts.find(
			({ address: accAddress }) => accAddress.toLowerCase() === address.toLowerCase()
		);

		if (!account) {
			throw new Error(`Account not found for address: ${address}`);
		}

		return account.hdPath;
	};
}
