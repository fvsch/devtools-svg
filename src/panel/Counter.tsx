import * as React from 'react'
import { increment, decrement } from './store'
import { connect } from 'redux-zero/react'

interface CounterProps {
  count: number
  decrement: () => void
  increment: () => void
}

class Counter extends React.Component<CounterProps> {
  render() {
    const { count, decrement, increment } = this.props
    return (
      <div style={s.root}>
        <h1>{count}</h1>
        <div style={s.btns}>
          <button style={s.btn} onClick={decrement}>
            decrement
          </button>
          <button style={s.btn} onClick={increment}>
            increment
          </button>
        </div>
      </div>
    )
  }
}

const s: Styles = {
  root: { fontFamily: 'sans-serif', textAlign: 'center' },
  btns: { display: 'flex', justifyContent: 'center' },
  btn: { margin: 20 }
}

const mapToProps = state => ({
  count: state.count
})

export default connect(mapToProps, { increment, decrement })(Counter)
