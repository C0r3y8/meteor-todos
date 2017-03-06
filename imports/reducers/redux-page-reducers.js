import { handleActions } from 'redux-actions';

/* eslint-disable import/prefer-default-export */
export const reduxPageReducer = handleActions({
  REDUX_PAGE_SET_NAME: (state, action) => ({
    ...state,
    name: action.payload
  })
}, { name: 'John Doe' });
/* eslint-enable */
