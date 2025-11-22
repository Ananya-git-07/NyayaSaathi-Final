// PASTE THIS ENTIRE FILE INTO src/pages/SubscriptionPage.jsx

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Zap, Shield, Star, Loader2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import apiClient from "../api/axiosConfig"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

const plans = [
  {
    name: "Basic",
    price: "₹499",
    period: "/month",
    features: ["Unlimited Voice Queries", "5 Document Generations", "Basic Legal Support", "Ad-free Experience"],
    color: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    btnColor: "btn-secondary",
    popular: false
  },
  {
    name: "Premium",
    price: "₹999",
    period: "/month",
    features: ["Everything in Basic", "Unlimited Documents", "Priority Paralegal Access", "Kiosk Management Tools"],
    color: "bg-gradient-to-b from-cyan-50 to-white dark:from-slate-800 dark:to-slate-900 border-cyan-200 dark:border-cyan-800",
    btnColor: "btn-primary",
    popular: true
  }
]

const SubscriptionPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (planName) => {
    setLoading(true)
    const toastId = toast.loading("Processing payment...")

    try {
      // 1. Identify if we are subscribing as User or Kiosk
      let orgType = "User";
      let orgRef = user._id;

      // NOTE: In a real app, we would fetch the Kiosk ID if the user is an employee.
      // For this demo, we assume Citizens/Paralegals subscribe for themselves.
      // Employees usually rely on their Kiosk's existing subscription.
      
      const payload = {
        organizationType: orgType,
        organizationRef: orgRef,
        plan: planName,
        amountPaid: planName === "Basic" ? 499 : 999,
        expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // +1 Month
        paymentStatus: "Active"
      }

      await apiClient.post("/subscriptions", payload)
      
      toast.success(`Welcome to ${planName} Plan!`, { id: toastId })
      setTimeout(() => navigate("/dashboard"), 1000)

    } catch (error) {
      console.error(error)
      toast.error("Subscription failed. Please try again.", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20 px-4">
      <div className="max-w-5xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
          Choose the Right Plan for <span className="gradient-text">Justice</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Unlock powerful AI tools, unlimited document generation, and priority access to legal experts.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 px-4">
        {plans.map((plan) => (
          <motion.div
            key={plan.name}
            whileHover={{ y: -5 }}
            className={`relative rounded-2xl p-8 border shadow-xl ${plan.color}`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                Most Popular
              </div>
            )}
            
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-slate-500 dark:text-slate-400">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" size={20} />
                  <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.name)}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                plan.popular 
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 shadow-cyan-500/25" 
                  : "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              }`}
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "Subscribe Now"}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto mt-20 text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Shield size={20} />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={20} />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={20} />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPage