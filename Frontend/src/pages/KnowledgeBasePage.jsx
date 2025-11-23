import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, HelpCircle, Scale, FileText, ChevronDown, ThumbsUp, ThumbsDown, Filter } from "lucide-react";
import apiClient from "../api/axiosConfig";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";
import { useTranslation } from "react-i18next";

const KnowledgeBasePage = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("faqs");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const [faqs, setFaqs] = useState([]);
  const [rights, setRights] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, category, i18n.language]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { language: i18n.language };
      if (category) params.category = category;

      if (activeTab === "faqs") {
        const response = await apiClient.get("/knowledgebase/faqs", { params });
        setFaqs(response.data.data);
      } else if (activeTab === "rights") {
        const response = await apiClient.get("/knowledgebase/legal-rights", { params });
        setRights(response.data.data);
      } else if (activeTab === "guides") {
        const response = await apiClient.get("/knowledgebase/guides", { params });
        setGuides(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchData();
      return;
    }

    setLoading(true);
    try {
      const params = { search: searchQuery, language: i18n.language };
      if (category) params.category = category;

      if (activeTab === "faqs") {
        const response = await apiClient.get("/knowledgebase/faqs", { params });
        setFaqs(response.data.data);
      } else if (activeTab === "rights") {
        const response = await apiClient.get("/knowledgebase/legal-rights", { params });
        setRights(response.data.data);
      } else if (activeTab === "guides") {
        const response = await apiClient.get("/knowledgebase/guides", { params });
        setGuides(response.data.data);
      }
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (id, helpful) => {
    try {
      const endpoint = activeTab === "faqs" 
        ? `/knowledgebase/faqs/${id}/feedback`
        : `/knowledgebase/guides/${id}/feedback`;
      
      await apiClient.post(endpoint, { helpful });
      toast.success("Thank you for your feedback!");
      fetchData();
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  };

  const categories = {
    faqs: ['general', 'legal-process', 'documentation', 'rights', 'other'],
    rights: ['fundamental-rights', 'consumer-rights', 'labor-rights', 'women-rights', 'child-rights', 'property-rights', 'other'],
    guides: ['filing-complaint', 'documentation', 'court-process', 'government-schemes', 'legal-aid', 'other']
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-center gap-3">
            <BookOpen className="text-cyan-500" size={40} />
            Knowledge Base
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Find answers, learn about your rights, and get step-by-step guides
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          {[
            { id: "faqs", label: "FAQs", icon: <HelpCircle size={20} /> },
            { id: "rights", label: "Legal Rights", icon: <Scale size={20} /> },
            { id: "guides", label: "Guides", icon: <FileText size={20} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCategory(""); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-cyan-500 text-white shadow-lg"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-medium transition-colors"
            >
              Search
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Filter size={20} className="text-slate-500" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-cyan-500"
            >
              <option value="">All Categories</option>
              {categories[activeTab]?.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "faqs" && faqs.map((faq) => (
              <motion.div
                key={faq._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === faq._id ? null : faq._id)}
                  className="w-full p-6 text-left flex items-start justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {faq.question}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                        {faq.category.replace(/-/g, ' ')}
                      </span>
                      <span>{faq.views} views</span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`text-slate-400 transition-transform ${expandedId === faq._id ? 'rotate-180' : ''}`}
                    size={24}
                  />
                </button>
                {expandedId === faq._id && (
                  <div className="px-6 pb-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <p className="text-slate-700 dark:text-slate-300 mb-4 whitespace-pre-wrap">
                      {faq.answer}
                    </p>
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Was this helpful?</span>
                      <button
                        onClick={() => handleFeedback(faq._id, true)}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 transition-colors"
                      >
                        <ThumbsUp size={16} />
                        <span className="text-sm">{faq.helpful}</span>
                      </button>
                      <button
                        onClick={() => handleFeedback(faq._id, false)}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                      >
                        <ThumbsDown size={16} />
                        <span className="text-sm">{faq.notHelpful}</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {activeTab === "rights" && rights.map((right) => (
              <motion.div
                key={right._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Scale className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {right.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {right.description}
                    </p>
                    <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 mb-4">
                      <p className="whitespace-pre-wrap">{right.content}</p>
                    </div>
                    {right.relatedLaws && right.relatedLaws.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Related Laws:</h4>
                        <ul className="list-disc list-inside text-slate-700 dark:text-slate-300">
                          {right.relatedLaws.map((law, idx) => (
                            <li key={idx}>{law}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-300">
                        {right.category.replace(/-/g, ' ')}
                      </span>
                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full text-sm text-blue-600 dark:text-blue-400">
                        {right.views} views
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {activeTab === "guides" && guides.map((guide) => (
              <motion.div
                key={guide._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <FileText className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {guide.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {guide.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm">
                        {guide.category.replace(/-/g, ' ')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        guide.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                        guide.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600' :
                        'bg-red-100 dark:bg-red-900/20 text-red-600'
                      }`}>
                        {guide.difficulty}
                      </span>
                      {guide.estimatedTime && (
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full text-sm text-blue-600">
                          {guide.estimatedTime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {guide.steps?.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                        {step.stepNumber}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                          {step.title}
                        </h4>
                        <p className="text-slate-700 dark:text-slate-300 mb-2">
                          {step.description}
                        </p>
                        {step.tips && step.tips.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Tips:</p>
                            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                              {step.tips.map((tip, tipIdx) => (
                                <li key={tipIdx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {step.requiredDocuments && step.requiredDocuments.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Required Documents:</p>
                            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                              {step.requiredDocuments.map((doc, docIdx) => (
                                <li key={docIdx}>{doc}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Was this helpful?</span>
                  <button
                    onClick={() => handleFeedback(guide._id, true)}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 transition-colors"
                  >
                    <ThumbsUp size={16} />
                    <span className="text-sm">{guide.helpful}</span>
                  </button>
                  <button
                    onClick={() => handleFeedback(guide._id, false)}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                  >
                    <ThumbsDown size={16} />
                    <span className="text-sm">{guide.notHelpful}</span>
                  </button>
                </div>
              </motion.div>
            ))}

            {((activeTab === "faqs" && faqs.length === 0) ||
              (activeTab === "rights" && rights.length === 0) ||
              (activeTab === "guides" && guides.length === 0)) && (
              <div className="text-center py-20">
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  No content found. Try adjusting your search or filters.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
