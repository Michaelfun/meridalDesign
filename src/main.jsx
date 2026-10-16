import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed
      ? <p className="p-8">Something went wrong loading this page. Please refresh.</p>
      : this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode><Boundary><BrowserRouter><App /></BrowserRouter></Boundary></StrictMode>,
)
