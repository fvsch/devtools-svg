import * as React from 'react'
import { render } from 'react-dom'
import Panel from './panel/Panel'

function start() {
  try {
    render(<Panel />, document.body)
  } catch (error) {
    document.body.insertAdjacentText('afterbegin', error)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start)
} else {
  start()
}
