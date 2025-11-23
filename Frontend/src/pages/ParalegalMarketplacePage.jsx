// PASTE THIS ENTIRE FILE INTO src/pages/ParalegalMarketplacePage.jsx

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Filter, Star, MapPin, Shield, Briefcase } from "lucide-react"
import apiClient from "../api/axiosConfig"
import Spinner from "../components/Spinner"
import HireParalegalModal from "../components/HireParalegalModal"

const ParalegalMarketplacePage = () => {
  const [paralegals, setParalegals] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [selectedParalegal, setSelectedParalegal] = useState(null)

  const categories = ["All", "Land", "Aadhaar", "Pension", "Court", "Fraud", "Welfare"]

  useEffect(() => {
    const fetchParalegals = async () => {
      try {
        const response = await apiClient.get("/paralegals")
        setParalegals(response.data)
        setFiltered(response.data)
      } catch (error) {
        console.error("Failed to fetch paralegals")
      } finally {
        setLoading(false)
      }
    }
    fetchParalegals()
  }, [])

  useEffect(() => {
    let result = paralegals

    if (category !== "All") {
      result = result.filter(p => p.areasOfExpertise.includes(category))
    }

    if (search.trim()) {
      result = result.filter(p => 
        p.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.areasOfExpertise.some(area => area.toLowerCase().includes(search.toLowerCase()))
      )
    }

    setFiltered(result)
  }, [search, category, paralegals])

  if (loading) return <div className="h-screen w-full flex items-center justify-center"><Spinner /></div>

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Find a Legal Expert</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">Connect with verified paralegals who speak your language and understand your local laws.</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by name or expertise..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-style pl-10"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                            category === cat 
                            ? "bg-cyan-600 text-white shadow-md" 
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length > 0 ? (
                filtered.map(p => (
                    <motion.div 
                        key={p._id}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
                    >
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                        {p.user.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{p.user.fullName}</h3>
                                        <div className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
                                            <Star size={14} fill="currentColor" />
                                            <span>{p.rating} Rating</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex flex-wrap gap-2">
                                    {p.areasOfExpertise.map(area => (
                                        <span key={area} className="text-xs font-medium px-2.5 py-0.5 rounded bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-800">
                                            {area}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                    <Briefcase size={16} />
                                    <span>{p.active ? "Available Now" : "Busy"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                    <Shield size={16} />
                                    <span>Verified Expert</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                            <button 
                                onClick={() => setSelectedParalegal(p)}
                                className="w-full btn-primary"
                            >
                                Hire Expert
                            </button>
                        </div>
                    </motion.div>
                ))
            ) : (
                <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
                    <Filter className="mx-auto mb-4 opacity-50" size={48} />
                    <p>No paralegals found matching your criteria.</p>
                </div>
            )}
        </div>
      </div>

      {selectedParalegal && (
        <HireParalegalModal 
            isOpen={!!selectedParalegal} 
            onClose={() => setSelectedParalegal(null)} 
            paralegal={selectedParalegal}
            onSuccess={() => {}}
        />
      )}
    </div>
  )
}

export default ParalegalMarketplacePage