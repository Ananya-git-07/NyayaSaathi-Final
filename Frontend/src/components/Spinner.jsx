"use client"

import { motion } from "framer-motion"
import { Scale } from "lucide-react"

const Spinner = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mb-4"
      >
        <Scale size={24} className="text-white" />
      </motion.div>
      <p className="text-slate-600 font-medium">Loading...</p>
    </div>
  )
}

export default Spinner
