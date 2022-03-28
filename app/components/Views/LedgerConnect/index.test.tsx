import React from 'react';
import { shallow } from 'enzyme';
import LedgerConnect from './';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

const mockStore = configureMockStore();
const store = mockStore({});

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
