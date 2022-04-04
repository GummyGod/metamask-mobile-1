import React from 'react';
import { View } from 'react-native';
import { shallow } from 'enzyme';
import LedgerConnect from '.';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

const mockStore = configureMockStore();
const store = mockStore({});

jest.mock('./Scan', () => () => <View>Scan</View>);

describe('LedgerConnect', () => {
	it('should render correctly', () => {
		const wrapper = shallow(
			<Provider store={store}>
				<LedgerConnect />
			</Provider>
		);
		expect(wrapper).toMatchSnapshot();
	});
});
