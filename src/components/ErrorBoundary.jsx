import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // In production this is where you'd also report to a monitoring service.
    console.error('App crashed:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center px-8 text-center bg-paper">
          <div className="w-14 h-14 rounded-full bg-closedBg flex items-center justify-center mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L14.7 3.86a2 2 0 00-3.4 0z"
                    stroke="#C4433A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-display text-lg font-600 text-ink mb-1">Something went wrong</p>
          <p className="text-sm text-ink/60 mb-5">
            The app hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            onClick={this.handleReload}
            className="bg-accent text-white rounded-xl2 px-6 py-3 font-medium text-sm"
          >
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
