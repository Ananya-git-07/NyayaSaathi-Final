// PASTE THIS ENTIRE FILE INTO src/components/PWABadge.jsx

import { useRegisterSW } from 'virtual:pwa-register/react'
import { Download, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

function PWABadge() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  useEffect(() => {
    if (offlineReady) {
      toast.success("App is ready to work offline!")
      setOfflineReady(false)
    }
  }, [offlineReady])

  return (
    <div className="fixed bottom-4 right-4 z-50" role="alert">
      {needRefresh && (
        <div className="bg-slate-800 text-white p-4 rounded-lg shadow-xl border border-slate-700 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Download size={20} className="text-cyan-400" />
            <span className="font-semibold">New content available!</span>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              onClick={() => updateServiceWorker(true)}
            >
              <RefreshCw size={14} /> Reload
            </button>
            <button
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-sm transition-colors"
              onClick={close}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PWABadge