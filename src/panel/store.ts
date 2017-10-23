import createStore from 'redux-zero'

const store = createStore({
  count: 0
})

export default store
export const decrement = ({ count }) => ({ count: count - 1 })
export const increment = ({ count }) => ({ count: count + 1 })
