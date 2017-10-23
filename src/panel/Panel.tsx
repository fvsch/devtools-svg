import * as React from 'react'
import { Provider } from 'redux-zero/react'

import store from './store'
import Counter from './Counter'

export default class Panel extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <Counter />
      </Provider>
    )
  }
}
