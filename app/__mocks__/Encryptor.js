const mockEncryptor = {
	encrypt: jest.fn(),
	decrypt: jest.fn(),
};

const mock = jest.fn().mockImplementation(() => ({ ...mockEncryptor }));

export default mock;
